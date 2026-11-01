import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LockIcon } from '@/components/ui/Icons';
import { colors, fonts } from '@/constants/theme';

/**
 * The privacy promise, stated precisely: the PDF file is stored only on this
 * phone; Gemini sees it only while reading or answering.
 */
export function PrivacyNote({ style, compact }: { style?: ViewStyle; compact?: boolean }) {
  return (
    <View style={[styles.row, style]}>
      <LockIcon size={14} color={colors.greenDark} strokeWidth={2} />
      <Text style={styles.text}>
        {compact
          ? 'Your PDFs stay on this phone.'
          : 'Your PDFs stay on this phone, never in our cloud. Pages are sent securely to Gemini only while it reads or answers.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 6 },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: colors.muted },
});
