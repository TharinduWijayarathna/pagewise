import { useRef, useState } from 'react';
import {
  ActionSheetIOS,
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
import { AiBubble, UserBubble } from '@/components/chat/ChatBubble';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { colors, fonts } from '@/constants/theme';

const QUICK = [
  { label: 'Summaries', Icon: SummaryIcon, prompt: 'Summarize this document in a few bullet points.' },
  { label: 'Analyze', Icon: AnalyzeIcon, prompt: 'Analyze the most important numbers, findings or risks in this document.' },
  { label: 'Update', Icon: UpdateIcon, prompt: 'What are the latest changes, dates or action items mentioned in this document?' },
];

export default function DocumentChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDoc, typing, streaming, send, clearChat, removeDoc, retryAnalysis, hasLocalFile } = useLibrary();
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

  const openMenu = () => {
    const actions = [
      { label: 'Share summary', run: () => Share.share({ message: `${doc.title}${doc.summary ? `\n\n${doc.summary}` : ''}\n\nShared from Pagewise` }) },
      { label: 'Clear conversation', run: () => clearChat(doc.id) },
      {
        label: 'Delete document',
        destructive: true,
        run: () =>
          Alert.alert('Delete document?', `“${doc.title}” and its chat history will be removed.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                router.back();
                removeDoc(doc.id);
              },
            },
          ]),
      },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...actions.map((a) => a.label), 'Cancel'], destructiveButtonIndex: 2, cancelButtonIndex: 3 },
        (i) => actions[i]?.run(),
      );
    } else {
      Alert.alert(doc.title, undefined, [
        ...actions.map((a) => ({ text: a.label, style: a.destructive ? ('destructive' as const) : undefined, onPress: a.run })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScreenHeader
            onBack={goBackOr('/home')}
            title={doc.fileName}
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

            {!onDevice && (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  The PDF for this document isn’t on this device, so Pagewise can’t answer new questions about it. Delete
                  it and upload the file again to keep chatting.
                </Text>
              </View>
            )}

            {msgs.map((m) =>
              m.role === 'user' ? <UserBubble key={m.id} text={m.text} /> : <AiBubble key={m.id} text={m.text} />,
            )}
            {busy && <AiBubble text={partial ?? ''} streaming />}
          </ScrollView>

          <View style={styles.chips}>
            {QUICK.map(({ label, Icon, prompt }) => (
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
          </View>

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
              placeholder={voice.listening ? 'Listening…' : doc.status === 'ready' ? 'Ask anything about .....' : 'Waiting for the document…'}
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
