# Architecture

How Pagewise is put together, where things live, and how data flows.

## Tech stack

| Area | Library |
|---|---|
| App framework | [Expo](https://docs.expo.dev) SDK 58 + React Native 0.88, TypeScript |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routes in `src/app/`) |
| Sign-in | Firebase Auth (`@react-native-firebase/auth`), Google Sign-In, Sign in with Apple |
| Database | Cloud Firestore (`@react-native-firebase/firestore`) |
| AI | Firebase AI Logic → Gemini (`@react-native-firebase/ai`) |
| Security | Firebase App Check (Play Integrity / App Attest) |
| Files | `expo-file-system` (PDFs are kept on the device), `expo-document-picker` |
| Voice input | `expo-speech-recognition` |
| Share to app | `expo-share-intent` (iOS share extension "Ask Pagewise", Android `SEND application/pdf`) |
| Scanning | `react-native-document-scanner-plugin` → `expo-print` joins pages into a PDF |
| PDF viewer | `react-native-pdf` (+ `react-native-blob-util`) |
| Reminders & calendar | `expo-notifications` (local only), `expo-calendar` (system "new event" sheet) |
| Audio briefing | `expo-speech` |
| Share card | `react-native-view-shot` + `expo-sharing` |
| Widgets | iOS: `@bacons/apple-targets` (SwiftUI in `targets/widget`); Android: `react-native-android-widget` |
| Keyboard | `react-native-keyboard-controller` |
| UI | `expo-linear-gradient`, `react-native-svg`, DM Sans font |

## Folder structure

```
pagewise/
├── app.json                 # App name, icons, splash, plugins (native config lives here)
├── firestore.rules          # Firestore security rules — paste into the Firebase console
├── .env.example             # Template for your local .env
├── assets/                  # App icon, splash and Android icon layers
├── docs/                    # You are here
└── src/
    ├── app/                 # Screens. Every file is a route (Expo Router)
    │   ├── _layout.tsx      #   Root: fonts, splash, providers, auth redirects
    │   ├── index.tsx        #   Welcome screen ("/")
    │   ├── auth/            #   login, register, forgot-password
    │   ├── (tabs)/          #   home, history, insights, profile + tab bar layout
    │   ├── document/[id].tsx#   Chat with one document
    │   ├── documents.tsx    #   All documents (search + sort)
    │   ├── upload.tsx       #   Pick & analyse a PDF
    │   ├── folder/[id].tsx  #   Documents in one folder (rename / delete)
    │   ├── folder-form.tsx  #   New / rename folder
    │   ├── move.tsx         #   Move a document to a folder
    │   ├── organize.tsx     #   Organize with AI (review & apply)
    │   ├── notifications.tsx
    │   ├── edit-profile.tsx
    │   └── upgrade.tsx
    ├── components/
    │   ├── ui/              # Building blocks: PillButton, GlossyIcon, Icons, Background, form fields
    │   ├── layout/          # AuthShell, TabScreen, Android TabBar
    │   ├── chat/            # ChatBubble, RichText (renders Gemini's formatting)
    │   ├── document/        # DocumentCard, DocumentOverview
    │   └── illustrations/   # HeroArt (welcome illustration)
    ├── state/               # React context providers
    │   ├── auth.tsx         #   Firebase Auth + user profile
    │   └── library.tsx      #   Documents, chats, notifications, Gemini calls
    ├── lib/firebase.ts      # App Check init + Gemini model setup (system prompt lives here)
    ├── hooks/               # useVoiceInput
    ├── constants/           # theme (colours, fonts), plan limits
    ├── types/               # Shared TypeScript types
    └── utils/               # Formatting & validation helpers
```

Imports use the `@/` alias for `src/` — e.g. `import { colors } from '@/constants/theme'`.

`android/` and `ios/` are **generated** by `npx expo prebuild` from `app.json`. They're git-ignored;
don't edit them by hand.

## Data model (Firestore)

```
users/{uid}
  name, email, plan ('free' | 'pro'), createdAt
  totalQuestions, questionsByDay { 'YYYY-MM-DD': n }

users/{uid}/documents/{docId}
  title, fileName, pages, sizeBytes
  status ('processing' | 'ready' | 'error'), error?
  summary, highlights[]                  ← written by Gemini after upload
  lastQuestion, lastAnswer, lastAt, questionCount
  folderId (null = no folder)
  source ('upload' | 'scan' | 'share')
  mode ('admin' | 'study' | 'general')    ← chosen by Gemini on upload; user can change it
  keyDates[] { label, date 'YYYY-MM-DD', kind, page? }   ← admin only
  amounts[]  { label, value, page? }                      ← admin only
  risks[]    { text, level 'high'|'medium'|'low', page? } ← admin only
  cards[]    { id, q, a, page?, box 1-5, due (ms) }       ← study, made on request

users/{uid}/documents/{docId}/messages/{messageId}
  role ('user' | 'ai'), text, createdAt

users/{uid}/folders/{folderId}
  name, createdAt

users/{uid}/notifications/{noticeId}
  title, body, docId?, read, createdAt
```

The **PDF file itself is not uploaded to Firebase.** It's copied into the app's private storage
(`Documents/pdfs/{docId}.pdf`). Storing files in Cloud Storage would require Firebase's paid Blaze plan.
Trade-off: a document's chat history syncs across devices, but the PDF must be re-uploaded on a new device.

## Main flows

**Sign-in** — `state/auth.tsx` listens to Firebase Auth. On first sign-in it creates `users/{uid}`
(always on the `free` plan). The root layout (`app/_layout.tsx`) resets navigation when you sign in or out.

**Upload** — `upload.tsx` → `library.addDoc()`:
1. checks the plan limit and the 14 MB size limit,
2. copies the PDF to device storage and creates the Firestore document (`status: 'processing'`),
3. sends the PDF to Gemini asking for JSON `{ title, pages, summary, highlights }`,
4. saves the result (`status: 'ready'`) and adds a notification.

**Ask a question** — `document/[id].tsx` → `library.send()`:
1. saves your message,
2. starts a Gemini chat whose history is *the PDF* + the last 12 messages,
3. streams the answer word by word into the UI,
4. saves the answer and updates the document + usage stats.

**Folders**: create, rename and delete folders, and move documents (long-press a card, or use the ⋮ menu
in a chat). Deleting a folder never deletes documents; they become unfiled.

**Organize with AI**: `organize.tsx` → `library.suggestOrganization(instruction?)` sends each document's
title, summary and highlights plus the existing folders to Gemini, which returns a JSON plan
`{ folders: [{ name, existingFolderId, docIds }] }`. The plan is validated (known ids only, each document once),
shown for review, and written in one batch by `library.applyOrganization()` only after the user taps **Apply**.

Gemini's style (short answer first, bullets, **bold**, page refs like `(p. 4)`) is set by the
system prompt in `src/lib/firebase.ts`, and rendered by `components/chat/RichText.tsx`.

**Modes**: the upload analysis also classifies the document and, for paperwork, extracts dates, amounts and
risky clauses in the same Gemini call. All AI JSON goes through `lib/aiJson.ts`, which drops malformed items.
- *Admin* → `components/document/AdminPanel.tsx` (calendar, reminders, "tap to explain" clauses).
- *Study* → `components/document/StudyPanel.tsx`, `app/study/[id].tsx` (Leitner boxes: due again after 1/2/4/8/16
  days, "Again" = 10 min) and `app/quiz/[id].tsx` (6 fresh questions each time, not saved).

**Share → Pagewise**: the share extension opens `pagewise://dataUrl=…`; `app/+native-intent.tsx` sends that to a
real route, and `useSharedPdf` in `app/_layout.tsx` opens `/upload` with the file (after sign-in if needed),
which starts reading at once.

**Reminders** (`lib/reminders.ts`): off until the user turns them on (document screen or Profile). Every time the
library changes, `syncReminders` reconciles local notifications whose id starts with `pw-`: 9:00 three days before
and on the day for each key date, plus one "flashcards ready" nudge. Capped at 50 (iOS allows 64).

**Widgets** (`lib/widgets.tsx`): the app writes a small JSON snapshot (`widgets/snapshot.ts`): to the App Group
`group.com.pagewise.app` on iOS, to `Documents/widget.json` on Android. Dates are stored raw so the widgets
recompute "In 3 days" themselves (iOS: timeline entries at each midnight; Android: 30-minute refresh via the
headless task registered in `index.js`).

## Native setup notes

- **iOS Simulator and Android need no Apple account.** The `ios.appleTeamId` warning during prebuild can be
  ignored for simulator builds.
- **Real iPhones / TestFlight / App Store need a paid Apple Developer account** (Sign in with Apple and App Groups
  aren't available to free teams). Then set `ios.appleTeamId` in `app.json` and enable the App Group
  `group.com.pagewise.app` for `com.pagewise.app`, `com.pagewise.app.AskPagewise` and the widget's bundle id.
- Scanning needs a real camera; in the iOS Simulator the Scan button explains this instead of opening.
- After changing `app.json` or `targets/`, run `npm run prebuild`.

## Limits & security

| Rule | Where it's enforced |
|---|---|
| A user can only access their own data | `firestore.rules` |
| A user can't change their own plan | `firestore.rules` (plan must stay the same on update) |
| Only your genuine app can call Gemini | App Check (enforced in the Firebase console) |
| Free = 10 documents, Pro = 500 | `src/constants/limits.ts` (checked in the app) |
| PDF ≤ 14 MB | `src/constants/limits.ts` (Gemini's 20 MB request limit) |

**Not built yet:** paid upgrades. A real purchase flow (RevenueCat / StoreKit / Play Billing) needs a
small server (e.g. a Cloud Function webhook) to set `plan: 'pro'`, because clients aren't allowed to.

## Platform differences

| | iOS | Android |
|---|---|---|
| Tab bar | Native system tab bar → **Liquid Glass** on iOS 26+ (`expo-router/native-tabs`) | Custom tab bar (`components/layout/TabBar.tsx`) |
| Social sign-in | Google + Apple | Google |
| App Check (release) | App Attest | Play Integrity |
