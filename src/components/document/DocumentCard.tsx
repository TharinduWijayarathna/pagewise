import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Doc } from '@/types/document';
import { dateLabel } from '@/utils/format';
import { colors, fonts } from '@/constants/theme';
import { FileTextIcon, GreenDocIcon } from '@/components/ui/Icons';
import { PillButton } from '@/components/ui/PillButton';

export function DocumentCard({ doc }: { doc: Doc }) {
  const open = () => router.push({ pathname: '/document/[id]', params: { id: doc.id } });

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.iconBox}>
        <GreenDocIcon size={34} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {doc.title}
        </Text>

        <View style={styles.meta}>
          <FileTextIcon size={15} color={colors.muted} strokeWidth={1.5} />
          <Text style={styles.metaText}>{dateLabel(doc.createdAt)}</Text>
          {doc.pages > 0 && (
            <>
              <View style={styles.dot} />
              <FileTextIcon size={15} color={colors.muted} strokeWidth={1.5} />
              <Text style={styles.metaText}>{doc.pages} pages</Text>
            </>
          )}
        </View>

        {doc.status === 'processing' ? (
          <View style={styles.status}>
            <ActivityIndicator size="small" color={colors.muted} />
            <Text style={styles.statusText}>Reading document…</Text>
          </View>
        ) : doc.status === 'error' ? (
          <View style={styles.status}>
            <Text style={[styles.statusText, { color: '#B9473A' }]}>Couldn’t read this PDF · Tap to retry</Text>
          </View>
        ) : (
          <PillButton label="Chat now" size="sm" sparkle onPress={open} style={{ marginTop: 14 }} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, height: 38 },
  statusText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.muted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 26,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
  },
  iconBox: {
    width: 78,
    height: 98,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9A9578',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  body: { flex: 1, marginLeft: 22 },
  title: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 21, color: colors.text, letterSpacing: -0.2 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 },
  metaText: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.muted },
  dot: { width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: colors.muted, marginHorizontal: 4 },
});
