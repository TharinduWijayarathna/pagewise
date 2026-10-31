import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  addDoc as fsAddDoc,
} from '@react-native-firebase/firestore';
import { Directory, File, Paths } from 'expo-file-system';
import { MAX_PDF_BYTES, PLAN_LIMITS } from '@/constants/limits';
import type { Doc, Folder, OrganizePlan } from '@/types/document';
import { FOLDER_COLOR_KEYS, isFolderColor, nextFolderColor, type FolderColorKey } from '@/constants/folderColors';
import { dayKey } from '@/utils/format';
import { db, getModel } from '@/lib/firebase';
import { useAuth } from '@/state/auth';

export type Msg = { id: string; role: 'user' | 'ai'; text: string; at: number };
export type Notice = { id: string; title: string; body: string; at: number; read: boolean; docId?: string };
export type Stats = { totalQuestions: number; questionsByDay: Record<string, number> };

type LibraryCtx = {
  docs: Doc[];
  loading: boolean;
  notices: Notice[];
  stats: Stats;
  /** Partial answer text while Gemini is streaming, per document. */
  streaming: Record<string, string | undefined>;
  typing: Record<string, boolean>;
  getDoc: (id?: string) => Doc | undefined;
  hasLocalFile: (id: string) => boolean;
  addDoc: (file: { uri: string; name: string; size?: number }) => Promise<string>;
  retryAnalysis: (id: string) => Promise<void>;
  removeDoc: (id: string) => Promise<void>;
  send: (docId: string, text: string, history: Msg[]) => Promise<void>;
  clearChat: (docId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /* folders */
  folders: Folder[];
  createFolder: (name: string, color?: FolderColorKey) => Promise<string>;
  updateFolder: (id: string, patch: { name?: string; color?: FolderColorKey }) => Promise<void>;
  /** Deletes the folder; its documents become unfiled (they are not deleted). */
  deleteFolder: (id: string) => Promise<void>;
  moveDoc: (docId: string, folderId: string | null) => Promise<void>;
  /** Ask Gemini to propose folders for the library (optionally following an instruction). */
  suggestOrganization: (instruction?: string) => Promise<OrganizePlan>;
  applyOrganization: (plan: OrganizePlan) => Promise<void>;
};

const Ctx = createContext<LibraryCtx | null>(null);

const millis = (v: unknown) => {
  const t = v as { toMillis?: () => number } | null | undefined;
  return t?.toMillis?.() ?? Date.now(); // pending server timestamps read as null locally
};

/* ---------- local PDF storage (files stay on the device) ---------- */

const docsDir = () => new Directory(Paths.document, 'pdfs');
const localFile = (id: string) => new File(docsDir(), `${id}.pdf`);

async function readPdfBase64(id: string) {
  const f = localFile(id);
  if (!f.exists) throw new Error('This PDF isn’t on this device anymore. Delete it and upload it again.');
  return f.base64();
}

const pdfPart = (data: string) => ({ type: 'inlineData' as const, inlineData: { mimeType: 'application/pdf', data } });
const textPart = (text: string) => ({ type: 'text' as const, text });

/* ---------- Gemini calls ---------- */

async function analyzePdf(id: string) {
  const model = await getModel('analyze');
  const res = await model.generateContent([
    pdfPart(await readPdfBase64(id)),
    textPart(
      `Read this PDF and reply with JSON only, in this shape:
{"title": string (short, human-friendly), "pages": number (total page count), "summary": string (2-3 sentences), "highlights": string[] (3-5 key facts, each under 12 words)}`,
    ),
  ]);
  const raw = res.response.text().replace(/^```(?:json)?|```$/g, '').trim();
  const json = JSON.parse(raw) as { title?: string; pages?: number; summary?: string; highlights?: string[] };
  return {
    title: json.title?.slice(0, 120),
    pages: Number.isFinite(json.pages) ? Math.max(1, Math.round(json.pages!)) : undefined,
    summary: json.summary ?? '',
    highlights: Array.isArray(json.highlights) ? json.highlights.slice(0, 5) : [],
  };
}

function friendlyAiError(err: unknown) {
  if (__DEV__) console.warn('[Pagewise] Gemini request failed:', (err as Error)?.message ?? err);
  const msg = String((err as Error)?.message ?? err);
  if (/api-not-enabled/i.test(msg)) return 'Gemini isn’t enabled for this Firebase project yet (AI Logic → Get started).';
  if (/app.?check/i.test(msg)) return 'This app couldn’t be verified. Please update Pagewise or try again later.';
  if (/quota|429|rate/i.test(msg)) return 'Pagewise is busy right now. Please try again in a minute.';
  if (/413|too large|payload/i.test(msg)) return 'This PDF is too large to analyze. Try one under 14 MB.';
  if (/network|fetch/i.test(msg)) return 'No internet connection. Check your network and try again.';
  return msg.length < 160 ? msg : 'Something went wrong while reading the document.';
}

/* ---------- provider ---------- */

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState<Stats>({ totalQuestions: 0, questionsByDay: {} });
  const [streaming, setStreaming] = useState<Record<string, string | undefined>>({});
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [folders, setFolders] = useState<Folder[]>([]);

  // Clear everything when the signed-in user changes.
  useEffect(() => {
    setDocs([]);
    setNotices([]);
    setStats({ totalQuestions: 0, questionsByDay: {} });
    setFolders([]);
    setLoading(!!uid);
  }, [uid]);

  // Firestore stops a listener for good after an error (e.g. rules not yet published).
  // Bumping `attempt` re-subscribes everything, with a growing delay (5s, 10s, … up to 60s).
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onListenerError = useCallback(
    (name: string) => (err: Error) => {
      if (__DEV__) console.warn(`[Pagewise] ${name} listener:`, err.message);
      if (retryTimer.current) return;
      retryTimer.current = setTimeout(() => {
        retryTimer.current = undefined;
        setAttempt((a) => a + 1);
      }, Math.min(60_000, 5_000 * (attempt + 1)));
    },
    [attempt],
  );
  useEffect(() => () => clearTimeout(retryTimer.current), []);

  // Live subscriptions for the signed-in user.
  useEffect(() => {
    if (!uid) return;
    const unsubs = [
      onSnapshot(
        query(collection(db(), 'users', uid, 'documents'), orderBy('createdAt', 'desc')),
        (snap) => {
          if (!snap) return;
          setDocs(
            snap.docs.map((d) => {
              const x = d.data();
              return {
                id: d.id,
                title: x.title ?? x.fileName ?? 'Untitled',
                fileName: x.fileName ?? 'document.pdf',
                pages: x.pages ?? 0,
                sizeBytes: x.sizeBytes ?? 0,
                status: x.status ?? 'ready',
                error: x.error,
                summary: x.summary,
                highlights: x.highlights,
                createdAt: millis(x.createdAt),
                lastAt: x.lastAt ? millis(x.lastAt) : undefined,
                lastQuestion: x.lastQuestion,
                lastAnswer: x.lastAnswer,
                questionCount: x.questionCount ?? 0,
                folderId: x.folderId ?? null,
              } satisfies Doc;
            }),
          );
          setLoading(false);
        },
        (err) => {
          setLoading(false);
          onListenerError('documents')(err);
        },
      ),
      onSnapshot(
        query(collection(db(), 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(30)),
        (snap) =>
          snap &&
          setNotices(
            snap.docs.map((d) => {
              const x = d.data();
              return { id: d.id, title: x.title, body: x.body, docId: x.docId, read: !!x.read, at: millis(x.createdAt) };
            }),
          ),
        onListenerError('notifications'),
      ),
      onSnapshot(
        query(collection(db(), 'users', uid, 'folders'), orderBy('name', 'asc')),
        (snap) => {
          if (!snap) return;
          // Folders made before colours existed get a stable colour from their position.
          setFolders(
            snap.docs.map((d, i) => {
              const x = d.data();
              return {
                id: d.id,
                name: x.name ?? 'Folder',
                color: isFolderColor(x.color) ? x.color : FOLDER_COLOR_KEYS[i % FOLDER_COLOR_KEYS.length],
                createdAt: millis(x.createdAt),
              };
            }),
          );
        },
        onListenerError('folders'),
      ),
      onSnapshot(doc(db(), 'users', uid), (snap) => {
        const x = snap?.data();
        setStats({ totalQuestions: x?.totalQuestions ?? 0, questionsByDay: x?.questionsByDay ?? {} });
      }, onListenerError('profile')),
    ];
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-subscribe on user change or retry only
  }, [uid, attempt]);

  const getDoc = useCallback((id?: string) => docs.find((d) => d.id === id), [docs]);
  const hasLocalFile = useCallback((id: string) => localFile(id).exists, []);

  const notify = useCallback(
    async (title: string, body: string, docId?: string) => {
      if (!uid) return;
      await fsAddDoc(collection(db(), 'users', uid, 'notifications'), {
        title,
        body,
        docId: docId ?? null,
        read: false,
        createdAt: serverTimestamp(),
      });
    },
    [uid],
  );

  const runAnalysis = useCallback(
    async (id: string, fallbackTitle: string) => {
      if (!uid) return;
      const ref = doc(db(), 'users', uid, 'documents', id);
      try {
        const meta = await analyzePdf(id);
        await updateDoc(ref, {
          status: 'ready',
          error: null,
          title: meta.title || fallbackTitle,
          ...(meta.pages ? { pages: meta.pages } : {}),
          summary: meta.summary,
          highlights: meta.highlights,
        });
        await notify(`${meta.title || fallbackTitle} is ready`, 'Pagewise has read your document. Start asking questions.', id);
      } catch (err) {
        await updateDoc(ref, { status: 'error', error: friendlyAiError(err) });
      }
    },
    [uid, notify],
  );

  const addDoc = useCallback<LibraryCtx['addDoc']>(
    async (picked) => {
      if (!uid || !user) throw new Error('Please log in again.');
      const limitForPlan = PLAN_LIMITS[user.plan];
      if (docs.length >= limitForPlan)
        throw new Error(`Your ${user.plan === 'pro' ? 'Pro' : 'Free'} plan allows ${limitForPlan} documents. Delete one or upgrade.`);

      const src = new File(picked.uri);
      const size = picked.size ?? src.size ?? 0;
      if (size > MAX_PDF_BYTES) throw new Error('This PDF is larger than 14 MB. Please choose a smaller file.');

      const ref = doc(collection(db(), 'users', uid, 'documents'));
      const dir = docsDir();
      if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
      await src.copy(localFile(ref.id));

      const fallbackTitle = picked.name.replace(/\.pdf$/i, '');
      await setDoc(ref, {
        title: fallbackTitle,
        fileName: picked.name,
        pages: 0,
        sizeBytes: size,
        status: 'processing',
        questionCount: 0,
        createdAt: serverTimestamp(),
      });
      // Analysis continues in the background; the upload screen watches the status.
      runAnalysis(ref.id, fallbackTitle);
      return ref.id;
    },
    [uid, user, docs.length, runAnalysis],
  );

  const retryAnalysis = useCallback(
    async (id: string) => {
      if (!uid) return;
      const d = docs.find((x) => x.id === id);
      await updateDoc(doc(db(), 'users', uid, 'documents', id), { status: 'processing', error: null });
      await runAnalysis(id, d?.title ?? 'Document');
    },
    [uid, docs, runAnalysis],
  );

  const deleteMessages = useCallback(
    async (docId: string) => {
      if (!uid) return;
      const snap = await getDocs(collection(db(), 'users', uid, 'documents', docId, 'messages'));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db());
        snap.docs.slice(i, i + 400).forEach((m) => batch.delete(m.ref));
        await batch.commit();
      }
    },
    [uid],
  );

  const removeDoc = useCallback(
    async (id: string) => {
      if (!uid) return;
      await deleteMessages(id);
      await deleteDoc(doc(db(), 'users', uid, 'documents', id));
      const f = localFile(id);
      if (f.exists) f.delete();
    },
    [uid, deleteMessages],
  );

  const send = useCallback<LibraryCtx['send']>(
    async (docId, text, history) => {
      const q = text.trim();
      if (!uid || !q) return;
      const docRef = doc(db(), 'users', uid, 'documents', docId);
      const msgs = collection(db(), 'users', uid, 'documents', docId, 'messages');
      await fsAddDoc(msgs, { role: 'user', text: q, createdAt: serverTimestamp() });

      setTyping((t) => ({ ...t, [docId]: true }));
      setStreaming((s) => ({ ...s, [docId]: '' }));
      let answer = '';
      try {
        const model = await getModel('chat');
        // The API is stateless: send the PDF first, then the recent conversation.
        const chat = model.startChat({
          history: [
            { role: 'user', parts: [pdfPart(await readPdfBase64(docId)), textPart('This is the document to discuss.')] },
            { role: 'model', parts: [textPart('Got it. Ask me anything about this document.')] },
            ...history.slice(-12).map((m) => ({
              role: m.role === 'user' ? ('user' as const) : ('model' as const),
              parts: [textPart(m.text)],
            })),
          ],
        });
        const result = await chat.sendMessageStream(q);
        for await (const chunk of result.stream) {
          answer += chunk.text();
          setStreaming((s) => ({ ...s, [docId]: answer }));
        }
      } catch (err) {
        answer = `Sorry, I couldn’t answer that. ${friendlyAiError(err)}`;
      } finally {
        setTyping((t) => ({ ...t, [docId]: false }));
      }

      await fsAddDoc(msgs, { role: 'ai', text: answer.trim(), createdAt: serverTimestamp() });
      setStreaming((s) => ({ ...s, [docId]: undefined }));
      await updateDoc(docRef, {
        lastQuestion: q,
        lastAnswer: answer.trim().slice(0, 300),
        lastAt: serverTimestamp(),
        questionCount: increment(1),
      });
      // Usage stats are best-effort: never let them break the chat.
      try {
        await updateDoc(doc(db(), 'users', uid), {
          totalQuestions: increment(1),
          [`questionsByDay.${dayKey()}`]: increment(1),
        });
      } catch (err) {
        if (__DEV__) console.warn('[Pagewise] Could not update usage stats:', (err as Error)?.message);
      }
    },
    [uid],
  );

  const clearChat = useCallback(
    async (docId: string) => {
      if (!uid) return;
      await deleteMessages(docId);
      await updateDoc(doc(db(), 'users', uid, 'documents', docId), {
        lastQuestion: null,
        lastAnswer: null,
        lastAt: null,
        questionCount: 0,
      });
    },
    [uid, deleteMessages],
  );

  const markAllRead = useCallback(async () => {
    if (!uid) return;
    const unread = notices.filter((n) => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(db());
    unread.forEach((n) => batch.update(doc(db(), 'users', uid, 'notifications', n.id), { read: true }));
    await batch.commit();
  }, [uid, notices]);


  /* ---------- folders ---------- */

  const createFolder = useCallback(
    async (name: string, color?: FolderColorKey) => {
      if (!uid) throw new Error('Please log in again.');
      const clean = name.trim().slice(0, 40);
      if (!clean) throw new Error('Give the folder a name.');
      const existing = folders.find((f) => f.name.toLowerCase() === clean.toLowerCase());
      if (existing) return existing.id;
      const ref = doc(collection(db(), 'users', uid, 'folders'));
      await setDoc(ref, { name: clean, color: color ?? nextFolderColor(folders.map((f) => f.color)), createdAt: serverTimestamp() });
      return ref.id;
    },
    [uid, folders],
  );

  const updateFolder = useCallback(
    async (id: string, patch: { name?: string; color?: FolderColorKey }) => {
      if (!uid) return;
      const update: Record<string, string> = {};
      if (patch.name !== undefined) {
        const clean = patch.name.trim().slice(0, 40);
        if (!clean) throw new Error('Give the folder a name.');
        update.name = clean;
      }
      if (patch.color) update.color = patch.color;
      await updateDoc(doc(db(), 'users', uid, 'folders', id), update);
    },
    [uid],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      if (!uid) return;
      const batch = writeBatch(db());
      docs.filter((d) => d.folderId === id).forEach((d) => batch.update(doc(db(), 'users', uid, 'documents', d.id), { folderId: null }));
      batch.delete(doc(db(), 'users', uid, 'folders', id));
      await batch.commit();
    },
    [uid, docs],
  );

  const moveDoc = useCallback(
    async (docId: string, folderId: string | null) => {
      if (!uid) return;
      await updateDoc(doc(db(), 'users', uid, 'documents', docId), { folderId });
    },
    [uid],
  );

  const suggestOrganization = useCallback(
    async (instruction?: string): Promise<OrganizePlan> => {
      const ready = docs.filter((d) => d.status === 'ready');
      if (ready.length < 2) throw new Error('Add at least two documents for Pagewise to organize.');
      const model = await getModel('analyze');
      const library = ready.map((d) => ({
        id: d.id,
        title: d.title,
        summary: (d.summary ?? '').slice(0, 280),
        highlights: (d.highlights ?? []).slice(0, 3),
        currentFolderId: d.folderId ?? null,
      }));
      const prompt = `You organize a user's PDF library into folders.

Existing folders (reuse one when it fits, by putting its id in "existingFolderId"):
${JSON.stringify(folders.map((f) => ({ id: f.id, name: f.name })))}

Documents:
${JSON.stringify(library)}

${instruction?.trim() ? `The user's instruction (follow it): "${instruction.trim()}"` : 'Group documents by topic or purpose.'}

Rules:
- Use 2 to 6 folders. Folder names are short (1–3 words), Title Case, no emoji.
- Put every document id in exactly one folder. Only use the ids given.
- Prefer reusing existing folders over creating near-duplicates.

Reply with JSON only:
{"folders": [{"name": string, "existingFolderId": string | null, "docIds": string[]}]}`;
      const res = await model.generateContent(prompt);
      const raw = res.response.text().replace(/^```(?:json)?|```$/g, '').trim();
      const parsed = JSON.parse(raw) as OrganizePlan;

      // Validate: known ids only, each document once, drop empty folders.
      const valid = new Set(ready.map((d) => d.id));
      const knownFolders = new Set(folders.map((f) => f.id));
      const seen = new Set<string>();
      const plan: OrganizePlan = {
        folders: (parsed.folders ?? [])
          .map((f) => ({
            name: String(f.name ?? '').trim().slice(0, 40) || 'Folder',
            existingFolderId: f.existingFolderId && knownFolders.has(f.existingFolderId) ? f.existingFolderId : null,
            docIds: (f.docIds ?? []).filter((id) => valid.has(id) && !seen.has(id) && (seen.add(id), true)),
          }))
          .filter((f) => f.docIds.length > 0),
      };
      if (!plan.folders.length) throw new Error('Pagewise couldn’t find a good way to group these documents. Try an instruction.');
      return plan;
    },
    [docs, folders],
  );

  const applyOrganization = useCallback(
    async (plan: OrganizePlan) => {
      if (!uid) return;
      const batch = writeBatch(db());
      const used = folders.map((f) => f.color as string);
      for (const f of plan.folders) {
        let folderId = f.existingFolderId ?? folders.find((x) => x.name.toLowerCase() === f.name.toLowerCase())?.id;
        if (!folderId) {
          const ref = doc(collection(db(), 'users', uid, 'folders'));
          const color = nextFolderColor(used);
          used.push(color);
          batch.set(ref, { name: f.name, color, createdAt: serverTimestamp() });
          folderId = ref.id;
        }
        f.docIds.forEach((id) => batch.update(doc(db(), 'users', uid, 'documents', id), { folderId }));
      }
      await batch.commit();
    },
    [uid, folders],
  );

  const value = useMemo(
    () => ({
      docs,
      loading,
      notices,
      stats,
      streaming,
      typing,
      getDoc,
      hasLocalFile,
      addDoc,
      retryAnalysis,
      removeDoc,
      send,
      clearChat,
      markAllRead,
      folders,
      createFolder,
      updateFolder,
      deleteFolder,
      moveDoc,
      suggestOrganization,
      applyOrganization,
    }),
    [docs, loading, notices, stats, streaming, typing, getDoc, hasLocalFile, addDoc, retryAnalysis, removeDoc, send, clearChat, markAllRead, folders, createFolder, updateFolder, deleteFolder, moveDoc, suggestOrganization, applyOrganization],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLibrary must be used inside LibraryProvider');
  return c;
}

/** Live chat messages for one document. */
export function useMessages(docId?: string) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  useEffect(() => {
    setMsgs([]);
    if (!user || !docId) return;
    return onSnapshot(
      query(collection(db(), 'users', user.uid, 'documents', docId, 'messages'), orderBy('createdAt', 'asc')),
      (snap) =>
        setMsgs(
          snap.docs.map((d) => {
            const x = d.data();
            return { id: d.id, role: x.role === 'user' ? 'user' : 'ai', text: x.text ?? '', at: millis(x.createdAt) };
          }),
        ),
    );
  }, [user, docId]);
  return msgs;
}
