import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const INK = '#22211D';
const GREEN_A = '#7FD07A';
const GREEN_B = '#4DAA4A';

/** 4-point sparkle centred on (cx, cy). */
const sparkle = (cx: number, cy: number, r: number) =>
  `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;

/**
 * Welcome-screen hero: a stack of glassy document cards with a chart,
 * a user question bubble and an AI answer bubble, surrounded by sparkles.
 */
export function HeroArt({ width = 340 }: { width?: number }) {
  return (
    <Svg width={width} height={width * (300 / 340)} viewBox="0 0 340 300">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="glowGreen" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#B9DDB0" stopOpacity={0.55} />
          <Stop offset="1" stopColor="#B9DDB0" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="glowPeach" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#F5C9A8" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#F5C9A8" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#5E5A45" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#5E5A45" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="card" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F6F4EE" />
        </LinearGradient>
        <LinearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#57544E" />
          <Stop offset="1" stopColor="#1C1B18" />
        </LinearGradient>
        <LinearGradient id="green" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={GREEN_A} />
          <Stop offset="1" stopColor={GREEN_B} />
        </LinearGradient>
        <LinearGradient id="greenSoft" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#CFEBC9" />
          <Stop offset="1" stopColor="#A9D7A1" />
        </LinearGradient>
      </Defs>

      {/* ambient glows */}
      <Circle cx="170" cy="150" r="140" fill="url(#glow)" />
      <Circle cx="262" cy="86" r="78" fill="url(#glowGreen)" />
      <Circle cx="76" cy="222" r="72" fill="url(#glowPeach)" />

      {/* floor shadow */}
      <Ellipse cx="172" cy="268" rx="118" ry="16" fill="url(#floorShadow)" />

      {/* back cards */}
      <G rotation={-11} origin="160, 160">
        <Rect x="96" y="66" width="136" height="180" rx="22" fill="#FFFFFF" opacity={0.5} />
        <Rect x="96" y="66" width="136" height="180" rx="22" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
      </G>
      <G rotation={9} origin="190, 160">
        <Rect x="122" y="62" width="136" height="180" rx="22" fill="#FFFFFF" opacity={0.62} />
        <Rect x="122" y="62" width="136" height="180" rx="22" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
        <Rect x="140" y="214" width="60" height="6" rx="3" fill="#DEDBD2" />
      </G>

      {/* front document card */}
      <Rect x="102" y="80" width="140" height="184" rx="22" fill="#000000" opacity={0.05} />
      <Rect x="100" y="72" width="140" height="184" rx="22" fill="url(#card)" />
      <Rect x="100" y="72" width="140" height="184" rx="22" fill="none" stroke="#E8E5DD" strokeWidth={1} />

      {/* doc header: green file glyph + title lines */}
      <Path d="M120 90h13l8 8v18a4 4 0 0 1-4 4h-17a4 4 0 0 1-4-4v-22a4 4 0 0 1 4-4z" fill="url(#green)" />
      <Path d="M133 90v5a3 3 0 0 0 3 3h5z" fill="#B6E6AE" />
      <Rect x="121" y="105" width="9" height="3" rx="1.5" fill="#FFFFFF" />
      <Rect x="152" y="94" width="68" height="8" rx="4" fill={INK} />
      <Rect x="152" y="108" width="44" height="6" rx="3" fill="#CFCBC1" />

      <Rect x="116" y="132" width="108" height="1" fill="#ECE9E2" />

      {/* mini bar chart */}
      <Rect x="118" y="168" width="14" height="24" rx="5" fill="url(#greenSoft)" />
      <Rect x="138" y="156" width="14" height="36" rx="5" fill="url(#greenSoft)" />
      <Rect x="158" y="162" width="14" height="30" rx="5" fill="url(#greenSoft)" />
      <Rect x="178" y="144" width="14" height="48" rx="5" fill="url(#green)" />
      <Rect x="198" y="152" width="14" height="40" rx="5" fill="url(#greenSoft)" />
      <Path d="M125 162 L145 150 L165 156 L185 138 L205 146" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="185" cy="138" r="3.2" fill="#FFFFFF" stroke={INK} strokeWidth={1.6} />

      {/* text lines */}
      <Rect x="118" y="206" width="104" height="6" rx="3" fill="#E4E1D9" />
      <Rect x="118" y="218" width="92" height="6" rx="3" fill="#E4E1D9" />
      <Rect x="118" y="230" width="64" height="6" rx="3" fill="#E4E1D9" />

      {/* user question bubble (left) */}
      <Rect x="26" y="104" width="112" height="48" rx="18" fill="#000000" opacity={0.06} />
      <Path d="M40 98h84a16 16 0 0 1 16 16v12a16 16 0 0 1-16 16h-6l2 10-12-10H40a16 16 0 0 1-16-16v-12a16 16 0 0 1 16-16z" fill="#FFFFFF" />
      <Path d="M40 98h84a16 16 0 0 1 16 16v12a16 16 0 0 1-16 16h-6l2 10-12-10H40a16 16 0 0 1-16-16v-12a16 16 0 0 1 16-16z" fill="none" stroke="#E8E5DD" strokeWidth={1} />
      <Rect x="40" y="111" width="76" height="7" rx="3.5" fill={INK} opacity={0.85} />
      <Rect x="40" y="124" width="52" height="6" rx="3" fill="#CFCBC1" />

      {/* AI answer bubble (right) */}
      <Rect x="204" y="176" width="124" height="70" rx="22" fill="#000000" opacity={0.12} />
      <Path d="M222 168h88a20 20 0 0 1 20 20v26a20 20 0 0 1-20 20h-80l-14 10 2-12a20 20 0 0 1-16-18v-26a20 20 0 0 1 20-20z" fill="url(#ink)" />
      <Path d={sparkle(222, 188, 8)} fill="#FFFFFF" />
      <Path d={sparkle(231, 180, 3.5)} fill={GREEN_A} />
      <Rect x="238" y="184" width="74" height="7" rx="3.5" fill="#FFFFFF" opacity={0.95} />
      <Rect x="216" y="202" width="96" height="6" rx="3" fill="#FFFFFF" opacity={0.45} />
      <Rect x="216" y="214" width="66" height="6" rx="3" fill="#FFFFFF" opacity={0.45} />

      {/* sparkles */}
      <Path d={sparkle(286, 104, 11)} fill={INK} />
      <Path d={sparkle(304, 128, 5)} fill={INK} opacity={0.5} />
      <Path d={sparkle(58, 196, 9)} fill={GREEN_B} />
      <Path d={sparkle(250, 42, 6)} fill="#A9A59A" />
      <Path d={sparkle(84, 62, 5)} fill="#A9A59A" />
      <Circle cx="306" cy="262" r="3" fill={GREEN_B} opacity={0.6} />
      <Circle cx="44" cy="86" r="2.5" fill={INK} opacity={0.35} />
    </Svg>
  );
}
