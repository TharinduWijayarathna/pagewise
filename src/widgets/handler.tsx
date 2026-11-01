import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { File, Paths } from 'expo-file-system';
import { UpcomingWidget } from '@/widgets/UpcomingWidget';
import { EMPTY_SNAPSHOT, type WidgetSnapshot } from '@/widgets/snapshot';

/** Android: the widget's data lives in a JSON file the app rewrites when the library changes. */
export const snapshotFile = () => new File(Paths.document, 'widget.json');

export function readSnapshot(): WidgetSnapshot {
  try {
    const f = snapshotFile();
    return f.exists ? (JSON.parse(f.textSync()) as WidgetSnapshot) : EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

/** Rows that fit the widget's current height (each ~44dp after the header). */
export const rowsFor = (heightDp: number) => Math.max(1, Math.min(4, Math.floor((heightDp - 40) / 44)));

/** Runs headless when Android adds, resizes or refreshes the widget (every 30 min, so "In 3 days" stays right). */
export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  renderWidget(<UpcomingWidget snapshot={readSnapshot()} rows={rowsFor(widgetInfo.height)} />);
}
