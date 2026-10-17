import { Stack } from 'expo-router';

import { GroupFormScreen } from '@/screens/groups/form';

export default function NewGroupRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Nuevo grupo' }} />
      <GroupFormScreen mode="create" />
    </>
  );
}
