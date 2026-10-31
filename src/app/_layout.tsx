import { useEffect, useRef } from 'react';
import { router, Stack } from 'expo-router';
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
import { LibraryProvider } from '@/state/library';

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
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <AuthProvider>
        <LibraryProvider>
          <StatusBar style="dark" />
          <RootStack />
        </LibraryProvider>
      </AuthProvider>
    </KeyboardProvider>
  );
}
