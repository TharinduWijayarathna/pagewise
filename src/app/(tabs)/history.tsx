import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { DocIcon, MessageIcon } from '@/components/ui/Icons';
import { tintFor } from '@/constants/folderColors';
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
  const { docs, folders } = useLibrary();

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
                <DocIcon size={22} tint={tintFor(folders.find((f) => f.id === doc.folderId)?.color)} />
              </View>
              <View style={styles.body}>
                <View style={styles.row}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {doc.title}
                  </Text>
                  <Text style={styles.time}>{timeAgo(last.at)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.question} numberOfLines={1}>
                    {lastQ?.text}
                  </Text>
                  <View style={styles.count} accessibilityLabel={`${count} question${count === 1 ? '' : 's'}`}>
                    <MessageIcon size={11} color={colors.muted} strokeWidth={1.8} />
                    <Text style={styles.countText}>{count}</Text>
                  </View>
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
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  iconBox: {
    width: 46,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docTitle: { flex: 1, fontFamily: fonts.medium, fontSize: 15.5, color: colors.text, letterSpacing: -0.2 },
  time: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.faint },
  question: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(38,37,31,0.06)',
  },
  countText: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.muted },
  empty: { alignItems: 'center', gap: 8, marginTop: 28, paddingVertical: 30 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, marginTop: 6 },
  emptyText: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 10 },
});
