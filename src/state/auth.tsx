import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  AppleAuthProvider,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  verifyBeforeUpdateEmail,
  type User as FirebaseUser,
} from '@react-native-firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from '@react-native-firebase/firestore';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { auth, db, initFirebase } from '@/lib/firebase';

export type User = { uid: string; name: string; email: string; plan: 'free' | 'pro'; joined: string };

type AuthCtx = {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  /** Returns a message to show when an email change needs verification. */
  updateProfile: (patch: Partial<Pick<User, 'name' | 'email'>>) => Promise<string | void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });

/** Turn Firebase error codes into messages people can act on. Empty string = user cancelled. */
export function authErrorMessage(err: unknown) {
  const code = String((err as { code?: string | number })?.code ?? '');
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/email-already-in-use': 'An account already exists with that email. Try logging in.',
    'auth/weak-password': 'Choose a stronger password (at least 8 characters).',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'No internet connection. Check your network and try again.',
    'auth/requires-recent-login': 'For security, log out and back in, then try again.',
    'auth/account-exists-with-different-credential': 'This email is already linked to another sign-in method.',
  };
  if (map[code]) return map[code];
  if (/cancel/i.test(code) || code === 'ERR_REQUEST_CANCELED') return '';
  return (err as Error)?.message || 'Something went wrong. Please try again.';
}

/** Create the Firestore profile the first time someone signs in. */
async function ensureProfile(u: FirebaseUser, name?: string) {
  const ref = doc(db(), 'users', u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: name || u.displayName || u.email?.split('@')[0] || 'Reader',
      email: u.email ?? '',
      plan: 'free',
      createdAt: serverTimestamp(),
      totalQuestions: 0,
      questionsByDay: {},
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Omit<User, 'uid'> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initFirebase().catch(() => {});
    return onAuthStateChanged(auth(), (u) => {
      setFbUser(u);
      // Repair accounts whose profile was never created (e.g. sign-up interrupted mid-way).
      if (u) ensureProfile(u).catch((err) => __DEV__ && console.warn('[Pagewise] ensureProfile failed:', err?.message));
      if (!u) {
        setProfile(null);
        setReady(true);
      }
    });
  }, []);

  // Live profile (name / plan) from Firestore.
  useEffect(() => {
    if (!fbUser) return;
    const fallback = () =>
      setProfile({
        name: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Reader',
        email: fbUser.email ?? '',
        plan: 'free',
        joined: new Date(fbUser.metadata.creationTime ?? Date.now()).toISOString(),
      });
    return onSnapshot(
      doc(db(), 'users', fbUser.uid),
      (snap) => {
        const d = snap?.data();
        if (!d) return fallback();
        const joined = d.createdAt?.toDate?.() ?? new Date(fbUser.metadata.creationTime ?? Date.now());
        setProfile({
          name: d.name ?? fbUser.displayName ?? 'Reader',
          email: fbUser.email ?? d.email ?? '',
          plan: d.plan === 'pro' ? 'pro' : 'free',
          joined: new Date(joined).toISOString(),
        });
      },
      fallback,
    );
  }, [fbUser]);

  const user = useMemo<User | null>(
    () => (fbUser && profile ? { uid: fbUser.uid, ...profile } : null),
    [fbUser, profile],
  );

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      // When signed in, also wait for the profile so screens never see a half-loaded user.
      ready: ready || !!user,

      async signIn(email, password) {
        await signInWithEmailAndPassword(auth(), email, password);
      },

      async signUp(name, email, password) {
        const cred = await createUserWithEmailAndPassword(auth(), email, password);
        await fbUpdateProfile(cred.user, { displayName: name });
        await ensureProfile(cred.user, name);
      },

      async signInWithProvider(provider) {
        if (provider === 'google') {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          const res = await GoogleSignin.signIn();
          if (!isSuccessResponse(res)) return; // user cancelled
          const idToken = res.data.idToken;
          if (!idToken) throw new Error('Google sign-in did not return an ID token. Check the web client ID.');
          const cred = await signInWithCredential(auth(), GoogleAuthProvider.credential(idToken));
          await ensureProfile(cred.user);
          return;
        }

        if (Platform.OS !== 'ios') throw new Error('Sign in with Apple is only available on iPhone.');
        const rawNonce = Crypto.randomUUID();
        const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
        const apple = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });
        if (!apple.identityToken) throw new Error('Apple sign-in failed. Please try again.');
        const cred = await signInWithCredential(auth(), AppleAuthProvider.credential(apple.identityToken, rawNonce));
        // Apple only shares the name on the very first sign-in.
        const fullName = [apple.fullName?.givenName, apple.fullName?.familyName].filter(Boolean).join(' ');
        if (fullName && !cred.user.displayName) await fbUpdateProfile(cred.user, { displayName: fullName });
        await ensureProfile(cred.user, fullName || undefined);
      },

      async requestPasswordReset(email) {
        try {
          await sendPasswordResetEmail(auth(), email);
        } catch (err) {
          // Don't reveal whether an account exists for this email.
          if ((err as { code?: string })?.code !== 'auth/user-not-found') throw err;
        }
      },

      async updateProfile(patch) {
        const u = auth().currentUser;
        if (!u) return;
        if (patch.name && patch.name !== u.displayName) {
          await fbUpdateProfile(u, { displayName: patch.name });
          await updateDoc(doc(db(), 'users', u.uid), { name: patch.name });
        }
        if (patch.email && patch.email !== u.email) {
          await verifyBeforeUpdateEmail(u, patch.email);
          return `We sent a link to ${patch.email}. Your email changes once you confirm it.`;
        }
      },

      async signOut() {
        await GoogleSignin.signOut().catch(() => {});
        await fbSignOut(auth());
      },
    }),
    [user, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
