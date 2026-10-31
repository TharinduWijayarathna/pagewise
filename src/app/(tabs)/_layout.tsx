import { Platform } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { NativeTabs } from 'expo-router/native-tabs';
import { useAuth } from '@/state/auth';
import { TabBar } from '@/components/layout/TabBar';
import { colors } from '@/constants/theme';

/**
 * iOS: the system tab bar (UITabBarController), which renders as Liquid Glass
 * on iOS 26+ and shrinks while scrolling.
 * Android: Pagewise's custom tab bar.
 */
export default function TabsLayout() {
  const { user } = useAuth();
  if (!user) return null; // root layout sends signed-out users to Welcome

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs tintColor={colors.ink} minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history">
          <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
          <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="insights">
          <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" />
          <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
