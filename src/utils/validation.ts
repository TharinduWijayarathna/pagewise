export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** 0–4 score used by the strength meter on the register screen. */
export function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: pw ? labels[score] : '' };
}
