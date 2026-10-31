import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { AuthShell, authText } from '@/components/layout/AuthShell';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { MailIcon } from '@/components/ui/Icons';
import { PillButton } from '@/components/ui/PillButton';
import { GlassCard, TextField } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/state/auth';
import { colors, fonts } from '@/constants/theme';
import { isEmail } from '@/utils/validation';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!isEmail(email)) return setError('Enter a valid email address.');
    setError(undefined);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle="We’ve sent a password reset link">
        <GlassCard style={styles.card}>
          <GlossyIcon tone="green" size={62} style={{ marginBottom: 16 }}>
            {(c) => <MailIcon size={27} color={c} strokeWidth={1.8} />}
          </GlossyIcon>
          <Text style={styles.cardText}>
            If an account exists for <Text style={styles.email}>{email.trim()}</Text>, you’ll get an email with
            instructions to reset your password in the next few minutes.
          </Text>
        </GlassCard>
        <PillButton label="Back to log in" onPress={() => router.replace('/auth/login')} />
        <Text style={[authText.footerText, styles.resend]}>
          Didn’t get it?{' '}
          <Text style={authText.link} onPress={() => setSent(false)}>
            Try again
          </Text>
        </Text>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email and we’ll send you a reset link">
      <TextField
        label="Email"
        icon={<MailIcon size={19} color={colors.muted} strokeWidth={1.5} />}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={submit}
        error={error}
        autoFocus
      />
      <PillButton label="Send reset link" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', marginBottom: 24, paddingVertical: 26 },
  cardText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' },
  email: { fontFamily: fonts.semibold, color: colors.text },
  resend: { textAlign: 'center', marginTop: 18 },
});
