import type { FolderColorKey } from '@/constants/folderColors';

export type DocStatus = 'processing' | 'ready' | 'error';

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

