import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Doc } from '@/types/document';
import { CardsIcon, QuizIcon } from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { PillButton } from '@/components/ui/PillButton';
import { panelStyles } from '@/components/document/AdminPanel';
import { useLibrary } from '@/state/library';
import { colors, fonts } from '@/constants/theme';
import { plural } from '@/utils/format';

/** Study tools: spaced-repetition flashcards and a quick quiz. */
export function StudyPanel({ doc, canUseAi }: { doc: Doc; canUseAi: boolean }) {
  const { generateCards } = useLibrary();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const cards = doc.cards ?? [];
  const due = cards.filter((c) => c.due <= Date.now()).length;
  const mastered = cards.filter((c) => c.box >= 4).length;

  const make = async () => {
    setError(undefined);
    setBusy(true);
    try {
      await generateCards(doc.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={panelStyles.card}>
      <Text style={[panelStyles.h, { marginBottom: 12 }]}>Study</Text>
      <View style={styles.row}>
        <Pressable
          disabled={!cards.length}
          onPress={() => router.push({ pathname: '/study/[id]', params: { id: doc.id } })}
          style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}
        >
          <GlossyIcon tone="green" size={34} flat>
            {(c) => <CardsIcon size={16} color={c} strokeWidth={1.9} />}
          </GlossyIcon>
          <Text style={styles.tileTitle}>Flashcards</Text>
          <Text style={panelStyles.muted}>
            {cards.length ? (due ? `${due} due now` : 'All caught up') : 'Not made yet'}
          </Text>
        </Pressable>
        <Pressable
          disabled={!canUseAi}
          onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: doc.id } })}
          style={({ pressed }) => [styles.tile, !canUseAi && { opacity: 0.5 }, pressed && { opacity: 0.7 }]}
        >
          <GlossyIcon tone="ink" size={34} flat>
            {(c) => <QuizIcon size={16} color={c} strokeWidth={1.9} />}
          </GlossyIcon>
          <Text style={styles.tileTitle}>Quiz me</Text>
          <Text style={panelStyles.muted}>6 fresh questions</Text>
        </Pressable>
      </View>

      {cards.length > 0 && (
        <Text style={[panelStyles.muted, { marginTop: 12 }]}>
          {plural(cards.length, 'card')} · {mastered} well learned. Cards you know come back less often.
        </Text>
      )}

      {canUseAi && (
        <PillButton
          label={cards.length ? 'Make a new set' : 'Make flashcards'}
          variant={cards.length ? 'light' : 'dark'}
          size="sm"
          sparkle={!cards.length}
          loading={busy}
          onPress={make}
          style={{ marginTop: 14 }}
        />
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, padding: 12, gap: 4, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.75)' },
  tileTitle: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink, marginTop: 6 },
  error: { fontFamily: fonts.regular, fontSize: 13, color: '#B9473A', marginTop: 10 },
});
