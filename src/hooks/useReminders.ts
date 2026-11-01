import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { disableReminders, enableReminders, remindersAllowed, syncReminders } from '@/lib/reminders';
import { useLibrary } from '@/state/library';

/** Reminders on/off for this device (shared by the document screen and Profile). */
export function useReminders() {
  const { docs } = useLibrary();
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    remindersAllowed().then(setEnabled);
  }, []);

  const set = useCallback(
    async (on: boolean) => {
      if (!on) {
        setEnabled(false);
        await disableReminders();
        return;
      }
      const ok = await enableReminders();
      setEnabled(ok);
      if (ok) await syncReminders(docs);
      else
        Alert.alert('Notifications are off', 'Allow notifications for Pagewise in Settings to get reminders.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
    },
    [docs],
  );

  return { enabled, set };
}
