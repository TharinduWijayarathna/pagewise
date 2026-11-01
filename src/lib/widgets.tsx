import { Platform } from 'react-native';
import type { Doc } from '@/types/document';
import { buildSnapshot } from '@/widgets/snapshot';

/** Must match ios.entitlements in app.json and targets/widget/expo-target.config.js. */
export const APP_GROUP = 'group.com.pagewise.app';
const ANDROID_WIDGET = 'Upcoming';

let last = '';

/** Push the latest "coming up" data to the home-screen widgets (no-op if nothing changed). */
export async function syncWidgets(docs: Doc[]) {
  const snapshot = buildSnapshot(docs);
  const json = JSON.stringify(snapshot);
  if (json === last) return;
  last = json;

  if (Platform.OS === 'ios') {
    const { ExtensionStorage } = await import('@bacons/apple-targets');
    new ExtensionStorage(APP_GROUP).set('snapshot', json);
    ExtensionStorage.reloadWidget();
    return;
  }

  if (Platform.OS === 'android') {
    const [{ requestWidgetUpdate }, { snapshotFile, rowsFor }, { UpcomingWidget }] = await Promise.all([
      import('react-native-android-widget'),
      import('@/widgets/handler'),
      import('@/widgets/UpcomingWidget'),
    ]);
    const f = snapshotFile();
    if (!f.exists) f.create();
    f.write(json);
    await requestWidgetUpdate({
      widgetName: ANDROID_WIDGET,
      renderWidget: (info) => <UpcomingWidget snapshot={snapshot} rows={rowsFor(info.height)} />,
    });
  }
}
