import { Stack } from 'expo-router';

import { GroupDetailScreen } from '@/screens/groups/detail';

export default function GroupDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Detalle' }} />
      <GroupDetailScreen />
    </>
  );
}
