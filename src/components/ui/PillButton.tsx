import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, gradients } from '@/constants/theme';
import { SparklesIcon } from '@/components/ui/Icons';

type Props = {
  label: string;
  variant?: 'dark' | 'light';
  size?: 'lg' | 'sm';
  sparkle?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
};

export function PillButton({ label, variant = 'dark', size = 'lg', sparkle, onPress, style, loading, disabled }: Props) {
  const dark = variant === 'dark';
  const lg = size === 'lg';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        disabled && { opacity: 0.5 },
        !lg && { alignSelf: 'flex-start' },
        styles.shadow,
        dark ? styles.shadowDark : styles.shadowLight,
        { borderRadius: 999, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={dark ? gradients.dark : gradients.light}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.pill, lg ? styles.lg : styles.sm, !dark && styles.lightBorder]}
      >
        {/* top inner highlight for the glossy look */}
        {dark && <View style={styles.highlight} pointerEvents="none" />}
        {loading ? (
          <ActivityIndicator color={dark ? '#FFFFFF' : colors.ink} />
        ) : (
          <>
        {sparkle && (
          <SparklesIcon size={lg ? 18 : 15} color={dark ? '#FFFFFF' : colors.ink} strokeWidth={1.5} />
        )}
        <Text style={[lg ? styles.labelLg : styles.labelSm, { color: dark ? '#FFFFFF' : colors.ink }]}>
          {label}
        </Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    overflow: 'hidden',
    gap: 7,
  },
  lg: { height: 52, paddingHorizontal: 24 },
  sm: { height: 38, paddingHorizontal: 16, alignSelf: 'flex-start' },
  lightBorder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  highlight: {
    position: 'absolute',
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1,
  },
  labelLg: { fontFamily: fonts.semibold, fontSize: 16, letterSpacing: -0.2 },
  labelSm: { fontFamily: fonts.semibold, fontSize: 13.5, letterSpacing: -0.1 },
  shadow: { shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  shadowDark: { shadowColor: '#1D1C19', shadowOpacity: 0.28, shadowRadius: 12 },
  shadowLight: { shadowColor: '#8C866F', shadowOpacity: 0.12, shadowRadius: 14 },
});
