import { Stack } from 'expo-router';
import { useAuth } from '@/state/auth';

/** Auth flow. The root layout navigates away once the user signs in. */
export default function AuthLayout() {
  const { user } = useAuth();
  if (user) return null;
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#EEEADF' }, animation: 'slide_from_right' }}
    />
  );
}
