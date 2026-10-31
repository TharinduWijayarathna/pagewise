import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { gradients } from '@/constants/theme';

/** Warm cream → sage gradient with a soft glow, shared by every screen. */
export function Background({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.screen}
        locations={gradients.screenLocations}
        style={StyleSheet.absoluteFill}
      />
      {/* soft white haze through the middle */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
        locations={[0.2, 0.5, 0.85]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEEADF' },
});
