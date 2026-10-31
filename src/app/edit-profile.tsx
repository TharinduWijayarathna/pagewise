import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { MailIcon, UserIcon } from '@/components/ui/Icons';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader, goBackOr, TextField } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/state/auth';
import { colors, fonts } from '@/constants/theme';
import { isEmail } from '@/utils/validation';

export default function EditProfile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);
  const dirty = name !== user?.name || email !== user?.email;

  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const save = async () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = 'Name is too short.';
    if (!isEmail(email)) e.email = 'Enter a valid email address.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const note = await updateProfile({ name: name.trim(), email: email.trim() });
      if (note) Alert.alert('Check your inbox', note);
      router.back();
    } catch (err) {
      setSaving(false);
      Alert.alert('Couldn’t save changes', authErrorMessage(err));
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScreenHeader onBack={goBackOr('/home')} title="Edit profile" />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.avatarWrap}>
              <LinearGradient colors={['#E8F3E2', '#BFDDB4']} style={styles.avatar}>
                <Text style={styles.initials}>{initials}</Text>
              </LinearGradient>
              <Text style={styles.member}>
                Member since {new Date(user?.joined ?? Date.now()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <TextField
              label="Full name"
              icon={<UserIcon size={19} color={colors.muted} strokeWidth={1.5} />}
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
            <TextField
              label="Email"
              icon={<MailIcon size={19} color={colors.muted} strokeWidth={1.5} />}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
          </ScrollView>
          <View style={styles.actions}>
            <PillButton label="Save changes" onPress={save} loading={saving} disabled={!dirty} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 28, paddingBottom: 24 },
  avatarWrap: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.semibold, fontSize: 32, color: '#2F6B2D' },
  member: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.muted, marginTop: 12 },
  actions: { paddingHorizontal: 40, paddingBottom: 16 },
});
