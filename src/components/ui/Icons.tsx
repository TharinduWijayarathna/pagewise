import { UNFILED_TINT, type DocTint } from '@/constants/folderColors';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type P = { size?: number; color?: string; strokeWidth?: number };

const Base = ({ size = 20, color = '#26251F', strokeWidth = 1.6, children }: P & { children: React.ReactNode }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Svg>
);

export const SparklesIcon = (p: P) => (
  <Base {...p}>
    <Path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z" />
    <Path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
  </Base>
);

export const BellIcon = (p: P) => (
  <Base {...p}>
    <Path d="M10.27 21a2 2 0 0 0 3.46 0" />
    <Path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33" />
  </Base>
);

export const SearchIcon = (p: P) => (
  <Base {...p}>
    <Circle cx="11" cy="11" r="7.5" />
    <Path d="m20.5 20.5-4.2-4.2" />
  </Base>
);

export const FileTextIcon = (p: P) => (
  <Base {...p}>
    <Path d="M14.5 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7.5z" />
    <Path d="M14.5 2.5v3a2 2 0 0 0 2 2h3" />
    <Path d="M9 11h6M9 15h6" />
  </Base>
);

export const ClockIcon = (p: P) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="9.5" />
    <Path d="M12 7v5l3 2" />
  </Base>
);

export const InsightsIcon = (p: P) => (
  <Base {...p}>
    <Rect x="3" y="3" width="18" height="18" rx="5" />
    <Path d="M7 15.5c1.6-3.2 2.7-.6 4.4-3.3S14.3 8.8 17 8" />
    <Path d="M14.5 7.5 17 8l-.6 2.4" />
  </Base>
);

export const UserIcon = (p: P) => (
  <Base {...p}>
    <Circle cx="12" cy="7.5" r="4" />
    <Path d="M4.5 21v-1.5a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5V21" />
  </Base>
);

