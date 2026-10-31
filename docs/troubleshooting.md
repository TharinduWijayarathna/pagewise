# Troubleshooting

Real problems hit while building Pagewise, and how to fix them. Search this page for the error text you see.

---

### Gemini / AI

**"Gemini isn't enabled for this Firebase project yet"** / `AI/api-not-enabled`
Firebase console → **AI Logic → Get started** → choose **Gemini Developer API**. If you just did it, wait 2–5 minutes.

**"This app couldn't be verified"** / `Firebase App Check token is invalid` / `403 App attestation failed`
The debug token isn't registered for the platform you're running on.
1. Check `.env` has `EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN=…`
2. Firebase → **App Check → Apps → (Android *and* iOS app) → ⋮ → Manage debug tokens** → add the same token.
3. Restart the dev server (`npm start`) so `.env` is reloaded.

**"Pagewise is busy right now"** — you hit a Gemini rate limit or quota. Wait a minute.

**"This PDF is too large"** — PDFs must be under 14 MB.

---

### Sign-in

**`auth/keychain-error`** (iOS simulator)
The app was built without code signing, so it can't use the iOS Keychain. Build with `npm run ios`
(it signs locally). If you build with `xcodebuild` yourself, don't pass `CODE_SIGNING_ALLOWED=NO` —
use `CODE_SIGN_IDENTITY=-` instead.

**Google sign-in fails / "did not return an ID token"**
- `.env` → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` must end with `.apps.googleusercontent.com`
  (not the project number).
- The SHA-1 and SHA-256 must be added to the Android app in Firebase, and `google-services.json`
  re-downloaded **after** enabling Google sign-in.
- On an emulator, a Google account must be added to the device.

**`firestore/permission-denied`**
- The Firestore rules weren't published, or are out of date (e.g. after the folders feature was added) — paste [`firestore.rules`](../firestore.rules) and click **Publish**.
- An account created during an interrupted sign-up may be missing its profile; the app repairs this
  automatically on the next sign-in (just log in again).

---

### Building

**`Module was compiled with an incompatible version of Kotlin`**
Already handled: `app.json` sets `expo-build-properties → android.kotlinVersion`. Run `npm run prebuild`
then `npm run android`.

**`Unable to resolve "react-native-reanimated"`** or a red screen after installing a library
Restart the dev server with a clean cache: `npx expo start --dev-client --clear`.

**`No code signing certificates are available`** when running `npm run ios`
Expo mistook the simulator for a real iPhone. Make sure the **Simulator app is open** with a device booted,
then run `npm run ios` again. For a real iPhone you need an Apple Developer account and a team
selected in Xcode.

**`Unable to locate a Java Runtime`** — set `JAVA_HOME` to Android Studio's bundled JDK
(see [getting-started.md](./getting-started.md#android-studio-first-run)).

**`adb: no devices/emulators found`** — start an emulator from Android Studio → Virtual Device Manager.

**"Unable to find application named 'Simulator'"** — open it from **Xcode → Open Developer Tool → Simulator**.
If it's missing, install the iOS platform in **Xcode → Settings → Components**.

**Can't run in Expo Go** — correct, Pagewise needs a development build (`npm run android` / `npm run ios`)
because Firebase and voice input include native code.

---

### Running

**Changes don't show up on the device**
The dev server must be running (`npm start`). If you started it with `CI=1`, live reload is disabled.

**The keyboard covers the message box (Android emulator)**
If you type with your computer's keyboard, Android hides the on-screen keyboard. That's normal.
On a real phone the input moves above the keyboard.

**Voice typing does nothing on the emulator**
The emulator has no microphone audio by default. Enable it in the emulator's **⋯ → Microphone →
"Virtual microphone uses host audio input"**, or test on a real phone.

**`The action 'GO_BACK' was not handled by any navigator`**
A development-only warning (never shown to users) — "back" was pressed with nothing to go back to.
Safe to ignore.

**Emulator lost the installed app**
Emulators started with `-no-snapshot-save` or that crashed may reset. Run `npm run android` again.

---

Still stuck? Run `npm run doctor` and `npm run typecheck`, and check the dev server's terminal output —
Pagewise logs the full Gemini error there in development (`[Pagewise] Gemini request failed: …`).
