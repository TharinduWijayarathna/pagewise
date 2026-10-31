import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { CheckIcon, GreenDocIcon, UploadIcon } from '@/components/ui/Icons';
import { PillButton } from '@/components/ui/PillButton';
import { GlassCard, ScreenHeader, goBackOr } from '@/components/ui';
import { MAX_PDF_BYTES, PLAN_LIMITS } from '@/constants/limits';
import { useAuth } from '@/state/auth';
import { useLibrary } from '@/state/library';
import { colors, fonts } from '@/constants/theme';

type Picked = { uri: string; name: string; size?: number };

const fmtSize = (b?: number) => (b ? (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`) : '');

export default function Upload() {
  const { user } = useAuth();
  const { addDoc, getDoc, retryAnalysis, docs } = useLibrary();
  const [file, setFile] = useState<Picked | null>(null);
  const [docId, setDocId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const doc = getDoc(docId);
  const phase = !docId ? 'pick' : doc?.status ?? 'processing';
  const limit = user ? PLAN_LIMITS[user.plan] : 0;

  const pick = async () => {
    setError(undefined);
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (res.canceled) return;
    const a = res.assets[0];
    if (a.size && a.size > MAX_PDF_BYTES) {
      setError('This PDF is larger than 14 MB. Please choose a smaller file.');
      return;
    }
    setFile({ uri: a.uri, name: a.name, size: a.size });
  };

  const start = async () => {
    if (!file) return;
    setError(undefined);
    setSaving(true);
    try {
      setDocId(await addDoc(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader onBack={goBackOr('/home')} title="Upload document" />
        <View style={styles.body}>
          {phase === 'ready' ? (
            <GlassCard style={styles.center}>
              <GlossyIcon tone="green" size={68} shape="circle" style={{ marginBottom: 10 }}>
                {(c) => <CheckIcon size={30} color={c} strokeWidth={2.4} />}
              </GlossyIcon>
              <Text style={styles.bigTitle}>Ready to chat</Text>
              <Text style={styles.sub}>
                Pagewise has read “{doc?.title}”{doc?.pages ? ` (${doc.pages} pages)` : ''}. Ask it anything.
              </Text>
            </GlassCard>
          ) : (
            <Pressable onPress={phase === 'pick' && !saving ? pick : undefined} style={styles.drop}>
              {file ? (
                <>
                  <GreenDocIcon size={48} />
                  <Text style={styles.fileName} numberOfLines={2}>
                    {file.name}
                  </Text>
                  <Text style={styles.sub}>{fmtSize(file.size)}</Text>
                  {phase === 'processing' && (
                    <View style={styles.progress}>
                      <ActivityIndicator color={colors.ink} />
                      <Text style={styles.progressText}>Reading pages with Gemini… this can take up to a minute.</Text>
                    </View>
                  )}
                  {phase === 'error' && (
                    <Text style={[styles.progressText, { color: '#B9473A' }]}>{doc?.error}</Text>
                  )}
                  {phase === 'pick' && !saving && <Text style={styles.change}>Tap to choose a different file</Text>}
                </>
              ) : (
                <>
                  <GlossyIcon tone="green" size={68} style={{ marginBottom: 10 }}>
                    {(c) => <UploadIcon size={28} color={c} strokeWidth={1.9} />}
                  </GlossyIcon>
                  <Text style={styles.bigTitle}>Choose a PDF</Text>
                  <Text style={styles.sub}>Tap to browse your files. Up to 14 MB.</Text>
                  <Text style={styles.quota}>
                    {docs.length} of {limit} documents used
                  </Text>
                </>
              )}
            </Pressable>
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>

        <View style={styles.actions}>
          {phase === 'ready' ? (
            <>
              <PillButton
                label="Start chatting"
                sparkle
                onPress={() => docId && router.replace({ pathname: '/document/[id]', params: { id: docId } })}
              />
              <PillButton label="Done" variant="light" onPress={() => router.back()} />
            </>
          ) : phase === 'error' ? (
            <>
              <PillButton label="Try again" onPress={() => docId && retryAnalysis(docId)} />
              <PillButton label="Close" variant="light" onPress={() => router.back()} />
            </>
          ) : phase === 'processing' ? (
            <PillButton label="Keep reading in background" variant="light" onPress={() => router.back()} />
          ) : file ? (
            <PillButton label="Upload & analyze" sparkle onPress={start} loading={saving} />
          ) : (
            <PillButton label="Browse files" onPress={pick} />
          )}
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  drop: {
    minHeight: 300,
    borderRadius: 30,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(38,37,31,0.25)',
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 6,
  },
  center: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  bigTitle: { fontFamily: fonts.display, fontSize: 23, letterSpacing: -0.6, color: colors.ink },
  fileName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, textAlign: 'center', marginTop: 12 },
  sub: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.muted, textAlign: 'center' },
  quota: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.faint, marginTop: 10 },
  change: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text, marginTop: 14 },
  progress: { alignItems: 'center', gap: 10, marginTop: 20 },
  progressText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 10 },
  error: { fontFamily: fonts.regular, fontSize: 13.5, color: '#B9473A', textAlign: 'center', marginTop: 14 },
  actions: { paddingHorizontal: 40, gap: 12, paddingBottom: 16, paddingTop: 12 },
});