export const HomeFilledIcon = ({ size = 22, color = '#1D1C19' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M10.2 2.9a2.8 2.8 0 0 1 3.6 0l6.4 5.4c.65.55 1.03 1.36 1.03 2.21v8.2A2.8 2.8 0 0 1 18.43 21.5H5.57a2.8 2.8 0 0 1-2.8-2.79v-8.2c0-.85.38-1.66 1.03-2.21z"
      fill={color}
    />
    <Path d="M9.5 16.8h5" stroke="#F3EFE6" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const ArrowLeftIcon = (p: P) => (
  <Base {...p}>
    <Path d="m11 18.5-6.5-6.5L11 5.5M4.8 12h14.7" />
  </Base>
);

export const ShareCirclesIcon = (p: P) => (
  <Base {...p}>
    <Circle cx="12" cy="6.5" r="3.2" />
    <Circle cx="6.5" cy="16.5" r="3.2" />
    <Circle cx="17.5" cy="16.5" r="3.2" />
  </Base>
);

export const MicIcon = (p: P) => (
  <Base {...p}>
    <Rect x="9" y="2.5" width="6" height="12" rx="3" />
    <Path d="M18.5 10.5v1a6.5 6.5 0 0 1-13 0v-1M12 18v3.5" />
  </Base>
);

export const SendIcon = (p: P) => (
  <Base {...p}>
    <Path d="M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11z" />
    <Path d="m21.85 2.15-10.94 10.94" />
  </Base>
);

export const SummaryIcon = (p: P) => (
  <Base {...p}>
    <Rect x="4" y="3" width="16" height="18" rx="3" />
    <Path d="M8 8h8M8 12h8M8 16h5" />
  </Base>
);

export const AnalyzeIcon = (p: P) => (
  <Base {...p}>
    <Path d="M20.5 12.5v4.5a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5h4.5" />
    <Path d="m7.5 14.5 3-3 2.5 2.5 4.5-5" />
    <Path d="M17.5 3.5v4M15.5 5.5h4" />
  </Base>
);

export const UpdateIcon = (p: P) => (
  <Base {...p}>
    <Path d="M14.5 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7.5z" />
    <Path d="M14.5 2.5v5h5M9 13h6M9 17h4" />
  </Base>
);

/** Glossy document glyph. `tint` comes from the document's folder colour (default: brand green). */
export const DocIcon = ({ size = 40, tint = UNFILED_TINT }: { size?: number; tint?: DocTint }) => (
  <Svg width={size} height={size * 1.15} viewBox="0 0 40 46">
    <Defs>
      <LinearGradient id="docTop" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={tint.top[0]} />
        <Stop offset="1" stopColor={tint.top[1]} />
      </LinearGradient>
      <LinearGradient id="docBottom" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={tint.base[0]} />
        <Stop offset="1" stopColor={tint.base[1]} />
      </LinearGradient>
      <LinearGradient id="fold" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={tint.fold[0]} />
        <Stop offset="1" stopColor={tint.fold[1]} />
      </LinearGradient>
    </Defs>
    {/* base sheet (pale) */}
    <Path d="M6 4h19l11 11v25a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="url(#docBottom)" />
    {/* coloured upper part */}
    <Path d="M6 4h19l11 11v13c-6 2-12 3-17 3S8 30 2 28V8a4 4 0 0 1 4-4z" fill="url(#docTop)" />
    {/* fold */}
    <Path d="M25 4v7a4 4 0 0 0 4 4h7z" fill="url(#fold)" />
    {/* dash */}
    <Rect x="10" y="20" width="9" height="3" rx="1.5" fill="#FFFFFF" opacity={0.95} />
  </Svg>
);

/** Brand-green document icon (unfiled documents, upload, etc.). */
export const GreenDocIcon = ({ size = 40 }: { size?: number }) => <DocIcon size={size} />;

export const MailIcon = (p: P) => (
  <Base {...p}>
    <Rect x="2.5" y="4.5" width="19" height="15" rx="3" />
    <Path d="m3.5 7 8.5 6 8.5-6" />
  </Base>
);

export const LockIcon = (p: P) => (
  <Base {...p}>
    <Rect x="4" y="10.5" width="16" height="11" rx="3" />
    <Path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5M12 15v2.5" />
  </Base>
);

export const EyeIcon = (p: P) => (
  <Base {...p}>
    <Path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
    <Circle cx="12" cy="12" r="3" />
  </Base>
);

export const EyeOffIcon = (p: P) => (
  <Base {...p}>
    <Path d="M10.73 5.08A10.74 10.74 0 0 1 21.94 11.65a1 1 0 0 1 0 .7 10.8 10.8 0 0 1-1.44 2.49M14.08 14.16a3 3 0 0 1-4.24-4.24M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14M2 2l20 20" />
  </Base>
);

export const CheckIcon = (p: P) => (
  <Base {...p}>
    <Path d="M20 6 9 17l-5-5" />
  </Base>
);

export const ChevronRightIcon = (p: P) => (
  <Base {...p}>
    <Path d="m9 18 6-6-6-6" />
  </Base>
);

export const PlusIcon = (p: P) => (
  <Base {...p}>
    <Path d="M12 5v14M5 12h14" />
  </Base>
);

export const UploadIcon = (p: P) => (
  <Base {...p}>
    <Path d="M12 15V3.5M7 8.5l5-5 5 5" />
    <Path d="M20.5 15v3a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-3" />
  </Base>
);

export const CrownIcon = (p: P) => (
  <Base {...p}>
    <Path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.29l4.27-3.66a.5.5 0 0 1 .82.5l-2.83 10.25a1 1 0 0 1-.96.75H5.8a1 1 0 0 1-.96-.75L2.01 6a.5.5 0 0 1 .82-.5L7.1 9.16a1 1 0 0 0 1.52-.29z" />
    <Path d="M5 21h14" />
  </Base>
);

export const MessageIcon = (p: P) => (
  <Base {...p}>
    <Path d="M7.9 20A9 9 0 1 0 4 16.1L2.5 21.5z" />
  </Base>
);

export const ShieldIcon = (p: P) => (
  <Base {...p}>
    <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </Base>
);

export const HelpIcon = (p: P) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="9.5" />
    <Path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
  </Base>
);

export const LogoutIcon = (p: P) => (
  <Base {...p}>
    <Path d="M9 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2H9M16 17l5-5-5-5M21 12H9" />
  </Base>
);

export const DatabaseIcon = (p: P) => (
  <Base {...p}>
    <Path d="M3.5 5.5c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3-3.8-3-8.5-3-8.5 1.34-8.5 3" />
    <Path d="M3.5 5.5v13c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3v-13M3.5 12c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3" />
  </Base>
);

export const TrashIcon = (p: P) => (
  <Base {...p}>
    <Path d="M3.5 6h17M8 6V4.5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 4.5V6M18.5 6l-.9 13.1a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9L5.5 6" />
  </Base>
);

export const CameraIcon = (p: P) => (
  <Base {...p}>
    <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
    <Circle cx="12" cy="13" r="3.5" />
  </Base>
);

export const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <Path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93z" />
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </Svg>
);

export const AppleIcon = ({ size = 20, color = '#1D1C19' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M17.05 12.54c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89a5.02 5.02 0 0 0-4.25 2.58c-1.81 3.14-.46 7.8 1.3 10.35.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.29-1.27 3.14-2.53a11.3 11.3 0 0 0 1.42-2.92c-.03-.01-2.72-1.05-2.75-4.15zM14.47 4.9c.72-.87 1.2-2.07 1.07-3.27-1.03.04-2.28.69-3.02 1.55-.66.77-1.24 1.99-1.09 3.17 1.15.09 2.32-.58 3.04-1.45z"
    />
  </Svg>
);

/** Two stacked sheets (green front page) used beside the Home title. */
export const StackedDocsIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Defs>
      <LinearGradient id="sdFront" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#7FD07A" />
        <Stop offset="1" stopColor="#4DAA4A" />
      </LinearGradient>
    </Defs>
    {/* back sheet */}
    <Rect x="11" y="3" width="16" height="21" rx="3.5" fill="#E4E0D6" stroke="#CFCABE" strokeWidth={1} transform="rotate(10 19 13.5)" />
    {/* front sheet */}
    <Path d="M8 7h9.5l5.5 5.5V26a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3z" fill="url(#sdFront)" />
    <Path d="M17.5 7v3.5a2 2 0 0 0 2 2H23z" fill="#B6E6AE" />
    <Rect x="8.5" y="16" width="10" height="2.2" rx="1.1" fill="#FFFFFF" />
    <Rect x="8.5" y="20.5" width="6.5" height="2.2" rx="1.1" fill="#FFFFFF" opacity={0.8} />
  </Svg>
);

export const HomeIcon = (p: P) => (
  <Base {...p}>
    <Path d="M3.5 10.2 10.7 4.1a2 2 0 0 1 2.6 0l7.2 6.1V19a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    <Path d="M9.5 16.5h5" />
  </Base>
);

export const CloseIcon = (p: P) => (
  <Base {...p}>
    <Path d="M18 6 6 18M6 6l12 12" />
  </Base>
);

export const FolderIcon = (p: P) => (
  <Base {...p}>
    <Path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </Base>
);

export const FolderPlusIcon = (p: P) => (
  <Base {...p}>
    <Path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    <Path d="M12 11v5M9.5 13.5h5" />
  </Base>
);

export const MoreIcon = (p: P) => (
  <Base {...p}>
    <Circle cx="6" cy="12" r="1.3" />
    <Circle cx="12" cy="12" r="1.3" />
    <Circle cx="18" cy="12" r="1.3" />
  </Base>
);

export const CalendarIcon = (p: P) => (
  <Base {...p}>
    <Rect x="3.5" y="4.5" width="17" height="16" rx="3" />
    <Path d="M8 2.5v4M16 2.5v4M3.5 9.5h17" />
  </Base>
);

export const SpeakerIcon = (p: P) => (
  <Base {...p}>
    <Path d="M11 5 6.5 8.5H3.5v7h3L11 19z" />
    <Path d="M15.5 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12" />
  </Base>
);

export const StopIcon = (p: P) => (
  <Base {...p}>
    <Rect x="6" y="6" width="12" height="12" rx="2.5" />
  </Base>
);

export const CardsIcon = (p: P) => (
  <Base {...p}>
    <Rect x="3" y="7" width="14" height="13" rx="2.5" />
    <Path d="M7 4h11.5A2.5 2.5 0 0 1 21 6.5V16" />
  </Base>
);

export const QuizIcon = (p: P) => (
  <Base {...p}>
    <Circle cx="12" cy="12" r="9.5" />
    <Path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4" />
    <Path d="M12 17.5h.01" />
  </Base>
);

export const AlertIcon = (p: P) => (
  <Base {...p}>
    <Path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <Path d="M12 9.5v4M12 17h.01" />
  </Base>
);

export const ImageIcon = (p: P) => (
  <Base {...p}>
    <Rect x="3" y="3.5" width="18" height="17" rx="3" />
    <Circle cx="9" cy="9.5" r="1.8" />
    <Path d="m21 15.5-4.5-4.5L6 20.5" />
  </Base>
);
