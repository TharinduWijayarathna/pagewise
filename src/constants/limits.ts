/** Max documents per plan (checked in the app; see docs/architecture.md). */
export const PLAN_LIMITS = { free: 10, pro: 500 } as const;

/** Gemini inline requests are capped at 20 MB; base64 adds ~33%, so keep PDFs under 14 MB. */
export const MAX_PDF_BYTES = 14 * 1024 * 1024;
