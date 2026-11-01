import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import type { Doc } from '@/types/document';
import { colors, fonts } from '@/constants/theme';
import { DocIcon, SparklesIcon, SpeakerIcon, StopIcon } from '@/components/ui/Icons';
import { dueLabel, upcomingDates } from '@/utils/dates';
import { tintFor } from '@/constants/folderColors';
import { useLibrary } from '@/state/library';
import { PillButton } from '@/components/ui/PillButton';

const fmtSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

/**
 * Top of the document chat: a "page" card with the AI overview of the PDF
 * (summary + key highlights), styled like the page preview in the design.
 */
/** A short spoken briefing: summary, key points, and (for paperwork) the next date. */
function briefing(doc: Doc) {
  const next = upcomingDates([doc])[0];
  return [
    doc.title + '.',
    doc.summary,
    doc.highlights?.length ? `Key points: ${doc.highlights.join('. ')}.` : '',
    next ? `Coming up: ${next.label}, ${dueLabel(next.date).toLowerCase()}.` : '',
    doc.risks?.length ? `There ${doc.risks.length === 1 ? 'is one clause' : `are ${doc.risks.length} clauses`} worth a closer look.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function ListenButton({ doc }: { doc: Doc }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => void Speech.stop(), []);
  const toggle = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(briefing(doc), { rate: 1.0, onDone: () => setSpeaking(false), onStopped: () => setSpeaking(false), onError: () => setSpeaking(false) });
  };
  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={speaking ? 'Stop the audio briefing' : 'Listen to an audio briefing'}
      style={({ pressed }) => [styles.listen, pressed && { opacity: 0.6 }]}
    >
      {speaking ? <StopIcon size={13} color={colors.ink} strokeWidth={2} /> : <SpeakerIcon size={14} color={colors.ink} strokeWidth={1.8} />}
      <Text style={styles.listenText}>{speaking ? 'Stop' : 'Listen'}</Text>
    </Pressable>
  );
}

export function DocumentOverview({ doc, onRetry }: { doc: Doc; onRetry?: () => void }) {
  const { folders } = useLibrary();
  return (
    <View style={styles.frame}>
      <View style={styles.page}>
        <View style={styles.headRow}>
          <DocIcon size={22} tint={tintFor(folders.find((f) => f.id === doc.folderId)?.color)} />
          <Text style={styles.header} numberOfLines={1}>
            {doc.title.toUpperCase()}
          </Text>
        </View>
        <View style={styles.rule} />

        {doc.status === 'processing' && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.muted} />
            <Text style={styles.body}>Pagewise is reading your document…</Text>
          </View>
        )}

        {doc.status === 'error' && (
          <View style={styles.center}>
            <Text style={[styles.body, { color: '#B9473A', textAlign: 'center' }]}>
              {doc.error ?? 'We couldn’t read this document.'}
            </Text>
            {onRetry && <PillButton label="Try again" size="sm" onPress={onRetry} style={{ alignSelf: 'center' }} />}
          </View>
        )}

        {doc.status === 'ready' && (
          <>
            <View style={styles.labelRow}>
              <SparklesIcon size={13} color={colors.text} strokeWidth={1.6} />
              <Text style={[styles.h, { flex: 1 }]}>Overview</Text>
              <ListenButton doc={doc} />
            </View>
            <Text style={styles.body}>{doc.summary || 'Ask anything about this document below.'}</Text>

            {!!doc.highlights?.length && (
              <>
                <View style={[styles.rule, { marginTop: 14 }]} />
                <Text style={styles.h}>Key highlights</Text>
                {doc.highlights.map((h) => (
                  <View key={h} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{h}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </View>

      <Text style={styles.pager}>
        {[doc.pages ? `${doc.pages} pages` : null, doc.sizeBytes ? fmtSize(doc.sizeBytes) : null]
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    paddingBottom: 12,
  },
  page: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    shadowColor: '#7D785F',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  header: { flex: 1, fontFamily: fonts.semibold, fontSize: 11.5, color: '#3A3934', letterSpacing: 0.6 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: '#D8D6D0', marginVertical: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  listen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1EEE7',
    marginBottom: 6,
  },
  listenText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink },
  h: { fontFamily: fonts.semibold, fontSize: 13, color: '#2B2A26', marginBottom: 6 },
  body: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: '#55534D' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green, marginTop: 7 },
  bulletText: { flex: 1, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: '#3E3D38' },
  center: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  pager: { textAlign: 'center', marginTop: 14, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
});
