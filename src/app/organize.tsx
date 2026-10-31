import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { FolderIcon, SparklesIcon } from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { PillButton } from '@/components/ui/PillButton';
import { GlassCard, ScreenHeader, TextField, goBackOr } from '@/components/ui';
import { useLibrary } from '@/state/library';
import type { OrganizePlan } from '@/types/document';
import { colors, fonts } from '@/constants/theme';
import { friendlyError, plural } from '@/utils/format';

const IDEAS = ['Group by topic', 'Group by project', 'Separate work and personal', 'Put contracts in a Legal folder'];

/**
 * AI organizer: Gemini proposes folders for the library (optionally following an
 * instruction). Nothing changes until the user reviews the plan and taps Apply.
 */
export default function Organize() {
  const { docs, folders, suggestOrganization, applyOrganization } = useLibrary();
  const [instruction, setInstruction] = useState('');
  const [plan, setPlan] = useState<OrganizePlan | null>(null);
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'applying'>('idle');
  const [error, setError] = useState<string>();

  const title = (id: string) => docs.find((d) => d.id === id)?.title ?? 'Document';
  const ready = docs.filter((d) => d.status === 'ready').length;

  const suggest = async () => {
    setError(undefined);
    setPhase('thinking');
    try {
      setPlan(await suggestOrganization(instruction));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setPhase('idle');
    }
  };

  const apply = async () => {
    if (!plan) return;
    setPhase('applying');
    try {
      await applyOrganization(plan);
      router.back();
    } catch (err) {
      setError(friendlyError(err));
      setPhase('idle');
    }
  };

  const moves = plan?.folders.reduce((n, f) => n + f.docIds.length, 0) ?? 0;

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScreenHeader title="Organize with AI" onBack={goBackOr('/home')} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {!plan && (
              <>
                <View style={styles.hero}>
                  <GlossyIcon tone="ink" size={64}>
                    {(c) => <SparklesIcon size={28} color={c} strokeWidth={1.7} />}
                  </GlossyIcon>
                  <Text style={styles.heroTitle}>Let Pagewise tidy up</Text>
                  <Text style={styles.heroText}>
                    Gemini reads the titles and summaries of your {plural(ready, 'document')} and suggests folders. You’ll
                    review the plan before anything moves.
                  </Text>
                </View>

                <TextField
                  label="Instructions (optional)"
                  placeholder="e.g. Group by client name"
                  autoCapitalize="sentences"
                  value={instruction}
                  onChangeText={setInstruction}
                  onSubmitEditing={suggest}
                  returnKeyType="go"
                />
                <View style={styles.ideas}>
                  {IDEAS.map((i) => (
                    <Text key={i} style={styles.idea} onPress={() => setInstruction(i)}>
                      {i}
                    </Text>
                  ))}
                </View>
              </>
            )}

            {plan && (
              <>
                <Text style={styles.planTitle}>Suggested folders</Text>
                <Text style={styles.planSub}>
                  {plural(plan.folders.length, 'folder')} · {plural(moves, 'document')} to organize
                </Text>
                {plan.folders.map((f) => {
                  const reuse = f.existingFolderId || folders.some((x) => x.name.toLowerCase() === f.name.toLowerCase());
                  return (
                    <GlassCard key={f.name} style={styles.folderCard}>
                      <View style={styles.folderHead}>
                        <GlossyIcon tone={reuse ? 'ink' : 'green'} size={38} flat>
                          {(c) => <FolderIcon size={17} color={c} strokeWidth={1.8} />}
                        </GlossyIcon>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.folderName} numberOfLines={1}>
                            {f.name}
                          </Text>
                          <Text style={styles.folderMeta}>
                            {reuse ? 'Existing folder' : 'New folder'} · {plural(f.docIds.length, 'document')}
                          </Text>
                        </View>
                      </View>
                      {f.docIds.map((id) => (
                        <View key={id} style={styles.docRow}>
                          <View style={styles.dot} />
                          <Text style={styles.docTitle} numberOfLines={1}>
                            {title(id)}
                          </Text>
                        </View>
                      ))}
                    </GlassCard>
                  );
                })}
              </>
            )}

            {phase === 'thinking' && (
              <View style={styles.thinking}>
                <ActivityIndicator color={colors.ink} />
                <Text style={styles.heroText}>Reading your library…</Text>
              </View>
            )}
            {!!error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>

          <View style={styles.actions}>
            {plan ? (
              <>
                <PillButton label="Apply changes" sparkle onPress={apply} loading={phase === 'applying'} />
                <PillButton label="Try a different way" variant="light" onPress={() => setPlan(null)} disabled={phase !== 'idle'} />
              </>
            ) : (
              <PillButton
                label="Suggest folders"
                sparkle
                onPress={suggest}
                loading={phase === 'thinking'}
                disabled={ready < 2}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingBottom: 24 },
  hero: { alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 26 },
  heroTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, letterSpacing: -0.6, marginTop: 6 },
  heroText: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  idea: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  planTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, letterSpacing: -0.5 },
  planSub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 16 },
  folderCard: { marginBottom: 12, paddingVertical: 14 },
  folderHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  folderName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  folderMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted, marginTop: 1 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingLeft: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
  docTitle: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  thinking: { alignItems: 'center', gap: 10, marginTop: 24 },
  error: { fontFamily: fonts.regular, fontSize: 13.5, color: '#B9473A', textAlign: 'center', marginTop: 16 },
  actions: { paddingHorizontal: 40, gap: 12, paddingBottom: 16, paddingTop: 8 },
});
