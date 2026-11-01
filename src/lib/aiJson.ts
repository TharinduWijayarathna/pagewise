import type { Amount, DocMode, Flashcard, KeyDate, QuizQuestion, Risk } from '@/types/document';
import { isDay } from '@/utils/dates';

/**
 * Gemini is asked for JSON, but its output is still untrusted: these helpers
 * parse it and keep only well-formed items, so bad output can never break the UI.
 */

export function parseJson<T>(raw: string): T {
  return JSON.parse(raw.replace(/^\s*```(?:json)?|```\s*$/g, '').trim()) as T;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const page = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 1 ? Math.round(v) : undefined);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});
/** Firestore rejects `undefined` values, so drop the key instead. */
const withPage = <T extends object>(item: T, p?: number) => (p ? { ...item, page: p } : item);

export const MODES: DocMode[] = ['admin', 'study', 'general'];
export const toMode = (v: unknown): DocMode => (MODES.includes(v as DocMode) ? (v as DocMode) : 'general');

const DATE_KINDS: KeyDate['kind'][] = ['deadline', 'renewal', 'payment', 'event', 'other'];
const LEVELS: Risk['level'][] = ['high', 'medium', 'low'];

export const toKeyDates = (v: unknown): KeyDate[] =>
  arr(v)
    .map(obj)
    .filter((x) => isDay(x.date) && str(x.label, 80))
    .slice(0, 12)
    .map((x) =>
      withPage(
        {
          label: str(x.label, 80),
          date: x.date as string,
          kind: DATE_KINDS.includes(x.kind as KeyDate['kind']) ? (x.kind as KeyDate['kind']) : 'other',
        },
        page(x.page),
      ),
    );

export const toAmounts = (v: unknown): Amount[] =>
  arr(v)
    .map(obj)
    .filter((x) => str(x.label, 60) && str(x.value, 40))
    .slice(0, 8)
    .map((x) => withPage({ label: str(x.label, 60), value: str(x.value, 40) }, page(x.page)));

export const toRisks = (v: unknown): Risk[] =>
  arr(v)
    .map(obj)
    .filter((x) => str(x.text, 220))
    .slice(0, 8)
    .map((x) =>
      withPage(
        { text: str(x.text, 220), level: LEVELS.includes(x.level as Risk['level']) ? (x.level as Risk['level']) : 'medium' },
        page(x.page),
      ),
    )
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));

export const toCards = (v: unknown, now = Date.now()): Flashcard[] =>
  arr(v)
    .map(obj)
    .filter((x) => str(x.q, 200) && str(x.a, 400))
    .slice(0, 30)
    .map((x, i) => withPage({ id: `c${now.toString(36)}${i}`, q: str(x.q, 200), a: str(x.a, 400), box: 1, due: now }, page(x.page)));

export const toQuiz = (v: unknown): QuizQuestion[] =>
  arr(v)
    .map(obj)
    .map((x) => ({ raw: x, options: arr(x.options).map((o) => str(o, 140)).filter(Boolean).slice(0, 4) }))
    .filter(({ raw, options }) => {
      const a = raw.answer as number;
      // Drop the question if trimming removed an option and shifted the correct index.
      return str(raw.q, 240) && options.length >= 2 && options.length === arr(raw.options).length && Number.isInteger(a) && a >= 0 && a < options.length;
    })
    .slice(0, 10)
    .map(({ raw, options }) => withPage({ q: str(raw.q, 240), options, answer: raw.answer as number, why: str(raw.why, 300) }, page(raw.page)));
