import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useLibrary } from '@/state/library';
import { confirm, showActions } from '@/utils/actions';
import type { Doc } from '@/types/document';
import { dateLabel } from '@/utils/format';
import { colors, fonts } from '@/constants/theme';
import { ChevronRightIcon, FolderIcon, GreenDocIcon } from '@/components/ui/Icons';

/**
 * Compact document row: icon · title + meta · chevron.
 * Tap opens the chat; long-press opens Move / Delete.
 */
export function DocumentCard({ doc }: { doc: Doc }) {
  const { removeDoc, folders } = useLibrary();
  const folder = folders.find((f) => f.id === doc.folderId)?.name;
  const open = () => router.push({ pathname: '/document/[id]', params: { id: doc.id } });
  const menu = () =>
    showActions(doc.title, [
      { label: 'Move to folder', onPress: () => router.push({ pathname: '/move', params: { docId: doc.id } }) },
      {
        label: 'Delete document',
        destructive: true,
        onPress: () => confirm('Delete document?', `“${doc.title}” and its chat history will be removed.`, 'Delete', () => removeDoc(doc.id)),
      },
    ]);

  const meta = [dateLabel(doc.createdAt), doc.pages > 0 ? `${doc.pages} pages` : null].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={open}
      onLongPress={menu}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityHint="Opens the chat. Long-press for more options."
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <GreenDocIcon size={22} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {doc.title}
        </Text>

        {doc.status === 'processing' ? (
          <View style={styles.metaRow}>
            <ActivityIndicator size="small" color={colors.muted} style={{ transform: [{ scale: 0.75 }] }} />
            <Text style={styles.meta}>Reading document…</Text>
          </View>
        ) : doc.status === 'error' ? (
          <Text style={[styles.meta, styles.error]} numberOfLines={1}>
            Couldn’t read this PDF · Tap to retry
          </Text>
        ) : (
          <View style={styles.metaRow}>
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
            {!!folder && (
              <View style={styles.folderTag}>
                <FolderIcon size={11} color={colors.muted} strokeWidth={2} />
                <Text style={styles.folderText} numberOfLines={1}>
                  {folder}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ChevronRightIcon size={18} color={colors.faint} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
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
  title: { fontFamily: fonts.medium, fontSize: 15.5, color: colors.text, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, flexShrink: 1 },
  error: { color: '#B9473A' },
  folderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(38,37,31,0.06)',
    maxWidth: 120,
  },
  folderText: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.muted, flexShrink: 1 },
});
