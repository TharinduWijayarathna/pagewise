import { forwardRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '@/constants/theme';
import { AppleIcon, ArrowLeftIcon, EyeIcon, EyeOffIcon, GoogleIcon } from '@/components/ui/Icons';
import { GlossyIcon, type GlossyTone } from '@/components/ui/GlossyIcon';

/* ---------- glass surfaces ---------- */

export function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[ui.card, style]}>{children}</View>;
}

export function CircleButton({
  children,
  onPress,
  badge,
  tone = 'pearl',
}: {
  children: React.ReactNode;
  onPress?: () => void;
  badge?: boolean;
  tone?: GlossyTone;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] }]}>
      <GlossyIcon tone={tone} size={46} shape="circle">
        {() => children}
      </GlossyIcon>
      {badge && <View style={ui.badge} />}
    </Pressable>
  );
}

/* ---------- header with back button ---------- */

/**
 * Go back if there is a previous screen; otherwise go to `fallback`
 * (avoids the "GO_BACK was not handled" dead-end when a screen is opened first).
 */
export const goBackOr = (fallback: '/' | '/home') => () => {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
};

export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack = goBackOr('/'),
}: {
  title?: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={ui.header}>
      <CircleButton onPress={onBack}>
        <ArrowLeftIcon size={20} color={colors.text} strokeWidth={1.6} />
      </CircleButton>
      <View style={{ flex: 1, marginLeft: 16 }}>
        {!!title && (
          <Text style={ui.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle}
      </View>
      {right ?? <View style={{ width: 46 }} />}
    </View>
  );
}

/* ---------- text fields ---------- */

type FieldProps = TextInputProps & {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  secure?: boolean;
};

export const TextField = forwardRef<TextInputInstance, FieldProps>(function TextField(
  { label, icon, error, secure, style, ...rest },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={ui.label}>{label}</Text>
      <View style={[ui.field, focused && ui.fieldFocused, !!error && ui.fieldError]}>
        {icon}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.faint}
          secureTextEntry={secure && hidden}
          autoCapitalize="none"
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[ui.input, style]}
          {...rest}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            {hidden ? (
              <EyeOffIcon size={19} color={colors.muted} strokeWidth={1.5} />
            ) : (
              <EyeIcon size={19} color={colors.muted} strokeWidth={1.5} />
            )}
          </Pressable>
        )}
      </View>
      {!!error && <Text style={ui.error}>{error}</Text>}
    </View>
  );
});

/* ---------- social sign-in ---------- */

export function SocialButton({
  provider,
  onPress,
  loading,
}: {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [ui.social, pressed && { opacity: 0.75 }]}>
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <>
          {provider === 'google' ? <GoogleIcon size={19} /> : <AppleIcon size={19} />}
          <Text style={ui.socialText}>{provider === 'google' ? 'Google' : 'Apple'}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <View style={ui.dividerRow}>
      <View style={ui.dividerLine} />
      <Text style={ui.dividerText}>{label}</Text>
      <View style={ui.dividerLine} />
    </View>
  );
}

/* ---------- app logo (auth + upgrade screens) ---------- */

export function AppLogo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="logoBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5A5751" />
          <Stop offset="1" stopColor="#1A1916" />
        </LinearGradient>
        <LinearGradient id="logoGreen" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8BD886" />
          <Stop offset="1" stopColor="#4DAA4A" />
        </LinearGradient>
      </Defs>
      <Rect x="4" y="4" width="92" height="92" rx="28" fill="url(#logoBg)" />
      <Rect x="4.5" y="4.5" width="91" height="91" rx="27.5" fill="none" stroke="#FFFFFF" strokeOpacity={0.12} />
      {/* document */}
      <Path d="M33 24h22l13 13v33a6 6 0 0 1-6 6H33a6 6 0 0 1-6-6V30a6 6 0 0 1 6-6z" fill="#FFFFFF" />
      <Path d="M55 24v8a5 5 0 0 0 5 5h8z" fill="#D9D6CE" />
      <Rect x="35" y="46" width="22" height="4.5" rx="2.25" fill="#C9C5BB" />
      <Rect x="35" y="56" width="16" height="4.5" rx="2.25" fill="#C9C5BB" />
      {/* sparkle badge */}
      <Circle cx="68" cy="68" r="15" fill="url(#logoGreen)" stroke="#1F1E1B" strokeWidth={3} />
      <Path d="M68 59.5Q68 68 76.5 68Q68 68 68 76.5Q68 68 59.5 68Q68 68 68 59.5Z" fill="#FFFFFF" />
    </Svg>
  );
}

/* ---------- settings-style row ---------- */

export function Row({
  icon,
  tone = 'green',
  label,
  value,
  onPress,
  right,
  danger,
  last,
}: {
  /** Render prop receiving the glyph colour for the glossy tile. */
  icon: (color: string) => React.ReactNode;
  tone?: GlossyTone;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [ui.row, !last && ui.rowBorder, pressed && { opacity: 0.6 }]}
    >
      <GlossyIcon tone={danger ? 'rose' : tone} size={38} flat>
        {icon}
      </GlossyIcon>
      <Text style={[ui.rowLabel, danger && { color: '#B9473A' }]}>{label}</Text>
      {!!value && <Text style={ui.rowValue}>{value}</Text>}
      {right}
    </Pressable>
  );
}

export const ui = StyleSheet.create({
  card: {
    borderRadius: 26,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
  },
  badge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0674F',
    borderWidth: 1.5,
    borderColor: '#F6EEE3',
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  headerTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink, letterSpacing: -0.3 },
  label: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.muted, marginBottom: 8, marginLeft: 4 },
  field: {
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  fieldFocused: { borderColor: 'rgba(38,37,31,0.35)', backgroundColor: 'rgba(255,255,255,0.7)' },
  fieldError: { borderColor: 'rgba(190,80,64,0.55)' },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15.5, color: colors.text, paddingVertical: 0 },
  error: { fontFamily: fonts.regular, fontSize: 12.5, color: '#B9473A', marginTop: 6, marginLeft: 6 },
  social: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  socialText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(38,37,31,0.2)' },
  dividerText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(38,37,31,0.12)' },
  rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  rowValue: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
});
