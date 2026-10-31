# Getting started

This guide takes you from a fresh computer to Pagewise running on an Android emulator or iPhone simulator.
No prior React Native experience needed — just follow the steps in order.

> ⏱️ First-time setup takes about **45–60 minutes**, most of it downloads.

---

## 1. Install the tools

| Tool | Why | How |
|---|---|---|
| **Node.js 20 LTS or newer** | Runs the JavaScript tooling | <https://nodejs.org> → download the LTS installer |
| **Git** | Downloads the code | macOS: run `git --version` (it offers to install). Windows: <https://git-scm.com> |
| **Android Studio** | Android emulator + Android SDK + Java | <https://developer.android.com/studio> |
| **Xcode** *(macOS only, for iPhone)* | iPhone simulator | Mac App Store → Xcode |
| **CocoaPods** *(macOS only, for iPhone)* | iOS libraries | `brew install cocoapods` (install Homebrew from <https://brew.sh> first) |

Check Node is installed:

```bash
node -v   # should print v20 or higher
```

### Android Studio first run
1. Open Android Studio → **More Actions → SDK Manager** and make sure an **Android SDK Platform** is installed.
2. **More Actions → Virtual Device Manager → Create device** → pick a phone (e.g. *Medium Phone*) → finish.
3. Tell your terminal where Android lives. On **macOS**, add these lines to `~/.zshrc`, then open a new terminal:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

On **Windows**, set `ANDROID_HOME` to `%LOCALAPPDATA%\Android\Sdk` and `JAVA_HOME` to
`C:\Program Files\Android\Android Studio\jbr` in *System → Environment Variables*.

### Xcode first run (iPhone only)
Open Xcode once, accept the license, and let it install components.
Then open the simulator from **Xcode → Open Developer Tool → Simulator**.

---

## 2. Get the code

```bash
git clone <your-repo-url> pagewise
cd pagewise
npm install
```

`npm install` downloads all libraries into `node_modules/` (a few minutes).

---

## 3. Connect your own Firebase project

Pagewise needs a Firebase project for sign-in, the database and Gemini AI.
Follow **[firebase-setup.md](./firebase-setup.md)** — it's click-by-click and free.

When you're done, the project folder must contain these three files (they are **not** in Git, because they're yours):

```
pagewise/
├── .env                        ← copied from .env.example and filled in
├── google-services.json        ← from Firebase (Android)
└── GoogleService-Info.plist    ← from Firebase (iOS)
```

---

## 4. Run the app

Pagewise uses native modules (Firebase, voice input…), so it **can't run in Expo Go**.
These commands build a real development app and install it for you.

### Android
1. Start your emulator from Android Studio's Virtual Device Manager (▶ button).
2. In the project folder:

```bash
npm run android
```

The first build takes **5–15 minutes**. When it finishes, Pagewise opens on the emulator.

### iPhone (macOS only)
1. Open the Simulator (Xcode → Open Developer Tool → Simulator).
2. In the project folder:

```bash
npm run ios
```

The first build takes **10–20 minutes** (Firebase is large).

---

## 5. Everyday development

After the first build you don't need to rebuild for code changes:

```bash
npm start
```

Then open the Pagewise app on your emulator/simulator — it connects to this dev server and
**updates instantly** when you save a file.

You only need `npm run android` / `npm run ios` again when you:
- install a new library with native code,
- change `app.json`, or
- change the Firebase config files.

---

## 6. Useful commands

| Command | What it does |
|---|---|
| `npm start` | Start the dev server (live reload) |
| `npm run android` | Build & install the Android app |
| `npm run ios` | Build & install the iPhone app |
| `npm run typecheck` | Check the code for TypeScript errors |
| `npm run prebuild` | Regenerate the `android/` and `ios/` folders from `app.json` |
| `npm run doctor` | Diagnose common Expo setup problems |

Something not working? See **[troubleshooting.md](./troubleshooting.md)**.
