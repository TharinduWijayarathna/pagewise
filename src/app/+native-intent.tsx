/**
 * The iOS share extension (expo-share-intent) opens the app with a
 * `pagewise://dataUrl=…` link. That isn't a screen, so send it somewhere
 * valid; the share itself is picked up in app/_layout.tsx.
 */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    if (path.includes('dataUrl=')) return initial ? '/' : '/home';
    return path;
  } catch {
    return '/';
  }
}
