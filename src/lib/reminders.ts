import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createEventInCalendarAsync } from 'expo-calendar/legacy';
import type { Doc } from '@/types/document';
import { parseDay, upcomingDates } from '@/utils/dates';
import { readSettings, writeSettings } from '@/lib/settings';

/**
 * Local reminders (no server needed): key dates from admin documents and
 * "cards to review" nudges for study documents. Everything we schedule has an
 * id starting with "pw-", so we can reconcile without touching anything else.
 */

const PREFIX = 'pw-';
const CHANNEL = 'reminders';
/** iOS keeps at most 64 pending local notifications per app. */
const MAX_SCHEDULED = 50;
const REMIND_HOUR = 9;
const STUDY_HOUR = 18;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

type Planned = { id: string; at: Date; title: string; body: string; url: string };

const at = (day: string, hour: number, offsetDays = 0) => {
  const d = parseDay(day);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/** Ids must be stable across runs so unchanged reminders aren't rescheduled. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24);

export function planReminders(docs: Doc[], now = new Date()): Planned[] {
  const out: Planned[] = [];
  for (const k of upcomingDates(docs)) {
    const url = `/document/${k.docId}`;
    const base = `${PREFIX}d-${k.docId}-${k.date}-${slug(k.label)}`;
    const early = at(k.date, REMIND_HOUR, -3);
    if (early > now)
      out.push({ id: `${base}-3`, at: early, title: `In 3 days: ${k.label}`, body: k.docTitle, url });
    const dayOf = at(k.date, REMIND_HOUR);
    if (dayOf > now) out.push({ id: `${base}-0`, at: dayOf, title: `Today: ${k.label}`, body: k.docTitle, url });
  }

  // One study nudge at the next time any flashcards are due.
  const studyDocs = docs.filter((d) => d.cards?.length);
  if (studyDocs.length) {
    const nextDue = Math.min(...studyDocs.flatMap((d) => d.cards!.map((c) => c.due)));
    const when = new Date(Math.max(nextDue, now.getTime()));
    when.setHours(STUDY_HOUR, 0, 0, 0);
    if (when <= now) when.setDate(when.getDate() + 1);
    const doc = studyDocs.find((d) => d.cards!.some((c) => c.due === nextDue)) ?? studyDocs[0];
    out.push({
      id: `${PREFIX}s-${when.getTime()}`,
      at: when,
      title: 'Flashcards ready to review',
      body: `A few minutes now keeps “${doc.title}” fresh.`,
      url: `/study/${doc.id}`,
    });
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_SCHEDULED);
}

export async function remindersAllowed() {
  if (!readSettings().reminders) return false;
  const p = await Notifications.getPermissionsAsync();
  return p.granted;
}

/** Ask for permission and turn reminders on. Returns false if the user declined. */
export async function enableReminders() {
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Reminders', importance: Notifications.AndroidImportance.HIGH });
  let p = await Notifications.getPermissionsAsync();
  if (!p.granted && p.canAskAgain) p = await Notifications.requestPermissionsAsync();
  writeSettings({ reminders: p.granted });
  return p.granted;
}

export async function disableReminders() {
  writeSettings({ reminders: false });
  await syncReminders([]);
}

/** Make the scheduled notifications match the library. Safe to call often. */
export async function syncReminders(docs: Doc[]) {
  const scheduled = (await Notifications.getAllScheduledNotificationsAsync()).filter((n) => n.identifier.startsWith(PREFIX));
  const want = (await remindersAllowed()) ? planReminders(docs) : [];
  const wantIds = new Set(want.map((w) => w.id));
  const haveIds = new Set(scheduled.map((n) => n.identifier));

  await Promise.all(
    scheduled.filter((n) => !wantIds.has(n.identifier)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  for (const w of want.filter((x) => !haveIds.has(x.id))) {
    await Notifications.scheduleNotificationAsync({
      identifier: w.id,
      content: { title: w.title, body: w.body, data: { url: w.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: w.at, channelId: CHANNEL },
    });
  }
}

/** Opens the system "new event" sheet, pre-filled. Nothing is written without the user confirming. */
export async function addToCalendar(item: { label: string; date: string; docTitle: string }) {
  const start = parseDay(item.date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return createEventInCalendarAsync({
    title: item.label,
    startDate: start,
    endDate: end,
    allDay: true,
    notes: `From “${item.docTitle}” · Pagewise`,
  });
}
