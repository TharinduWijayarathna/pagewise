import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors } from '@/constants/theme';
import { ClockIcon, HomeFilledIcon, InsightsIcon, UserIcon } from '@/components/ui/Icons';

const ICONS: Record<string, (active: boolean) => React.ReactNode> = {
  home: (a) => (a ? <HomeFilledIcon size={22} color={colors.ink} /> : <HomeOutline />),
  history: (a) => <ClockIcon size={22} color={a ? colors.ink : colors.faint} strokeWidth={a ? 2 : 1.7} />,
  insights: (a) => <InsightsIcon size={22} color={a ? colors.ink : colors.faint} strokeWidth={a ? 2 : 1.7} />,
  profile: (a) => <UserIcon size={22} color={a ? colors.ink : colors.faint} strokeWidth={a ? 2 : 1.7} />,
};

function HomeOutline() {
  return (
    <View style={{ opacity: 0.45 }}>
      <HomeFilledIcon size={22} color={colors.faint} />
    </View>
  );
}

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
      {/* fades scrolling cards into the background like the mock */}
      <LinearGradient
        colors={['rgba(218,227,201,0)', 'rgba(218,227,201,0.92)', '#DAE3C9']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const onPress = () => {
            if (!focused) navigateToTab(route.key);
          };
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item} hitSlop={10}>
              {ICONS[route.name]?.(focused)}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 34 },
  row: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 34 },
  item: { width: 48, height: 36, alignItems: 'center', justifyContent: 'center' },
});
