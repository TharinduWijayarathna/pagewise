import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  BellIcon,
  ChevronRightIcon,
  CrownIcon,
  DatabaseIcon,
  HelpIcon,
  LogoutIcon,
  ShieldIcon,
  UserIcon,
} from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { TabScreen, tabText } from '@/components/layout/TabScreen';
import { GlassCard, Row } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { useLibrary } from '@/state/library';
import { colors, fonts, gradients } from '@/constants/theme';

const chevron = <ChevronRightIcon size={18} color={colors.faint} strokeWidth={1.6} />;
const ic = (I: typeof UserIcon) => (color: string) => <I size={18} color={color} strokeWidth={1.7} />;

export default function Profile() {
  const { user, signOut } = useAuth();
  const { docs } = useLibrary();
  const [push, setPush] = useState(true);
  const [digest, setDigest] = useState(false);
  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const pro = user.plan === 'pro';
  const limit = pro ? 500 : 10;
  const used = docs.length;

  const confirmSignOut = () =>
    Alert.alert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);

  const switchProps = {
    trackColor: { false: 'rgba(38,37,31,0.15)', true: colors.ink },
    thumbColor: '#FFFFFF',
    ios_backgroundColor: 'rgba(38,37,31,0.15)',
  };

  return (
    <TabScreen eyebrow="Account" title="Profile">
      {/* identity */}
      <Pressable onPress={() => router.push('/edit-profile')}>
        <GlassCard style={styles.identity}>
          <LinearGradient colors={['#E8F3E2', '#BFDDB4']} style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email} numberOfLines={1} ellipsizeMode="middle">
              {user.email}
            </Text>
            <View style={[styles.planPill, pro && styles.planPillPro]}>
              {pro && <CrownIcon size={12} color="#FFFFFF" strokeWidth={1.8} />}
              <Text style={[styles.planText, pro && { color: '#FFFFFF' }]}>{pro ? 'Pagewise Pro' : 'Free plan'}</Text>
            </View>
          </View>
          {chevron}
        </GlassCard>
      </Pressable>

      {/* upgrade */}
      {!pro && (
        <Pressable onPress={() => router.push('/upgrade')} style={({ pressed }) => pressed && { opacity: 0.9 }}>
          <LinearGradient colors={gradients.dark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.upgrade}>
            <GlossyIcon tone="green" size={42}>
              {(c) => <CrownIcon size={20} color={c} strokeWidth={1.7} />}
            </GlossyIcon>
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>Upgrade to Pagewise Pro</Text>
              <Text style={styles.upgradeSub}>Unlimited docs, longer files, deeper analysis</Text>
            </View>
            <ChevronRightIcon size={18} color="#FFFFFF" strokeWidth={1.8} />
          </LinearGradient>
        </Pressable>
      )}

      {/* storage */}
      <GlassCard style={{ marginTop: 12 }}>
        <View style={styles.storageRow}>
          <Text style={styles.storageLabel}>Documents</Text>
          <Text style={styles.storageValue}>
            {used} / {limit}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(1, used / limit) * 100}%` }]} />
        </View>
      </GlassCard>

      <Text style={tabText.section}>Preferences</Text>
      <GlassCard style={styles.group}>
        <Row icon={ic(BellIcon)} label="Push notifications" right={<Switch value={push} onValueChange={setPush} {...switchProps} />} />
        <Row icon={ic(DatabaseIcon)} tone="ink" label="Weekly email digest" right={<Switch value={digest} onValueChange={setDigest} {...switchProps} />} last />
      </GlassCard>

      <Text style={tabText.section}>Account</Text>
      <GlassCard style={styles.group}>
        <Row icon={ic(UserIcon)} label="Edit profile" right={chevron} onPress={() => router.push('/edit-profile')} />
        <Row icon={ic(CrownIcon)} tone="ink" label="Subscription" value={pro ? 'Pro' : 'Free'} right={chevron} onPress={() => router.push('/upgrade')} />
        <Row icon={ic(ShieldIcon)} label="Privacy & security" right={chevron} onPress={() => Alert.alert('Privacy & security', 'Your PDFs are stored only on this device. To answer questions, the document and your question are sent to Google Gemini through Firebase. Your account data is stored securely in Firebase.')} />
        <Row icon={ic(HelpIcon)} tone="ink" label="Help & support" right={chevron} onPress={() => Alert.alert('Help & support', 'Email us at support@pagewise.app')} last />
      </GlassCard>

      <GlassCard style={[styles.group, { marginTop: 14 }]}>
        <Row icon={ic(LogoutIcon)} label="Log out" danger onPress={confirmSignOut} last />
      </GlassCard>

      <Text style={styles.version}>Pagewise v1.0.0</Text>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 26 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.semibold, fontSize: 22, color: '#2F6B2D' },
  name: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink, letterSpacing: -0.3 },
  email: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.muted, marginTop: 2 },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  planPillPro: { backgroundColor: colors.ink },
  planText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.text },
  upgrade: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 26, marginTop: 12 },
  upgradeTitle: { fontFamily: fonts.semibold, fontSize: 15.5, color: '#FFFFFF' },
  upgradeSub: { fontFamily: fonts.regular, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  storageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  storageLabel: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  storageValue: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.muted },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(38,37,31,0.08)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.green },
  group: { paddingVertical: 4 },
  version: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.faint, textAlign: 'center', marginTop: 24 },
});
