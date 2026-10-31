import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FileTextIcon, MessageIcon, SparklesIcon } from '@/components/ui/Icons';
import { GlossyIcon, type GlossyTone } from '@/components/ui/GlossyIcon';
import { TabScreen, tabText } from '@/components/layout/TabScreen';
import { GlassCard } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { dayKey } from '@/utils/format';
import { colors, fonts } from '@/constants/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Insights() {
  const { docs, stats: totals } = useLibrary();

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
    const topDocs = [...ready].filter((d) => d.questionCount > 0).sort((a, b) => b.questionCount - a.questionCount).slice(0, 4);
    return {
      docs: docs.length,
      pages,
      questions: totals.totalQuestions,
      week,
      today,
      // Rough estimate: ~2 minutes to read a page yourself.
      timeSaved: pages * 2,
      topDocs,
    };
  }, [docs, totals]);

  const max = Math.max(1, ...stats.week);

  return (
    <TabScreen eyebrow="At a glance" title="Insights">
      {/* hero */}
      <GlassCard style={styles.hero}>
        <GlossyIcon tone="ink" size={50}>
          {(c) => <SparklesIcon size={22} color={c} strokeWidth={1.7} />}
        </GlossyIcon>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroLabel}>Estimated reading time saved</Text>
          <Text style={styles.heroValue}>
            {Math.floor(stats.timeSaved / 60)}h {stats.timeSaved % 60}m
          </Text>
          <Text style={styles.heroSub}>Based on {stats.pages} pages Pagewise read for you</Text>
        </View>
      </GlassCard>

      {/* stat tiles */}
      <View style={styles.tiles}>
        <Tile tone="green" icon={(c) => <FileTextIcon size={17} color={c} strokeWidth={1.8} />} value={stats.docs} label="Documents" />
        <Tile tone="ink" icon={(c) => <MessageIcon size={17} color={c} strokeWidth={1.8} />} value={stats.questions} label="Questions" />
        <Tile tone="green" icon={(c) => <SparklesIcon size={17} color={c} strokeWidth={1.8} />} value={stats.pages} label="Pages read" />
      </View>

      {/* weekly activity */}
      <Text style={tabText.section}>This week</Text>
      <GlassCard>
        <View style={styles.chart}>
          {stats.week.map((v, i) => (
            <View key={DAYS[i]} style={styles.barCol}>
              <Text style={[styles.barValue, i === stats.today && { color: colors.ink }]}>{v}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: `${(v / max) * 100}%` },
                    i === stats.today ? styles.barToday : null,
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, i === stats.today && styles.barLabelToday]}>{DAYS[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.caption}>Questions asked per day</Text>
      </GlassCard>

      {/* most discussed documents */}
      <Text style={tabText.section}>Most discussed</Text>
      <GlassCard>
        {stats.topDocs.length === 0 && (
          <Text style={styles.caption}>Ask questions about your documents to see them here.</Text>
        )}
        {stats.topDocs.map((d, i) => {
          const pct = d.questionCount / stats.topDocs[0].questionCount;
          return (
            <View key={d.id} style={[styles.topic, i < stats.topDocs.length - 1 && { marginBottom: 16 }]}>
              <View style={styles.topicRow}>
                <Text style={styles.topicLabel} numberOfLines={1}>
                  {d.title}
                </Text>
                <Text style={styles.topicPct}>
                  {d.questionCount} question{d.questionCount === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct * 100}%` }]} />
              </View>
            </View>
          );
        })}
      </GlassCard>
    </TabScreen>
  );
}

function Tile({ icon, tone, value, label }: { icon: (c: string) => React.ReactNode; tone: GlossyTone; value: number; label: string }) {
  return (
    <GlassCard style={styles.tile}>
      <GlossyIcon tone={tone} size={34} style={{ marginBottom: 10 }}>
        {icon}
      </GlossyIcon>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 26 },
  heroLabel: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.muted },
  heroValue: { fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.8, color: colors.ink, marginTop: 2 },
  heroSub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 12 },
  tile: { flex: 1, padding: 14 },
  tileValue: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink, letterSpacing: -0.4 },
  tileLabel: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 160 },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.faint, marginBottom: 6 },
  barTrack: { flex: 1, width: 20, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 10, backgroundColor: 'rgba(38,37,31,0.16)', minHeight: 6 },
  barToday: { backgroundColor: colors.ink },
  barLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 8 },
  barLabelToday: { fontFamily: fonts.semibold, color: colors.ink },
  caption: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.faint, marginTop: 14, textAlign: 'center' },
  topic: {},
  topicRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  topicLabel: { flex: 1, marginRight: 10, fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  topicPct: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.muted },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(38,37,31,0.08)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.green },
});
