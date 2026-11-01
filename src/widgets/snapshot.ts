import type { Doc } from '@/types/document';
import { daysUntil, dueLabel, upcomingDates } from '@/utils/dates';

/**
 * What the home-screen widgets show. Dates are stored raw so the widget can
 * recompute "Today / In 3 days" on its own after midnight without the app.
 */
export type WidgetSnapshot = {
  v: 1;
  items: { label: string; docTitle: string; docId: string; date: string }[];
  /** Due times (epoch ms) of all flashcards, so the count stays right as time passes. */
  cardDues: number[];
  /** A study document to open from the "review" row. */
  studyDocId?: string;
  docCount: number;
};

export function buildSnapshot(docs: Doc[]): WidgetSnapshot {
  const study = docs.filter((d) => d.cards?.length);
  return {
    v: 1,
    items: upcomingDates(docs, 120)
      .slice(0, 4)
      .map((k) => ({ label: k.label, docTitle: k.docTitle, docId: k.docId, date: k.date })),
    cardDues: study.flatMap((d) => d.cards!.map((c) => c.due)).slice(0, 500),
    studyDocId: study.sort((a, b) => Math.min(...a.cards!.map((c) => c.due)) - Math.min(...b.cards!.map((c) => c.due)))[0]?.id,
    docCount: docs.length,
  };
}

/** Same filtering the widget does at render time. */
export function liveView(s: WidgetSnapshot, now = Date.now()) {
  return {
    items: s.items.filter((i) => daysUntil(i.date) >= 0).map((i) => ({ ...i, when: dueLabel(i.date), soon: daysUntil(i.date) <= 3 })),
    cardsDue: s.cardDues.filter((d) => d <= now).length,
  };
}

export const EMPTY_SNAPSHOT: WidgetSnapshot = { v: 1, items: [], cardDues: [], docCount: 0 };
