import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function AuthLayout() {
  const { user } = useAuth();

  if (user) {
    return <Redirect href="/(app)/(tabs)/recipes" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
