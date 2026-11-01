import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { fonts } from '@/constants/theme';

/** Open the PDF viewer for a document at a page. */
export const openPage = (docId: string, page?: number) =>
  router.push({ pathname: '/viewer/[id]', params: { id: docId, page: String(page ?? 1) } });

/** Small green "p. 4" chip that opens that page of the PDF. */
export function PageChip({ docId, page }: { docId: string; page?: number }) {
  if (!page) return null;
  return (
    <Pressable
      onPress={() => openPage(docId, page)}
      hitSlop={8}
      accessibilityRole="link"
      accessibilityLabel={`Open page ${page}`}
      style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.text}>{`p. ${page}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    backgroundColor: 'rgba(93,180,88,0.14)',
    alignSelf: 'flex-start',
  },
  text: { fontFamily: fonts.semibold, fontSize: 11.5, color: '#2F7A2D' },
});
