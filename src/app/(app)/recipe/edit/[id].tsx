import { Stack } from 'expo-router';

import { RecipeFormScreen } from '@/screens/recipes/form';

export default function EditRecipeRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Editar receta' }} />
      <RecipeFormScreen mode="edit" />
    </>
  );
}
