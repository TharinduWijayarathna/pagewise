import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { HeroArt } from '@/components/illustrations/HeroArt';
import { PillButton } from '@/components/ui/PillButton';
import { useAuth } from '@/state/auth';
import { colors, fonts } from '@/constants/theme';

export default function Welcome() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  // Signed-in users skip the welcome screen.
  useEffect(() => {
    if (user) router.replace('/home');
  }, [user]);
  if (user) return <Background />;

  return (
    <Background>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.art}>
          <HeroArt width={Math.min(width - 24, 420)} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Deep insights, simple{'\n'}conversations</Text>
          <Text style={styles.subtitle}>Analyze Any Document Instantly</Text>
        </View>

        <View style={styles.actions}>
          <PillButton label="Get Start" sparkle onPress={() => router.push('/auth/register')} />
          <PillButton label="Log in" variant="light" onPress={() => router.push('/auth/login')} />
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  copy: { alignItems: 'center', paddingHorizontal: 28, marginBottom: 34 },
  title: {
    fontFamily: fonts.display,
    fontSize: 31,
    lineHeight: 38,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.9,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.muted,
    marginTop: 10,
    letterSpacing: -0.1,
  },
  actions: { paddingHorizontal: 40, gap: 14, marginBottom: 18 },
});
