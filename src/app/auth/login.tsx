import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { router } from 'expo-router';
import { AuthShell, authText } from '@/components/layout/AuthShell';
import { LockIcon, MailIcon } from '@/components/ui/Icons';
import { PillButton } from '@/components/ui/PillButton';
import { Divider, SocialButton, TextField } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/state/auth';
import { colors, fonts } from '@/constants/theme';
import { isEmail } from '@/utils/validation';

export default function Login() {
  const { signIn, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState<'email' | 'google' | 'apple' | null>(null);
  const pwRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    const e: typeof errors = {};
    if (!isEmail(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Enter your password.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading('email');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setErrors({ form: authErrorMessage(err) });
      setLoading(null);
    }
  };

  const social = async (p: 'google' | 'apple') => {
    setErrors({});
    setLoading(p);
    try {
      await signInWithProvider(p);
    } catch (err) {
      const msg = authErrorMessage(err);
      if (msg) setErrors({ form: msg });
    } finally {
      setLoading(null);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep chatting with your documents"
      footer={
        <Text style={authText.footerText}>
          Don’t have an account?{' '}
          <Text style={authText.link} onPress={() => router.replace('/auth/register')}>
            Sign up
          </Text>
        </Text>
      }
    >
      {!!errors.form && <Text style={authText.formError}>{errors.form}</Text>}

      <TextField
        label="Email"
        icon={<MailIcon size={19} color={colors.muted} strokeWidth={1.5} />}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
        }}
        onSubmitEditing={() => pwRef.current?.focus()}
        error={errors.email}
      />
      <TextField
        ref={pwRef}
        label="Password"
        icon={<LockIcon size={19} color={colors.muted} strokeWidth={1.5} />}
        placeholder="Your password"
        secure
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
        }}
        onSubmitEditing={submit}
        error={errors.password}
      />

      <Pressable onPress={() => router.push('/auth/forgot-password')} style={styles.forgot} hitSlop={8}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      <PillButton label="Log in" onPress={submit} loading={loading === 'email'} />

      <Divider label="or continue with" />
      <View style={styles.socialRow}>
        <SocialButton provider="google" onPress={() => social('google')} loading={loading === 'google'} />
        {Platform.OS === 'ios' && (
          <SocialButton provider="apple" onPress={() => social('apple')} loading={loading === 'apple'} />
        )}
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 24, marginRight: 4 },
  forgotText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  socialRow: { flexDirection: 'row', gap: 12 },
});
