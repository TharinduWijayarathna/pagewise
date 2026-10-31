import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { GreenDocIcon, MessageIcon } from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { plainText } from '@/components/chat/RichText';
import { PillButton } from '@/components/ui/PillButton';
import { TabScreen, tabText } from '@/components/layout/TabScreen';
import { GlassCard } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { timeAgo } from '@/utils/format';
import { colors, fonts } from '@/constants/theme';

const DAY = 86_400_000;

function bucket(at: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (at >= start.getTime()) return 'Today';
  if (at >= start.getTime() - DAY) return 'Yesterday';
  if (at >= start.getTime() - 7 * DAY) return 'This week';
  return 'Earlier';
}

export default function History() {
  const { docs } = useLibrary();

  const groups = useMemo(() => {
    const items = docs
      .filter((d) => d.lastAt && d.questionCount > 0)
      .map((d) => ({
        doc: d,
        last: { at: d.lastAt!, role: 'ai' as const, text: plainText(d.lastAnswer ?? '') },
        lastQ: { text: d.lastQuestion ?? '' },
        count: d.questionCount,
      }))
      .sort((a, b) => b.last.at - a.last.at);

    const out: { title: string; items: typeof items }[] = [];
    for (const it of items) {
      const t = bucket(it.last.at);
      const g = out.find((x) => x.title === t);
      if (g) g.items.push(it);
      else out.push({ title: t, items: [it] });
    }
    return out;
  }, [docs]);

  return (
    <TabScreen eyebrow="Your conversations" title="History">
      {groups.length === 0 && (
        <GlassCard style={styles.empty}>
          <GlossyIcon tone="pearl" size={56}>
            {(c) => <MessageIcon size={26} color={c} strokeWidth={1.6} />}
          </GlossyIcon>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyText}>Open a document and ask Pagewise anything to get started.</Text>
          <PillButton label="Browse documents" size="sm" onPress={() => router.push('/documents')} style={{ alignSelf: 'center' }} />
        </GlassCard>
      )}

      {groups.map((g) => (
        <View key={g.title}>
          <Text style={tabText.section}>{g.title}</Text>
          {g.items.map(({ doc, last, lastQ, count }) => (
            <Pressable
              key={doc.id}
              onPress={() => router.push({ pathname: '/document/[id]', params: { id: doc.id } })}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.iconBox}>
                <GreenDocIcon size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.topRow}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {doc.title}
                  </Text>
                  <Text style={styles.time}>{timeAgo(last.at)}</Text>
                </View>
                <Text style={styles.question} numberOfLines={1}>
                  “{lastQ?.text}”
                </Text>
                <Text style={styles.answer} numberOfLines={2}>
                  {last.role === 'ai' ? last.text : 'Waiting for reply…'}
                </Text>
                <View style={styles.countPill}>
                  <MessageIcon size={12} color={colors.muted} strokeWidth={1.6} />
                  <Text style={styles.countText}>
                    {count} question{count === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  iconBox: {
    width: 50,
    height: 58,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 15.5, color: colors.text },
  time: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.faint },
  question: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text, marginTop: 4 },
  answer: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 3 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  countText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  empty: { alignItems: 'center', gap: 8, marginTop: 28, paddingVertical: 30 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, marginTop: 6 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 10 },
});
