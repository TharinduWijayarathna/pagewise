import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/constants/theme';
import { Background } from '@/components/ui/Background';
import { ScreenHeader, AppLogo } from '@/components/ui';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScreenHeader />
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <AppLogo size={68} />
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 28, paddingBottom: 24 },
  hero: { alignItems: 'center', marginBottom: 28 },
  title: {
    fontFamily: fonts.display,
    fontSize: 27,
    color: colors.ink,
    letterSpacing: -0.8,
    marginTop: 18,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15.5,
    color: colors.muted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: { alignItems: 'center', paddingVertical: 12 },
});

export const authText = StyleSheet.create({
  footerText: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.muted },
  link: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink },
  formError: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: '#B9473A',
    textAlign: 'center',
    marginBottom: 14,
  },
});
