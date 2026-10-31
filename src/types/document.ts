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
};
