import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Doc } from '@/types/document';
import { colors, fonts } from '@/constants/theme';
import { DocIcon, SparklesIcon } from '@/components/ui/Icons';
import { tintFor } from '@/constants/folderColors';
import { useLibrary } from '@/state/library';
import { PillButton } from '@/components/ui/PillButton';

const fmtSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

/**
 * Top of the document chat: a "page" card with the AI overview of the PDF
 * (summary + key highlights), styled like the page preview in the design.
 */
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
              <Text style={styles.h}>Overview</Text>
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
  h: { fontFamily: fonts.semibold, fontSize: 13, color: '#2B2A26', marginBottom: 6 },
  body: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: '#55534D' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green, marginTop: 7 },
  bulletText: { flex: 1, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: '#3E3D38' },
  center: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  pager: { textAlign: 'center', marginTop: 14, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
});
