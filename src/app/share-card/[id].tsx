import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Background } from '@/components/ui/Background';
import { PillButton } from '@/components/ui/PillButton';
import { AppLogo, ScreenHeader, goBackOr } from '@/components/ui';
import { useLibrary } from '@/state/library';
import { dueLabel, upcomingDates } from '@/utils/dates';
import { colors, fonts, gradients } from '@/constants/theme';

/**
 * A summary card people can post or send: title, summary, key points (and the
 * next deadline for paperwork), signed "Made with Pagewise". No document text
 * beyond what's shown on the card leaves the phone.
 */
export default function ShareCard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDoc } = useLibrary();
  const doc = getDoc(id);
  const card = useRef<ViewInstance>(null);
  const [busy, setBusy] = useState(false);

  if (!doc) return <Background />;
  const next = upcomingDates([doc])[0];

  const share = async () => {
    setBusy(true);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: doc.title, UTI: 'public.png' });
    } catch (err) {
      Alert.alert('Couldn’t share the card', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader onBack={goBackOr('/home')} title="Share as image" />
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Everything inside this view becomes the image. */}
          <View ref={card} collapsable={false} style={styles.capture}>
            <LinearGradient colors={['#F8EADB', '#E6EAD8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              <Text style={styles.kicker}>{doc.mode === 'admin' ? 'PAPERWORK, DECODED' : doc.mode === 'study' ? 'STUDY NOTES' : 'IN SHORT'}</Text>
              <Text style={styles.title}>{doc.title}</Text>
              {!!doc.summary && <Text style={styles.summary}>{doc.summary}</Text>}

              {!!doc.highlights?.length && (
                <View style={styles.points}>
                  {doc.highlights.slice(0, 4).map((h) => (
                    <View key={h} style={styles.point}>
                      <View style={styles.dot} />
                      <Text style={styles.pointText}>{h}</Text>
                    </View>
                  ))}
                </View>
              )}

              {next && (
                <View style={styles.next}>
                  <Text style={styles.nextLabel}>Next date</Text>
                  <Text style={styles.nextValue}>
                    {next.label} · {dueLabel(next.date)}
                  </Text>
                </View>
              )}

              <LinearGradient colors={gradients.dark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.footer}>
                <AppLogo size={30} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.brand}>Made with Pagewise</Text>
                  <Text style={styles.brandSub}>Chat with any PDF, right on your phone</Text>
                </View>
              </LinearGradient>
            </LinearGradient>
          </View>
        </ScrollView>
        <View style={styles.actions}>
          <PillButton label="Share image" sparkle loading={busy} onPress={share} />
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  capture: { borderRadius: 30, overflow: 'hidden' },
  card: { padding: 24, gap: 12 },
  kicker: { fontFamily: fonts.semibold, fontSize: 11.5, letterSpacing: 1, color: colors.greenDark },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.8, color: colors.ink },
  summary: { fontFamily: fonts.regular, fontSize: 15.5, lineHeight: 22, color: colors.text },
  points: { gap: 8, marginTop: 4 },
  point: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green, marginTop: 8 },
  pointText: { flex: 1, fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 21, color: colors.text },
  next: { padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.65)', marginTop: 4 },
  nextLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  nextValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, marginTop: 8 },
  brand: { fontFamily: fonts.semibold, fontSize: 14, color: '#FFFFFF' },
  brandSub: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  actions: { paddingHorizontal: 40, paddingBottom: 12, paddingTop: 8 },
});
