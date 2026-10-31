import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { router } from 'expo-router';
import { AuthShell, authText } from '@/components/layout/AuthShell';
import { CheckIcon, LockIcon, MailIcon, UserIcon } from '@/components/ui/Icons';
import { PillButton } from '@/components/ui/PillButton';
import { Divider, SocialButton, TextField } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/state/auth';
import { colors, fonts } from '@/constants/theme';
import { isEmail, passwordStrength } from '@/utils/validation';

type Errors = { name?: string; email?: string; password?: string; confirm?: string; terms?: string; form?: string };
const METER = ['#D9826F', '#D9A66F', '#C9C26A', '#7DB86F'];

export default function Register() {
  const { signUp, signInWithProvider } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState<'email' | 'google' | 'apple' | null>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const pwRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const strength = passwordStrength(password);

  const submit = async () => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Tell us your name.';
    if (!isEmail(email)) e.email = 'Enter a valid email address.';
    if (password.length < 8) e.password = 'Use at least 8 characters.';
    if (confirm !== password) e.confirm = 'Passwords don’t match.';
    if (!agree) e.terms = 'Please accept the terms to continue.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading('email');
    try {
      await signUp(name.trim(), email.trim(), password);
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
      title="Create your account"
      subtitle="Turn any PDF into a conversation in seconds"
      footer={
        <Text style={authText.footerText}>
          Already have an account?{' '}
          <Text style={authText.link} onPress={() => router.replace('/auth/login')}>
            Log in
          </Text>
        </Text>
      }
    >
      {!!errors.form && <Text style={authText.formError}>{errors.form}</Text>}
      <TextField
        label="Full name"
        icon={<UserIcon size={19} color={colors.muted} strokeWidth={1.5} />}
        placeholder="Jane Doe"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
        }}
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.name}
      />
      <TextField
        ref={emailRef}
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
        placeholder="At least 8 characters"
        secure
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
        }}
        onSubmitEditing={() => confirmRef.current?.focus()}
        error={errors.password}
      />
      {!!password && (
        <View style={styles.meterRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.meterBar, i < strength.score && { backgroundColor: METER[strength.score - 1] }]}
            />
          ))}
          <Text style={styles.meterLabel}>{strength.label}</Text>
        </View>
      )}
      <TextField
        ref={confirmRef}
        label="Confirm password"
        icon={<LockIcon size={19} color={colors.muted} strokeWidth={1.5} />}
        placeholder="Repeat your password"
        secure
        textContentType="newPassword"
        returnKeyType="done"
        value={confirm}
        onChangeText={(v) => {
          setConfirm(v);
          if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
        }}
        onSubmitEditing={submit}
        error={errors.confirm}
      />

      <Pressable style={styles.terms} onPress={() => setAgree((a) => !a)} hitSlop={6}>
        <View style={[styles.box, agree && styles.boxOn]}>
          {agree && <CheckIcon size={14} color="#FFFFFF" strokeWidth={2.4} />}
        </View>
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Pressable>
      {!!errors.terms && <Text style={[authText.formError, { textAlign: 'left', marginLeft: 6 }]}>{errors.terms}</Text>}

      <PillButton label="Create account" sparkle onPress={submit} loading={loading === 'email'} style={{ marginTop: 8 }} />

      <Divider label="or sign up with" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <SocialButton provider="google" onPress={() => social('google')} loading={loading === 'google'} />
        {Platform.OS === 'ios' && (
          <SocialButton provider="apple" onPress={() => social('apple')} loading={loading === 'apple'} />
        )}
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 16, marginHorizontal: 6 },
  meterBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(38,37,31,0.1)' },
  meterLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, width: 62, textAlign: 'right' },
  terms: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 14, paddingHorizontal: 4 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(38,37,31,0.35)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  termsText: { flex: 1, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: colors.muted },
  termsLink: { fontFamily: fonts.semibold, color: colors.text },
});
