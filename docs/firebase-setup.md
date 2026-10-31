# Firebase setup

Pagewise uses **Firebase** for accounts, the database, and **Gemini** (Google's AI) to read PDFs.
Everything below works on the free **Spark** plan. You'll need a Google account.

At the end you'll have three files in the project root: `google-services.json`,
`GoogleService-Info.plist` and `.env`.

---

## 1. Create a project
1. Go to <https://console.firebase.google.com> → **Create a project**.
2. Name it (e.g. `Pagewise`). Google Analytics is optional.

## 2. Add the Android app
1. On the project overview page click the **Android** icon (*Add app*).
2. **Android package name:** `com.pagewise.app`
3. **Debug signing certificate SHA-1:** paste the SHA-1 from the box below.
4. Click **Register app**, download **`google-services.json`**, and put it in the project root (next to `app.json`).
5. Then add the **SHA-256** too: ⚙️ **Project settings → General → Your apps → Android app → Add fingerprint**.

> **Your debug fingerprints.** Expo's Android debug key is the same for every project, so these
> usually work as-is:
> ```
> SHA-1:   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
> SHA-256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
> ```
> To read them yourself after the first Android build:
> ```bash
> keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
> ```
> When you publish to Google Play, also add the **Play App Signing** fingerprints
> (Play Console → *Test and release → App integrity*).

## 3. Add the iOS app
1. **Add app → iOS**. **Bundle ID:** `com.pagewise.app`
2. Download **`GoogleService-Info.plist`** into the project root.

## 4. Authentication (sign-in)
**Build → Authentication → Get started → Sign-in method**, enable:

| Provider | Notes |
|---|---|
| **Email/Password** | Turn on the first toggle. |
| **Google** | Pick a support email and save. |
| **Apple** | iPhone only. Needs a paid Apple Developer account. |

⚠️ After enabling Google, **download both config files again** (step 2 & 3 pages, or ⚙️ Project settings → Your apps)
and replace the old ones — they now contain the Google sign-in IDs.

## 5. Firestore (database)
1. **Build → Firestore Database → Create database** → **Start in production mode** → choose a region near you.
2. Open the **Rules** tab, delete everything, paste the contents of [`firestore.rules`](../firestore.rules) and click **Publish**.

These rules let each person read/write only their own data and stop anyone from upgrading
themselves to Pro.

> **Updating the app?** When `firestore.rules` changes (for example when folders were added), paste and **Publish** it again.
> Otherwise you'll see `firestore/permission-denied` for the new feature.

## 6. AI Logic (Gemini)
1. **Build → AI Logic → Get started**.
2. Choose **Gemini Developer API** (works on the free plan). Firebase keeps the API key on Google's side —
   there's nothing to copy into the app.
3. *(Recommended)* AI Logic → **Settings** → set a per-user rate limit, e.g. 20 requests/minute.

> If you just enabled it and the app says *"Gemini isn't enabled"*, wait 2–5 minutes and try again.

## 7. App Check (required)
App Check proves requests come from **your** app, so nobody can use your Gemini quota.
Firebase AI Logic **requires** it.

**Build → App Check → Apps:**
- **Android** → register with **Play Integrity** (uses the SHA-256 from step 2).
- **iOS** → register with **App Attest** (needs your Apple Team ID from developer.apple.com → Membership).

**Development builds (emulator/simulator) use a debug token instead:**
1. Make up a token — any UUID works, e.g. generate one at <https://www.uuidgenerator.net>.
2. App Check → Apps → **Android app → ⋮ → Manage debug tokens → Add debug token** → paste it → Save.
3. Do the **same for the iOS app** (same token is fine).
4. Put the token in `.env` (next step).

Finally, App Check → **APIs** → **Firebase AI Logic → Enforce**.

## 8. Create `.env`
Copy the example file:

```bash
cp .env.example .env
```

Open `.env` and fill in:

```bash
# Firebase → Authentication → Sign-in method → Google → "Web SDK configuration" → Web client ID
# (also in google-services.json: the oauth_client entry with "client_type": 3)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com

# The App Check debug token from step 7 (only used by development builds)
EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN=00000000-0000-4000-8000-000000000000
```

> The **Web client ID** ends with `.apps.googleusercontent.com`. It is *not* the project number (`project-1234…`).

## 9. Build the app
Back to **[getting-started.md → Run the app](./getting-started.md#4-run-the-app)**.

---

### ✅ Checklist
- [ ] `google-services.json` in project root (downloaded **after** enabling Google sign-in)
- [ ] `GoogleService-Info.plist` in project root
- [ ] SHA-1 **and** SHA-256 added to the Android app
- [ ] Email/Password + Google sign-in enabled
- [ ] Firestore created, rules published
- [ ] AI Logic enabled (Gemini Developer API)
- [ ] App Check: debug token added for **both** apps, AI Logic enforced
- [ ] `.env` filled in
