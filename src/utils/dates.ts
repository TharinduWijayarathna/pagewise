import type { Doc, KeyDate } from '@/types/document';

const DAY = 86_400_000;

/** "2026-11-14" → local midnight of that day (no timezone shift). */
export function parseDay(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(parseDay(v).getTime());

/** Whole days from today to `day` (0 = today, negative = past). */
export function daysUntil(day: string, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDay(day).getTime() - today.getTime()) / DAY);
}

/** "Today", "Tomorrow", "In 5 days", "Mar 3", "2 days ago". */
export function dueLabel(day: string) {
  const n = daysUntil(day);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n > 1 && n <= 13) return `In ${n} days`;
  if (n < 0 && n >= -6) return n === -1 ? 'Yesterday' : `${-n} days ago`;
  return parseDay(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: n > 300 || n < -300 ? 'numeric' : undefined });
}

/** "Fri, 14 Nov 2026" */
export const longDate = (day: string) =>
  parseDay(day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export type Upcoming = KeyDate & { docId: string; docTitle: string; days: number };

/** Future (or today's) key dates across the library, soonest first. */
export function upcomingDates(docs: Doc[], withinDays = 365): Upcoming[] {
  return docs
    .flatMap((d) => (d.keyDates ?? []).map((k) => ({ ...k, docId: d.id, docTitle: d.title, days: daysUntil(k.date) })))
    .filter((k) => k.days >= 0 && k.days <= withinDays)
    .sort((a, b) => a.days - b.days);
}

/** Flashcards due now across the library. */
export function dueCards(docs: Doc[], now = Date.now()) {
  return docs.flatMap((d) => (d.cards ?? []).filter((c) => c.due <= now).map((c) => ({ ...c, docId: d.id })));
}
