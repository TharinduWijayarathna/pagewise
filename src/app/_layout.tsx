import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider, useAuth } from '@/state/auth';
import { LibraryProvider, useLibrary } from '@/state/library';
import { syncReminders } from '@/lib/reminders';
import { ActionSheetHost } from '@/components/ui/ActionSheetHost';
import { syncWidgets } from '@/lib/widgets';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 400 });

function RootStack() {
  const { user, ready } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const loaded = (fontsLoaded || !!fontError) && ready;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  // When the user signs in or out, reset the stack so Back can't return to
  // Welcome/Login after login (or to app screens after logout).
  const wasSignedIn = useRef<boolean | null>(null);
  useEffect(() => {
    if (!loaded) return;
    const signedIn = !!user;
    if (wasSignedIn.current === null || wasSignedIn.current === signedIn) {
      wasSignedIn.current = signedIn;
      return;
    }
    wasSignedIn.current = signedIn;
    if (router.canDismiss()) router.dismissAll();
    router.replace(signedIn ? '/home' : '/');
  }, [user, loaded]);

  // Declared after the sign-in reset above so a pending share opens on top of Home, not under it.
  useSharedPdf(loaded && !!user);
  useNotificationTaps(loaded && !!user);
  useBackgroundSync();

  if (!loaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#EEEADF' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="document/[id]" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="upload" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="upgrade" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="folder/[id]" />
      <Stack.Screen name="folder-form" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="move" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="organize" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="viewer/[id]" />
      <Stack.Screen name="study/[id]" />
      <Stack.Screen name="quiz/[id]" />
      <Stack.Screen name="share-card/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

/** A PDF shared from another app (Share → Pagewise) opens the upload screen and starts reading. */
function useSharedPdf(ready: boolean) {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  useEffect(() => {
    if (!ready || !hasShareIntent) return; // wait for sign-in; the share is kept until then
    const files = shareIntent.files ?? [];
    const pdf = files.find((f) => f.mimeType === 'application/pdf' || /\.pdf$/i.test(f.fileName ?? ''));
    resetShareIntent();
    if (!pdf) {
      Alert.alert('Only PDFs for now', 'Pagewise can read PDF files. To add paper documents, use Scan on the upload screen.');
      return;
    }
    router.push({
      pathname: '/upload',
      params: { uri: pdf.path, name: pdf.fileName || 'Shared document.pdf', size: pdf.size ? String(pdf.size) : '' },
    });
  }, [ready, hasShareIntent, shareIntent, resetShareIntent]);
}

/** Tapping a reminder opens the document (or flashcards) it is about. */
function useNotificationTaps(ready: boolean) {
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    const id = last?.notification.request.identifier;
    const url = last?.notification.request.content.data?.url;
    if (!ready || !id || handled.current === id || typeof url !== 'string') return;
    handled.current = id;
    router.push(url as never);
  }, [ready, last]);
}

/** Keep reminders and home-screen widgets in step with the library. */
function useBackgroundSync() {
  const { docs, loading } = useLibrary();
  const { user } = useAuth();
  useEffect(() => {
    if (loading) return;
    const list = user ? docs : [];
    const t = setTimeout(() => {
      syncReminders(list).catch((e) => __DEV__ && console.warn('[Pagewise] reminders:', e?.message));
      syncWidgets(list).catch((e) => __DEV__ && console.warn('[Pagewise] widgets:', e?.message));
    }, 800); // debounce bursts of Firestore updates
    return () => clearTimeout(t);
  }, [docs, loading, user]);
}

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <KeyboardProvider>
        <AuthProvider>
          <LibraryProvider>
            <StatusBar style="dark" />
            <RootStack />
            <ActionSheetHost />
          </LibraryProvider>
        </AuthProvider>
      </KeyboardProvider>
    </ShareIntentProvider>
  );
}
