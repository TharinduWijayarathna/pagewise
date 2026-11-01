import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { CheckIcon } from '@/components/ui/Icons';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader, goBackOr } from '@/components/ui';
import { PageChip } from '@/components/document/PageChip';
import { rescheduleCard, useLibrary, type Grade } from '@/state/library';
import { colors, fonts } from '@/constants/theme';
import { plural } from '@/utils/format';

const GRADES: { grade: Grade; label: string; color: string }[] = [
  { grade: 'again', label: 'Again', color: '#D65C4C' },
  { grade: 'good', label: 'Good', color: '#9D9A91' },
  { grade: 'easy', label: 'Easy', color: '#5DB458' },
];

/** "10 min", "2 days" — when a card would come back for each answer. */
function interval(due: number) {
  const mins = Math.round((due - Date.now()) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const days = Math.max(1, Math.round(mins / 1440));
  return plural(days, 'day');
}

/** Flashcard review with spaced repetition (Leitner boxes, see state/library.tsx). */
export default function Study() {
  const { id, all } = useLocalSearchParams<{ id: string; all?: string }>();
  const { getDoc, reviewCard } = useLibrary();
  const doc = getDoc(id);
  const cards = doc?.cards ?? [];

  // The session queue is fixed once the document has loaded; "Again" puts a card at the back.
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  useEffect(() => {
    if (started || !doc) return;
    setStarted(true);
    setQueue(cards.filter((c) => all || c.due <= Date.now()).map((c) => c.id));
  }, [started, doc, cards, all]);
  const [done, setDone] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = useMemo(() => cards.find((c) => c.id === queue[0]), [cards, queue]);

  const grade = (g: Grade) => {
    if (!card || !doc) return;
    reviewCard(doc.id, card.id, g);
    setRevealed(false);
    setQueue((q) => (g === 'again' ? [...q.slice(1), q[0]] : q.slice(1)));
    if (g !== 'again') setDone((n) => n + 1);
  };

  const nextDue = cards.length ? Math.min(...cards.map((c) => c.due)) : 0;

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader
          onBack={goBackOr('/home')}
          title={doc?.title ?? 'Flashcards'}
          subtitle={<Text style={styles.sub}>{card ? `${plural(queue.length, 'card')} left` : 'Flashcards'}</Text>}
        />

        {!started ? null : !card ? (
          <View style={styles.center}>
            <GlossyIcon tone="green" size={68} shape="circle" style={{ marginBottom: 12 }}>
              {(c) => <CheckIcon size={30} color={c} strokeWidth={2.4} />}
            </GlossyIcon>
            <Text style={styles.bigTitle}>{done ? 'Session done' : 'All caught up'}</Text>
            <Text style={styles.body}>
              {done ? `You reviewed ${plural(done, 'card')}. ` : ''}
              {nextDue > Date.now()
                ? `Next cards are due ${new Date(nextDue).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}.`
                : ''}
            </Text>
            <View style={{ gap: 12, alignSelf: 'stretch', paddingHorizontal: 40, marginTop: 24 }}>
              {cards.length > 0 && (
                <PillButton
                  label="Practice all cards"
                  variant="light"
                  onPress={() => {
                    setQueue(cards.map((c) => c.id));
                    setDone(0);
                  }}
                />
              )}
              <PillButton label="Done" onPress={goBackOr('/home')} />
            </View>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.scroll}>
              <Pressable onPress={() => setRevealed(true)} style={styles.card} accessibilityHint="Shows the answer">
                <Text style={styles.kicker}>QUESTION</Text>
                <Text style={styles.q}>{card.q}</Text>
                {revealed ? (
                  <>
                    <View style={styles.rule} />
                    <Text style={styles.kicker}>ANSWER</Text>
                    <Text style={styles.a}>{card.a}</Text>
                    <View style={{ marginTop: 12 }}>
                      <PageChip docId={doc!.id} page={card.page} />
                    </View>
                  </>
                ) : (
                  <Text style={styles.tap}>Think of the answer, then tap to check</Text>
                )}
              </Pressable>
              <View style={styles.dots}>
                {[1, 2, 3, 4, 5].map((b) => (
                  <View key={b} style={[styles.dot, b <= card.box && styles.dotOn]} />
                ))}
                <Text style={styles.boxLabel}>{card.box >= 4 ? 'Well learned' : card.box >= 2 ? 'Learning' : 'New'}</Text>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              {revealed ? (
                GRADES.map(({ grade: g, label, color }) => (
                  <Pressable key={g} onPress={() => grade(g)} style={({ pressed }) => [styles.grade, pressed && { opacity: 0.7 }]}>
                    <View style={[styles.gradeDot, { backgroundColor: color }]} />
                    <Text style={styles.gradeLabel}>{label}</Text>
                    <Text style={styles.gradeHint}>{interval(rescheduleCard(card, g).due)}</Text>
                  </Pressable>
                ))
              ) : (
                <PillButton label="Show answer" onPress={() => setRevealed(true)} style={{ flex: 1 }} />
              )}
            </View>
          </>
        )}
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 3 },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  card: {
    minHeight: 300,
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#7D785F',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  kicker: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.8, color: colors.faint, marginBottom: 8 },
  q: { fontFamily: fonts.display, fontSize: 22, lineHeight: 29, letterSpacing: -0.5, color: colors.ink },
  a: { fontFamily: fonts.regular, fontSize: 16.5, lineHeight: 24, color: colors.text },
  tap: { fontFamily: fonts.regular, fontSize: 14, color: colors.faint, marginTop: 'auto', paddingTop: 30, textAlign: 'center' },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: '#D8D6D0', marginVertical: 18 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(38,37,31,0.15)' },
  dotOn: { backgroundColor: colors.green },
  boxLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted, marginLeft: 6 },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  grade: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  gradeDot: { width: 8, height: 8, borderRadius: 4 },
  gradeLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  gradeHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 60 },
  bigTitle: { fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.6, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
