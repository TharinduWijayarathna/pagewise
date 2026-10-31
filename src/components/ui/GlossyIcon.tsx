import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type GlossyTone = 'green' | 'ink' | 'pearl' | 'rose';

const TONES: Record<
  GlossyTone,
  { fill: readonly [string, string, ...string[]]; glyph: string; rim: string; shadow: string; shine: number }
> = {
  green: { fill: ['#93DC8D', '#5DB458', '#3F9A3D'], glyph: '#FFFFFF', rim: 'rgba(255,255,255,0.45)', shadow: '#3F9A3D', shine: 0.55 },
  ink: { fill: ['#6A665F', '#2E2C28', '#1A1916'], glyph: '#FFFFFF', rim: 'rgba(255,255,255,0.18)', shadow: '#1A1916', shine: 0.32 },
  pearl: { fill: ['#FFFFFF', '#F6F3EC', '#E8E3D8'], glyph: '#26251F', rim: 'rgba(255,255,255,0.95)', shadow: '#8C866F', shine: 0.9 },
  rose: { fill: ['#F4A99D', '#E0705F', '#C65445'], glyph: '#FFFFFF', rim: 'rgba(255,255,255,0.45)', shadow: '#C65445', shine: 0.5 },
};

/** Glyph colour that reads well on a given tone. */
export const glyphColor = (tone: GlossyTone) => TONES[tone].glyph;

type Props = {
  /** Render prop receiving the glyph colour, e.g. `(c) => <BellIcon color={c} />`. */
  children: (color: string) => React.ReactNode;
  tone?: GlossyTone;
  size?: number;
  /** 'circle' for buttons, 'squircle' for tiles. */
  shape?: 'circle' | 'squircle';
  style?: ViewStyle;
  /** Drop the coloured shadow (e.g. inside dense lists). */
  flat?: boolean;
};

/**
 * Glossy, gradient-filled icon tile — the same look as the green document icon:
 * a vertical gradient, a soft white shine across the top, a light rim and a tinted shadow.
 */
export function GlossyIcon({ children, tone = 'green', size = 40, shape = 'squircle', style, flat }: Props) {
  const t = TONES[tone];
  const radius = shape === 'circle' ? size / 2 : size * 0.32;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: t.fill[1], // solid base so iOS can render the shadow efficiently
          shadowColor: t.shadow,
          shadowOpacity: flat ? 0 : tone === 'pearl' ? 0.14 : 0.3,
          shadowRadius: size * 0.22,
          shadowOffset: { width: 0, height: size * 0.12 },
          elevation: flat ? 0 : 3,
        },
        style,
      ]}
    >
      {/* clip layer: keeps the fill and shine exactly inside the shape (shadow stays on the outer view) */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <LinearGradient colors={t.fill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        {/* glossy shine: a wide soft ellipse across the upper half */}
        <LinearGradient
          colors={[`rgba(255,255,255,${t.shine})`, 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: -size * 0.1,
            right: -size * 0.1,
            height: size * 0.55,
            borderBottomLeftRadius: size,
            borderBottomRightRadius: size,
          }}
        />
      </View>
      {/* light rim */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: t.rim }]}
      />
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children(t.glyph)}</View>
    </View>
  );
}
