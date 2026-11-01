import { useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { DocumentOverview } from '@/components/document/DocumentOverview';
import { AdminPanel } from '@/components/document/AdminPanel';
import { StudyPanel } from '@/components/document/StudyPanel';
import { openPage } from '@/components/document/PageChip';
import type { DocMode } from '@/types/document';
import {
  AnalyzeIcon,
  FileTextIcon,
  MicIcon,
  SendIcon,
  ShareCirclesIcon,
  SummaryIcon,
  UpdateIcon,
} from '@/components/ui/Icons';
import { CircleButton, ScreenHeader, goBackOr } from '@/components/ui';
import { useLibrary, useMessages } from '@/state/library';
import { confirm, showActions } from '@/utils/actions';
import { AiBubble, UserBubble } from '@/components/chat/ChatBubble';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { colors, fonts } from '@/constants/theme';

type Quick = { label: string; Icon: typeof SummaryIcon; prompt: string };

/** Quick questions above the composer, tuned to the kind of document. */
const QUICK: Record<DocMode, Quick[]> = {
  general: [
    { label: 'Summaries', Icon: SummaryIcon, prompt: 'Summarize this document in a few bullet points.' },
    { label: 'Analyze', Icon: AnalyzeIcon, prompt: 'Analyze the most important numbers, findings or risks in this document.' },
    { label: 'Update', Icon: UpdateIcon, prompt: 'What are the latest changes, dates or action items mentioned in this document?' },
  ],
  admin: [
    { label: 'What do I owe?', Icon: AnalyzeIcon, prompt: 'What do I have to pay or do, by when? List each obligation with its date and amount.' },
    { label: 'Can I cancel?', Icon: UpdateIcon, prompt: 'How can I cancel, end or get out of this, how much notice is needed, and what would it cost?' },
    { label: 'Plain English', Icon: SummaryIcon, prompt: 'Explain this document in plain English, as if to a friend. What should I watch out for?' },
  ],
  study: [
    { label: 'Explain simply', Icon: SummaryIcon, prompt: 'Explain the main ideas simply, as if teaching a beginner, with one example each.' },
    { label: 'Key terms', Icon: AnalyzeIcon, prompt: 'List the key terms and definitions I need to know from this document.' },
    { label: 'Exam focus', Icon: UpdateIcon, prompt: 'What are the most likely exam questions on this material? Give short model answers.' },
  ],
};

const MODE_LABEL: Record<DocMode, string> = { admin: 'Paperwork', study: 'Study material', general: 'General' };

export default function DocumentChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDoc, typing, streaming, send, clearChat, removeDoc, retryAnalysis, hasLocalFile, folders, setMode } = useLibrary();
  const doc = getDoc(id);
  const msgs = useMessages(id);
  const busy = !!(id && typing[id]);
  const partial = id ? streaming[id] : undefined;
  const onDevice = id ? hasLocalFile(id) : false;
  const [text, setText] = useState('');
  const voice = useVoiceInput(setText);
  const scroll = useRef<ScrollViewInstance>(null);

  if (!doc) {
    return (
      <Background>
        <SafeAreaView style={{ flex: 1 }}>
          <ScreenHeader onBack={goBackOr('/home')} title="Document not found" />
          <Text style={styles.missing}>This document may have been deleted.</Text>
        </SafeAreaView>
      </Background>
    );
  }

  const submit = (value = text) => {
    if (!value.trim() || busy || doc.status !== 'ready' || !onDevice) return;
    if (voice.listening) voice.stop();
    send(doc.id, value, msgs);
    setText('');
  };

  const folderName = folders.find((f) => f.id === doc.folderId)?.name;
  // Small delay: on iOS a second action sheet can't open while the first is still closing.
  const changeMode = () =>
    setTimeout(() => showActions('What kind of document is this?', (['admin', 'study', 'general'] as DocMode[]).map((m) => ({
      label: `${MODE_LABEL[m]}${m === doc.mode ? ' ✓' : ''}`,
      onPress: () =>
        m !== doc.mode &&
        setMode(doc.id, m).catch((err) => Alert.alert('Couldn’t switch', (err as Error).message)),
    }))), Platform.OS === 'ios' ? 350 : 0);
  const openMenu = () =>
    showActions(doc.title, [
      ...(onDevice ? [{ label: 'View PDF', onPress: () => openPage(doc.id, 1) }] : []),
      ...(doc.status === 'ready'
        ? [{ label: 'Share as image', onPress: () => router.push({ pathname: '/share-card/[id]', params: { id: doc.id } }) }]
        : []),
      {
        label: folderName ? `Move to folder (in ${folderName})` : 'Move to folder',
        onPress: () => router.push({ pathname: '/move', params: { docId: doc.id } }),
      },
      ...(doc.status === 'ready' ? [{ label: `Document type: ${MODE_LABEL[doc.mode]}`, onPress: changeMode }] : []),
      { label: 'Share summary as text', onPress: () => Share.share({ message: `${doc.title}${doc.summary ? `\n\n${doc.summary}` : ''}\n\nShared from Pagewise` }) },
      { label: 'Clear conversation', onPress: () => clearChat(doc.id) },
      {
        label: 'Delete document',
        destructive: true,
        onPress: () =>
          confirm('Delete document?', `“${doc.title}” and its chat history will be removed.`, 'Delete', () => {
            goBackOr('/home')();
            removeDoc(doc.id);
          }),
      },
    ]);

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScreenHeader
            onBack={goBackOr('/home')}
            title={doc.status === 'ready' ? doc.title : doc.fileName}
            subtitle={
              <View style={styles.pagesRow}>
                <FileTextIcon size={15} color={colors.muted} strokeWidth={1.5} />
                <Text style={styles.pages}>
                  {doc.status === 'processing' ? 'Reading…' : doc.pages ? `${doc.pages} pages` : doc.fileName}
                </Text>
              </View>
            }
            right={
              <CircleButton onPress={openMenu}>
                <ShareCirclesIcon size={20} color={colors.text} strokeWidth={1.5} />
              </CircleButton>
            }
          />

          <ScrollView
            ref={scroll}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => (msgs.length || busy) && scroll.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            <DocumentOverview doc={doc} onRetry={onDevice ? () => retryAnalysis(doc.id) : undefined} />

            {doc.status === 'ready' && doc.mode === 'admin' && <AdminPanel doc={doc} onAsk={(p) => submit(p)} />}
            {doc.status === 'ready' && doc.mode === 'study' && <StudyPanel doc={doc} canUseAi={onDevice} />}

            {!onDevice && (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  The PDF for this document isn’t on this device, so Pagewise can’t answer new questions about it. Delete
                  it and upload the file again to keep chatting.
                </Text>
              </View>
            )}

            {msgs.map((m) =>
              m.role === 'user' ? (
                <UserBubble key={m.id} text={m.text} />
              ) : (
                <AiBubble key={m.id} text={m.text} onPage={onDevice ? (p) => openPage(doc.id, p) : undefined} />
              ),
            )}
            {busy && <AiBubble text={partial ?? ''} streaming />}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.chipScroll}
            contentContainerStyle={styles.chips}
          >
            {QUICK[doc.mode].map(({ label, Icon, prompt }) => (
              <Pressable
                key={label}
                onPress={() => submit(prompt)}
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
              >
                <GlossyIcon tone="green" size={24} flat>
                  {(c) => <Icon size={13} color={c} strokeWidth={2} />}
                </GlossyIcon>
                <Text style={styles.chipText}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.composer}>
            <Pressable
              onPress={() => voice.toggle(text)}
              hitSlop={10}
              accessibilityLabel={voice.listening ? 'Stop voice typing' : 'Voice typing'}
              style={styles.mic}
            >
              <GlossyIcon tone={voice.listening ? 'rose' : 'pearl'} size={40} shape="circle" flat={!voice.listening}>
                {(c) => <MicIcon size={18} color={c} strokeWidth={1.7} />}
              </GlossyIcon>
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={voice.listening ? 'Listening…' : doc.status === 'ready' ? 'Ask about this document' : 'Waiting for the document…'}
              placeholderTextColor={colors.faint}
              editable={doc.status === 'ready' && onDevice}
              style={styles.input}
              onSubmitEditing={() => submit()}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => submit()}
              style={({ pressed }) => [styles.sendShadow, pressed && { transform: [{ scale: 0.94 }] }]}
            >
              <GlossyIcon tone="ink" size={44} shape="circle">
                {(c) => <SendIcon size={18} color={c} strokeWidth={1.7} />}
              </GlossyIcon>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  mic: { marginLeft: -10 },
  notice: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(214,92,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(214,92,76,0.2)',
  },
  noticeText: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: '#8A3B30' },
  missing: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 40 },
  pagesRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  pages: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  chipScroll: { flexGrow: 0 },
  chips: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 36,
    paddingLeft: 6,
    paddingRight: 13,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  chipText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    height: 58,
    borderRadius: 29,
    paddingLeft: 18,
    paddingRight: 7,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    gap: 12,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingVertical: 0 },
  sendShadow: {
    borderRadius: 23,
    shadowColor: '#1D1C19',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
