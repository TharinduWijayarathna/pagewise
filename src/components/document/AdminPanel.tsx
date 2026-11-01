import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { Doc, Risk } from '@/types/document';
import { AlertIcon, BellIcon, CalendarIcon } from '@/components/ui/Icons';
import { PageChip } from '@/components/document/PageChip';
import { addToCalendar } from '@/lib/reminders';
import { useReminders } from '@/hooks/useReminders';
import { daysUntil, dueLabel, longDate } from '@/utils/dates';
import { colors, fonts } from '@/constants/theme';

const LEVEL: Record<Risk['level'], { color: string; label: string }> = {
  high: { color: '#C8503F', label: 'High' },
  medium: { color: '#D9922E', label: 'Check' },
  low: { color: '#8A877E', label: 'Note' },
};

/**
 * Paperwork tools for admin documents: key dates (calendar + reminders),
 * the money figures, and clauses worth a closer look.
 */
export function AdminPanel({ doc, onAsk }: { doc: Doc; onAsk: (prompt: string) => void }) {
  const reminders = useReminders();
  const dates = [...(doc.keyDates ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const amounts = doc.amounts ?? [];
  const risks = doc.risks ?? [];
  const hasFuture = dates.some((d) => daysUntil(d.date) >= 0);

  if (!dates.length && !amounts.length && !risks.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.h}>Paperwork</Text>
        <Text style={styles.muted}>No dates, amounts or unusual clauses found in this document.</Text>
      </View>
    );
  }

  const calendar = async (label: string, date: string) => {
    try {
      await addToCalendar({ label, date, docTitle: doc.title });
    } catch (err) {
      Alert.alert('Couldn’t open your calendar', (err as Error).message);
    }
  };

  return (
    <>
      {!!dates.length && (
        <View style={styles.card}>
          <View style={styles.headRow}>
            <CalendarIcon size={16} color={colors.text} strokeWidth={1.8} />
            <Text style={styles.h}>Key dates</Text>
          </View>
          {dates.map((d, i) => {
            const n = daysUntil(d.date);
            const past = n < 0;
            return (
              <View key={`${d.date}${d.label}`} style={[styles.dateRow, i > 0 && styles.divider]}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.label, past && styles.past]}>{d.label}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.when, { color: past ? colors.faint : n <= 3 ? '#C8503F' : colors.greenDark }]}>
                      {dueLabel(d.date)}
                    </Text>
                    <Text style={styles.muted}>{longDate(d.date)}</Text>
                    <PageChip docId={doc.id} page={d.page} />
                  </View>
                </View>
                {!past && (
                  <Pressable
                    onPress={() => calendar(d.label, d.date)}
                    hitSlop={8}
                    accessibilityLabel={`Add ${d.label} to calendar`}
                    style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
                  >
                    <CalendarIcon size={17} color={colors.text} strokeWidth={1.7} />
                    <Text style={styles.iconBtnText}>Add</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
          {hasFuture && reminders.enabled !== null && (
            <View style={[styles.dateRow, styles.divider]}>
              <BellIcon size={16} color={colors.muted} strokeWidth={1.7} />
              <Text style={[styles.muted, { flex: 1 }]}>Remind me 3 days before and on the day</Text>
              <Switch
                value={reminders.enabled}
                onValueChange={reminders.set}
                trackColor={{ false: 'rgba(38,37,31,0.15)', true: colors.ink }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(38,37,31,0.15)"
              />
            </View>
          )}
        </View>
      )}

      {!!amounts.length && (
        <View style={styles.card}>
          <Text style={[styles.h, { marginBottom: 10 }]}>Money</Text>
          <View style={styles.grid}>
            {amounts.map((a) => (
              <View key={`${a.label}${a.value}`} style={styles.amount}>
                <Text style={styles.amountValue} numberOfLines={1} adjustsFontSizeToFit>
                  {a.value}
                </Text>
                <Text style={styles.muted} numberOfLines={2}>
                  {a.label}
                </Text>
                <PageChip docId={doc.id} page={a.page} />
              </View>
            ))}
          </View>
        </View>
      )}

      {!!risks.length && (
        <View style={styles.card}>
          <View style={styles.headRow}>
            <AlertIcon size={16} color="#C8503F" strokeWidth={1.8} />
            <Text style={styles.h}>Worth a closer look</Text>
          </View>
          {risks.map((r, i) => (
            <Pressable
              key={r.text}
              onPress={() => onAsk(`Explain this clause in plain language and what I can do about it: "${r.text}"`)}
              style={({ pressed }) => [styles.riskRow, i > 0 && styles.divider, pressed && { opacity: 0.6 }]}
              accessibilityHint="Asks Pagewise to explain this clause"
            >
              <View style={[styles.level, { backgroundColor: `${LEVEL[r.level].color}1C` }]}>
                <Text style={[styles.levelText, { color: LEVEL[r.level].color }]}>{LEVEL[r.level].label}</Text>
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.riskText}>{r.text}</Text>
                <View style={styles.metaRow}>
                  <PageChip docId={doc.id} page={r.page} />
                  <Text style={styles.explain}>Tap to explain</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

export const panelStyles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  h: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, letterSpacing: -0.2 },
  muted: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted },
});

const styles = StyleSheet.create({
  ...panelStyles,
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(38,37,31,0.12)' },
  label: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  past: { color: colors.faint, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  when: { fontFamily: fonts.semibold, fontSize: 12.5 },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(38,37,31,0.1)',
  },
  iconBtnText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amount: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
    gap: 3,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  amountValue: { fontFamily: fonts.display, fontSize: 18, color: colors.ink, letterSpacing: -0.4 },
  riskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11 },
  level: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, marginTop: 1, minWidth: 46, alignItems: 'center' },
  levelText: { fontFamily: fonts.semibold, fontSize: 11 },
  riskText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text },
  explain: { fontFamily: fonts.medium, fontSize: 12, color: colors.faint },
});
