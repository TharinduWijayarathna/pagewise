import { File, Paths } from 'expo-file-system';

/** Small per-device preferences, kept in a JSON file next to the PDFs. */
export type Settings = { reminders: boolean };

const DEFAULTS: Settings = { reminders: false };
const file = () => new File(Paths.document, 'settings.json');

export function readSettings(): Settings {
  try {
    const f = file();
    return f.exists ? { ...DEFAULTS, ...JSON.parse(f.textSync()) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function writeSettings(patch: Partial<Settings>) {
  const next = { ...readSettings(), ...patch };
  const f = file();
  if (!f.exists) f.create();
  f.write(JSON.stringify(next));
  return next;
}
