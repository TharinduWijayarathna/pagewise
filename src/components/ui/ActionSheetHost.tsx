import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Action } from '@/utils/actions';
import { colors, fonts } from '@/constants/theme';

/**
 * Android bottom sheet for `showActions` (Android's Alert can only show 3 buttons).
 * Mounted once in app/_layout.tsx; `showActions` talks to it through `present`.
 */

type Sheet = { title: string; actions: Action[] };
let present: ((s: Sheet) => void) | null = null;

export function presentSheet(s: Sheet) {
  present?.(s);
  return !!present;
}

export function ActionSheetHost() {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    present = setSheet;
    return () => {
      present = null;
    };
  }, []);

  const run = (a?: Action) => {
    setSheet(null);
    // Let the sheet close before the action (which may open another screen or sheet).
    if (a) setTimeout(a.onPress, 220);
  };

  return (
    <Modal visible={!!sheet} transparent animationType="fade" onRequestClose={() => run()} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={() => run()} accessibilityLabel="Close menu" />
      <View style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}>
        {!!sheet?.title && (
          <Text style={styles.title} numberOfLines={2}>
            {sheet.title}
          </Text>
        )}
        {sheet?.actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => run(a)}
            android_ripple={{ color: 'rgba(38,37,31,0.08)' }}
            style={styles.item}
          >
            <Text style={[styles.itemText, a.destructive && { color: '#B9473A' }]}>{a.label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => run()} android_ripple={{ color: 'rgba(38,37,31,0.08)' }} style={[styles.item, styles.cancel]}>
          <Text style={[styles.itemText, { color: colors.muted }]}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,19,17,0.35)' },
  sheet: {
    backgroundColor: '#FBF8F2',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 14,
    paddingHorizontal: 8,
  },
  title: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.muted, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  item: { paddingVertical: 15, paddingHorizontal: 18, borderRadius: 14 },
  itemText: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  cancel: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(38,37,31,0.12)', marginTop: 4 },
});
