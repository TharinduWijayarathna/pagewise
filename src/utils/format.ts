const DAY = 86_400_000;

/** "Today", "Yesterday", "Mon", or "Oct 21" for document cards. */
export function dateLabel(at: number) {
  const d = new Date(at);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (at >= start.getTime()) return 'Today';
  if (at >= start.getTime() - DAY) return 'Yesterday';
  if (at >= start.getTime() - 6 * DAY) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "Just now", "5m ago", "3h ago", "Yesterday", "4d ago". */
export function timeAgo(at: number) {
  const m = Math.round((Date.now() - at) / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
}

/** Local calendar day as "YYYY-MM-DD" (used for per-day question counts). */
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "tharindu" → "Tharindu" (for names coming from email prefixes etc.). */
export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "3 documents", "1 document" */
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Human-readable message for Firestore / network errors shown in forms. */
export function friendlyError(err: unknown) {
  const code = String((err as { code?: string })?.code ?? '');
  const msg = String((err as Error)?.message ?? '');
  if (code.includes('permission-denied') || msg.includes('permission-denied'))
    return 'You don’t have permission to do that right now. Please try again in a moment.';
  if (code.includes('unavailable') || /network/i.test(msg)) return 'No internet connection. Check your network and try again.';
  return msg.replace(/^\[[^\]]+\]\s*/, '') || 'Something went wrong. Please try again.';
}
