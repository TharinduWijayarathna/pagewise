import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { liveView, type WidgetSnapshot } from '@/widgets/snapshot';

/** Android home-screen widget: "Coming up" dates + flashcards to review. Mirrors targets/widget on iOS. */

const C = {
  bg: '#F4EFE4',
  ink: '#1D1C19',
  muted: '#76746C',
  green: '#3F9A3D',
  rose: '#B9473A',
  line: '#E3DCCD',
} as const;

const link = (path: string) => ({ clickAction: 'OPEN_URI', clickActionData: { uri: `pagewise://${path}` } });

export function UpcomingWidget({ snapshot, rows = 3 }: { snapshot: WidgetSnapshot; rows?: number }) {
  const { items, cardsDue } = liveView(snapshot);
  const shown = items.slice(0, cardsDue ? Math.max(1, rows - 1) : rows);
  const empty = !shown.length && !cardsDue;

  return (
    <FlexWidget
      {...link('home')}
      accessibilityLabel="Pagewise: coming up"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: C.bg,
        borderRadius: 22,
        padding: 14,
        flexDirection: 'column',
      }}
    >
      <TextWidget text="COMING UP" style={{ fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.08 }} />

      {empty && (
        <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
          <TextWidget text="Nothing due" style={{ fontSize: 16, fontWeight: '600', color: C.ink }} />
          <TextWidget
            text={snapshot.docCount ? 'No deadlines in your documents.' : 'Share a PDF to Pagewise to start.'}
            style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}
            maxLines={2}
          />
        </FlexWidget>
      )}

      {shown.map((i) => (
        <FlexWidget
          key={`${i.docId}${i.date}${i.label}`}
          {...link(`document/${i.docId}`)}
          style={{ flexDirection: 'column', marginTop: 8, width: 'match_parent' }}
        >
          <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', alignItems: 'center' }}>
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget text={i.label} maxLines={1} truncate="END" style={{ fontSize: 14, fontWeight: '600', color: C.ink }} />
            </FlexWidget>
            <TextWidget text={`  ${i.when}`} style={{ fontSize: 12, fontWeight: '600', color: i.soon ? C.rose : C.green }} />
          </FlexWidget>
          <TextWidget text={i.docTitle} maxLines={1} truncate="END" style={{ fontSize: 12, color: C.muted }} />
        </FlexWidget>
      ))}

      {cardsDue > 0 && (
        <FlexWidget
          {...link(snapshot.studyDocId ? `study/${snapshot.studyDocId}` : 'home')}
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: C.line,
            width: 'match_parent',
            flexDirection: 'row',
          }}
        >
          <TextWidget
            text={`${cardsDue} flashcard${cardsDue === 1 ? '' : 's'} to review`}
            style={{ fontSize: 13, fontWeight: '600', color: C.green }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
