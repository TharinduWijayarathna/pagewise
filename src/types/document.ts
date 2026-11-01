import type { FolderColorKey } from '@/constants/folderColors';

export type DocStatus = 'processing' | 'ready' | 'error';

/**
 * What kind of document this is, decided by Gemini when it first reads it.
 * - `admin`: contracts, leases, bills, policies, letters → dates, amounts, risky clauses
 * - `study`: lecture notes, papers, textbooks → flashcards and quizzes
 * - `general`: everything else
 */
export type DocMode = 'admin' | 'study' | 'general';

/** Where the PDF came from. */
export type DocSource = 'upload' | 'scan' | 'share';

/** A dated item found in the document (deadline, renewal, payment due…). */
export type KeyDate = {
  label: string;
  /** Calendar day, "YYYY-MM-DD". */
  date: string;
  kind: 'deadline' | 'renewal' | 'payment' | 'event' | 'other';
  page?: number;
};

export type Amount = { label: string; value: string; page?: number };

/** A clause or term worth a second look before signing / paying. */
export type Risk = { text: string; level: 'high' | 'medium' | 'low'; page?: number };

/**
 * Flashcard with a simple Leitner schedule: `box` 1–5, the card is due again
 * after 1, 2, 4, 8 or 16 days. `due` is epoch millis.
 */
export type Flashcard = { id: string; q: string; a: string; page?: number; box: number; due: number };

export type QuizQuestion = { q: string; options: string[]; answer: number; why: string; page?: number };

export type Doc = {
  id: string;
  title: string;
  fileName: string;
  pages: number;
  sizeBytes: number;
  status: DocStatus;
  error?: string;
  /** AI-generated overview, filled in after upload. */
  summary?: string;
  highlights?: string[];
  createdAt: number;
  lastAt?: number;
  lastQuestion?: string;
  lastAnswer?: string;
  questionCount: number;
  /** Folder this document lives in; null/undefined = unfiled. */
  folderId?: string | null;
  mode: DocMode;
  source: DocSource;
  /** Admin documents: extracted when the PDF is first read. */
  keyDates?: KeyDate[];
  amounts?: Amount[];
  risks?: Risk[];
  /** Study documents: generated on request. */
  cards?: Flashcard[];
};

export type Folder = {
  id: string;
  name: string;
  /** Palette key from constants/folderColors (documents in the folder use this colour). */
  color: FolderColorKey;
  createdAt: number;
};

/** AI organize suggestion: folders to create/reuse and which documents go in each. */
export type OrganizePlan = {
  folders: { name: string; existingFolderId?: string | null; docIds: string[] }[];
};

