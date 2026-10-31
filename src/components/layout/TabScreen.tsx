import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '@/components/ui/Background';
import { colors, fonts } from '@/constants/theme';

/** Shared layout for tab screens: eyebrow + display title, scrollable body that clears the tab bar. */
export function TabScreen({
  eyebrow,
  title,
  right,
  children,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            {right}
          </View>
          {children}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

export const tabText = StyleSheet.create({
  section: { fontFamily: fonts.medium, fontSize: 17, color: colors.muted, marginTop: 28, marginBottom: 14 },
});

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 130 },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  eyebrow: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginBottom: 2 },
  title: { fontFamily: fonts.display, fontSize: 27, color: colors.ink, letterSpacing: -0.8 },
});
