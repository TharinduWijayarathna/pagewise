import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader, goBackOr } from '@/components/ui';
import { PageChip } from '@/components/document/PageChip';
import { useLibrary } from '@/state/library';
import type { QuizQuestion } from '@/types/document';
import { colors, fonts } from '@/constants/theme';

/** A fresh multiple-choice quiz on a document, generated each time. */
export default function Quiz() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDoc, makeQuiz } = useLibrary();
  const doc = getDoc(id);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string>();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    setError(undefined);
    setQuestions([]);
    setIndex(0);
    setPicked(null);
    setScore(0);
    try {
      setQuestions(await makeQuiz(id));
    } catch (err) {
      setError((err as Error).message);
    }
  }, [id, makeQuiz]);

  useEffect(() => {
    load();
  }, [load]);

  const q = questions[index];
  const finished = questions.length > 0 && index >= questions.length;

  const choose = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader
          onBack={goBackOr('/home')}
          title={doc?.title ?? 'Quiz'}
          subtitle={
            <Text style={styles.sub}>
              {q ? `Question ${index + 1} of ${questions.length}` : finished ? 'Results' : 'Quiz'}
            </Text>
          }
        />

        {error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <PillButton label="Try again" onPress={load} style={{ marginTop: 18, alignSelf: 'stretch', marginHorizontal: 40 }} />
          </View>
        ) : !questions.length ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
            <Text style={styles.muted}>Writing questions from your document…</Text>
          </View>
        ) : finished ? (
          <View style={styles.center}>
            <Text style={styles.score}>
              {score}/{questions.length}
            </Text>
            <Text style={styles.muted}>
              {score === questions.length
                ? 'Perfect. You know this material.'
                : score >= questions.length / 2
                  ? 'Good work. Review the ones you missed.'
                  : 'Worth another read. Try the flashcards next.'}
            </Text>
            <View style={{ gap: 12, alignSelf: 'stretch', paddingHorizontal: 40, marginTop: 26 }}>
              <PillButton label="New quiz" sparkle onPress={load} />
              <PillButton label="Done" variant="light" onPress={goBackOr('/home')} />
            </View>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.scroll}>
              <Text style={styles.q}>{q.q}</Text>
              {q.options.map((opt, i) => {
                const state = picked === null ? 'idle' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'dim';
                return (
                  <Pressable
                    key={i}
                    onPress={() => choose(i)}
                    disabled={picked !== null}
                    style={({ pressed }) => [styles.option, styles[state], pressed && { opacity: 0.75 }]}
                    accessibilityState={{ selected: picked === i }}
                  >
                    <Text style={styles.letter}>{String.fromCharCode(65 + i)}</Text>
                    <Text style={styles.optText}>{opt}</Text>
                  </Pressable>
                );
              })}
              {picked !== null && (
                <View style={styles.why}>
                  <Text style={styles.whyHead}>{picked === q.answer ? 'Correct' : 'Not quite'}</Text>
                  {!!q.why && <Text style={styles.whyText}>{q.why}</Text>}
                  <View style={{ marginTop: 8 }}>
                    <PageChip docId={id} page={q.page} />
                  </View>
                </View>
              )}
            </ScrollView>
            <View style={styles.actions}>
              <PillButton
                label={index === questions.length - 1 ? 'See results' : 'Next question'}
                disabled={picked === null}
                onPress={() => {
                  setIndex((n) => n + 1);
                  setPicked(null);
                }}
              />
            </View>
          </>
        )}
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30, paddingBottom: 60 },
  muted: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  error: { fontFamily: fonts.regular, fontSize: 15, color: '#B9473A', textAlign: 'center' },
  score: { fontFamily: fonts.display, fontSize: 56, letterSpacing: -2, color: colors.ink },
  scroll: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 },
  q: { fontFamily: fonts.display, fontSize: 21, lineHeight: 28, letterSpacing: -0.5, color: colors.ink, marginBottom: 18 },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  idle: { backgroundColor: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.95)' },
  right: { backgroundColor: 'rgba(93,180,88,0.14)', borderColor: colors.green },
  wrong: { backgroundColor: 'rgba(214,92,76,0.10)', borderColor: '#D65C4C' },
  dim: { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: 'transparent', opacity: 0.6 },
  letter: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, width: 16 },
  optText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  why: { marginTop: 6, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.55)' },
  whyHead: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginBottom: 4 },
  whyText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text },
  actions: { paddingHorizontal: 40, paddingBottom: 12, paddingTop: 8 },
});
