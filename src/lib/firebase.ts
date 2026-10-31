import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { initializeAppCheck, type AppCheck } from '@react-native-firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, type GenerativeModel } from '@react-native-firebase/ai';

/**
 * Gemini model used for document Q&A. Swap for a larger model if answers need
 * more depth (check the Firebase AI Logic docs for current model names).
 */
export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

/**
 * Optional App Check debug token for development builds. Register it in
 * Firebase console → App Check → Apps → ⋮ → Manage debug tokens, then put it
 * in `.env` as EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN. Never used in release builds.
 */
const DEBUG_TOKEN = __DEV__ ? process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN : undefined;

let appCheckPromise: Promise<AppCheck> | null = null;

/**
 * App Check must be initialised before any Firebase backend call. From
 * Nov 2, 2026 Firebase AI Logic rejects requests without a valid token.
 */
export function initFirebase() {
  if (!appCheckPromise) {
    // Typed as sync in some versions, async in others — normalise to a Promise.
    appCheckPromise = Promise.resolve(initializeAppCheck(getApp(), {
      provider: {
        providerOptions: {
          android: { provider: __DEV__ ? 'debug' : 'playIntegrity', debugToken: DEBUG_TOKEN },
          apple: { provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback', debugToken: DEBUG_TOKEN },
          web: { provider: 'reCaptchaV3', siteKey: 'unused' },
        },
      },
      isTokenAutoRefreshEnabled: true,
    }));
  }
  return appCheckPromise;
}

export const auth = () => getAuth();
export const db = () => getFirestore();

const models: Partial<Record<'chat' | 'analyze', GenerativeModel>> = {};

const SYSTEM_PROMPT = `You are Pagewise, an assistant that answers questions about the PDF the user uploaded.

Rules:
- Answer only from the document. If the answer isn't there, say so in one sentence.
- Cite pages after the facts they support, written exactly like "(p. 4)" or "(pp. 4–5)".
- Be concise and easy to scan.

Formatting (the app renders these, nothing else):
- Start with a one-sentence direct answer.
- Then, if helpful, use "- " bullets or "1. " numbered steps, one idea per line.
- Use **bold** for key numbers, names and terms.
- For longer answers you may add short section titles on their own line starting with "### ".
- Do not use tables, code blocks, links or nested bullets.`;

/**
 * `chat` answers questions; `analyze` returns JSON metadata for a newly uploaded PDF.
 * App Check and Auth are passed so requests are attested and tied to the user.
 */
export async function getModel(kind: 'chat' | 'analyze' = 'chat') {
  if (!models[kind]) {
    const appCheck = await initFirebase();
    const ai = getAI(getApp(), { backend: new GoogleAIBackend(), appCheck, auth: getAuth() });
    models[kind] =
      kind === 'chat'
        ? getGenerativeModel(ai, { model: GEMINI_MODEL, systemInstruction: SYSTEM_PROMPT })
        : getGenerativeModel(ai, { model: GEMINI_MODEL, generationConfig: { responseMimeType: 'application/json' } });
  }
  return models[kind]!;
}
