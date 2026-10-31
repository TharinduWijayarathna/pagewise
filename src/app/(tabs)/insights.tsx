import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRightIcon, DocIcon, SparklesIcon } from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { TabScreen, tabText } from '@/components/layout/TabScreen';
import { GlassCard } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { tintFor } from '@/constants/folderColors';
import { dayKey, plural } from '@/utils/format';
import { colors, fonts } from '@/constants/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** 28 → "28 min", 72 → "1 h 12 min", 120 → "2 h". */
function duration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export default function Insights() {
  const { docs, folders, stats: totals } = useLibrary();

  const stats = useMemo(() => {
    const ready = docs.filter((d) => d.status === 'ready');
    const pages = ready.reduce((n, d) => n + d.pages, 0);
    // Monday-to-Sunday of the current week, from the per-day counters in Firestore.
    const now = new Date();
    const today = (now.getDay() + 6) % 7; // Mon = 0
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - today);
    const week = DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return totals.questionsByDay[dayKey(d)] ?? 0;
    });
    const topDocs = [...ready]
      .filter((d) => d.questionCount > 0)
      .sort((a, b) => b.questionCount - a.questionCount)
      .slice(0, 4);
    return {
      pages,
      week,
      weekTotal: week.reduce((a, b) => a + b, 0),
      today,
      // Rough estimate: ~2 minutes to read a page yourself.
      timeSaved: pages * 2,
      topDocs,
    };
  }, [docs, totals]);

  const max = Math.max(1, ...stats.week);
  const topMax = stats.topDocs[0]?.questionCount ?? 1;

  return (
    <TabScreen eyebrow="At a glance" title="Insights">
      {/* hero */}
      <GlassCard style={styles.hero}>
        <GlossyIcon tone="ink" size={50}>
          {(c) => <SparklesIcon size={22} color={c} strokeWidth={1.7} />}
        </GlossyIcon>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroValue}>{duration(stats.timeSaved)} saved</Text>
          <Text style={styles.heroSub}>
            {stats.pages
              ? `Estimated reading time for the ${plural(stats.pages, 'page')} Pagewise read for you`
              : 'Upload a document to start saving time'}
          </Text>
        </View>
      </GlassCard>

      {/* stats strip */}
      <GlassCard style={styles.strip}>
        <Stat value={docs.length} label={docs.length === 1 ? 'Document' : 'Documents'} />
        <View style={styles.divider} />
        <Stat value={totals.totalQuestions} label={totals.totalQuestions === 1 ? 'Question' : 'Questions'} />
        <View style={styles.divider} />
        <Stat value={folders.length} label={folders.length === 1 ? 'Folder' : 'Folders'} />
      </GlassCard>

      {/* weekly activity */}
      <View style={styles.sectionRow}>
        <Text style={[tabText.section, styles.sectionInline]}>This week</Text>
        <Text style={styles.sectionMeta}>{plural(stats.weekTotal, 'question')}</Text>
      </View>
      <GlassCard>
        <View style={styles.chart}>
          {stats.week.map((v, i) => {
            const isToday = i === stats.today;
            return (
              <View key={DAYS[i]} style={styles.barCol}>
                <Text style={[styles.barValue, isToday && { color: colors.ink }]}>{v > 0 ? v : ' '}</Text>
                <View style={styles.barTrack}>
                  {v > 0 ? (
                    <View style={[styles.bar, { height: `${(v / max) * 100}%` }, isToday && styles.barToday]} />
                  ) : (
                    <View style={styles.zero} />
                  )}
                </View>
                <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{DAYS[i]}</Text>
              </View>
            );
          })}
        </View>
      </GlassCard>

      {/* most discussed documents */}
      <Text style={tabText.section}>Most discussed</Text>
      <GlassCard style={{ paddingVertical: 6 }}>
        {stats.topDocs.length === 0 && (
          <Text style={styles.empty}>Ask questions about your documents to see them here.</Text>
        )}
        {stats.topDocs.map((d, i) => {
          const tint = tintFor(folders.find((f) => f.id === d.folderId)?.color);
          return (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: '/document/[id]', params: { id: d.id } })}
              style={({ pressed }) => [styles.topRow, i < stats.topDocs.length - 1 && styles.topBorder, pressed && { opacity: 0.6 }]}
            >
              <DocIcon size={20} tint={tint} />
              <View style={{ flex: 1, gap: 7 }}>
                <View style={styles.topHead}>
                  <Text style={styles.topTitle} numberOfLines={1}>
                    {d.title}
                  </Text>
                  <Text style={styles.topCount}>{d.questionCount}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(d.questionCount / topMax) * 100}%`, backgroundColor: tint.solid }]} />
                </View>
              </View>
              <ChevronRightIcon size={16} color={colors.faint} strokeWidth={1.8} />
            </Pressable>
          );
        })}
      </GlassCard>
    </TabScreen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 26 },
  heroValue: { fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.8, color: colors.ink },
  heroSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 3 },
  strip: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink, letterSpacing: -0.4 },
  statLabel: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: 'rgba(38,37,31,0.15)' },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionInline: { flex: 1 },
  sectionMeta: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.muted },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 128 },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, marginBottom: 6, height: 16 },
  barTrack: { flex: 1, width: 18, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', borderRadius: 9, backgroundColor: 'rgba(93,180,88,0.4)', minHeight: 8 },
  barToday: { backgroundColor: colors.green },
  zero: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(38,37,31,0.12)' },
  barLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 8 },
  barLabelToday: { fontFamily: fonts.semibold, color: colors.ink },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  topBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(38,37,31,0.1)' },
  topHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topTitle: { flex: 1, fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  topCount: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.muted },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(38,37,31,0.07)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  empty: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.muted, textAlign: 'center', paddingVertical: 14 },
});
