import { Stack } from 'expo-router';

import { GroupFormScreen } from '@/screens/groups/form';

export default function EditGroupRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Editar grupo' }} />
      <GroupFormScreen mode="edit" />
    </>
  );
}
