import { Stack } from 'expo-router';

import { RecipeDetailScreen } from '@/screens/recipes/detail';

export default function RecipeDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Receta' }} />
      <RecipeDetailScreen />
    </>
  );
}
