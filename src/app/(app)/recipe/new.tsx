import { Stack } from 'expo-router';

import { RecipeFormScreen } from '@/screens/recipes/form';

export default function NewRecipeRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Nueva receta' }} />
      <RecipeFormScreen mode="create" />
    </>
  );
}
