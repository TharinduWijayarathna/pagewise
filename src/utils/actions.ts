import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { presentSheet } from '@/components/ui/ActionSheetHost';

export type Action = { label: string; onPress: () => void; destructive?: boolean };

/** Native action sheet on iOS, a bottom sheet on Android (see ActionSheetHost). */
export function showActions(title: string, actions: Action[]) {
  if (Platform.OS === 'ios') {
    const destructive = actions.findIndex((a) => a.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...actions.map((a) => a.label), 'Cancel'],
        cancelButtonIndex: actions.length,
        destructiveButtonIndex: destructive >= 0 ? destructive : undefined,
      },
      (i) => actions[i]?.onPress(),
    );
    return;
  }
  if (presentSheet({ title, actions })) return;
  // Fallback if the host isn't mounted (Android dialogs show at most 3 buttons).
  Alert.alert(title, undefined, [
    ...actions.map((a) => ({ text: a.label, style: a.destructive ? ('destructive' as const) : undefined, onPress: a.onPress })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

/** Two-step confirmation for destructive actions. */
export function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
