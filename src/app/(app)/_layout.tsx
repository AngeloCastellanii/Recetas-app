import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function AppLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="group/new" options={{ title: 'Nuevo grupo' }} />
      <Stack.Screen name="group/[id]" options={{ title: 'Grupo' }} />
      <Stack.Screen name="group/edit/[id]" options={{ title: 'Editar grupo' }} />
    </Stack>
  );
}
