import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { CheckIcon, CrownIcon } from '@/components/ui/Icons';
import { GlossyIcon } from '@/components/ui/GlossyIcon';
import { PillButton } from '@/components/ui/PillButton';
import { GlassCard, ScreenHeader, goBackOr, AppLogo } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { colors, fonts } from '@/constants/theme';

const FEATURES = [
  'Unlimited documents & conversations',
  'Files up to 500 pages / 200 MB',
  'Deep analysis across multiple documents',
  'Export summaries to PDF & Notion',
  'Priority processing',
];

const PLANS = [
  { id: 'yearly', label: 'Yearly', price: '$79.99', per: '/ year', note: 'Save 33%' },
  { id: 'monthly', label: 'Monthly', price: '$9.99', per: '/ month' },
] as const;

export default function Upgrade() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<(typeof PLANS)[number]['id']>('yearly');
  const [loading, setLoading] = useState(false);
  const pro = user?.plan === 'pro';

  // In-app purchases aren't connected yet. When they are (RevenueCat / StoreKit /
  // Play Billing), a server-side webhook should set users/{uid}.plan = 'pro' —
  // Firestore rules block clients from changing their own plan.
  const buy = () => {
    setLoading(false);
    Alert.alert('Coming soon', 'Pagewise Pro subscriptions will be available in a future update.');
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader onBack={goBackOr('/home')} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <AppLogo size={78} />
            <Text style={styles.title}>Pagewise Pro</Text>
            <Text style={styles.subtitle}>Deeper insights for every document you own</Text>
          </View>

          <GlassCard>
            {FEATURES.map((f) => (
              <View key={f} style={styles.feature}>
                <GlossyIcon tone="green" size={24} shape="circle" flat>
                  {(c) => <CheckIcon size={13} color={c} strokeWidth={2.6} />}
                </GlossyIcon>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </GlassCard>

          {!pro && (
            <View style={{ gap: 12, marginTop: 18 }}>
              {PLANS.map((p) => {
                const on = plan === p.id;
                return (
                  <Pressable key={p.id} onPress={() => setPlan(p.id)} style={[styles.plan, on && styles.planOn]}>
                    <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planLabel}>{p.label}</Text>
                      {'note' in p && <Text style={styles.planNote}>{p.note}</Text>}
                    </View>
                    <Text style={styles.price}>
                      {p.price}
                      <Text style={styles.per}> {p.per}</Text>
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.actions}>
          {pro ? (
            <View style={styles.proBox}>
              <GlossyIcon tone="green" size={34}>
                {(c) => <CrownIcon size={17} color={c} strokeWidth={1.8} />}
              </GlossyIcon>
              <Text style={styles.proText}>You’re on Pagewise Pro. Thank you!</Text>
            </View>
          ) : (
            <>
              <PillButton label="Start 7-day free trial" sparkle onPress={buy} loading={loading} />
              <Text style={styles.fine}>Cancel anytime. Billed after the trial ends.</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  hero: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.8, color: colors.ink, marginTop: 10 },
  subtitle: { fontFamily: fonts.regular, fontSize: 15.5, color: colors.muted, textAlign: 'center', marginTop: 4 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  featureText: { flex: 1, fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  planOn: { borderColor: colors.ink, backgroundColor: 'rgba(255,255,255,0.6)' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(38,37,31,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.ink },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.ink },
  planLabel: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  planNote: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.greenDark, marginTop: 2 },
  price: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  per: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  actions: { paddingHorizontal: 40, paddingBottom: 12, paddingTop: 8 },
  fine: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.faint, textAlign: 'center', marginTop: 10 },
  proBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  proText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
});
