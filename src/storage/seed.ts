import type { Recipe } from '@/types';
import { createGroup, getGroups } from '@/storage/groups';
import { setDemoSeeded, getPreferences } from '@/storage/preferences';
import { createRecipe, getRecipes } from '@/storage/recipes';
import { syncRecipeGroupLinks } from '@/storage/relations';
import { createUser, getUsers } from '@/storage/users';
import { createId } from '@/utils/id';
import { hashPassword } from '@/utils/password';

const DEMO_EMAIL = 'demo@recetario.app';

export async function seedDemoDataIfNeeded(): Promise<void> {
  const prefs = await getPreferences();
  if (prefs.demoSeeded) {
    return;
  }

  const [recipes, groups] = await Promise.all([getRecipes(), getGroups()]);
  if (recipes.length > 0 || groups.length > 0) {
    await setDemoSeeded();
    return;
  }

  const users = await getUsers();
  let demoUser = users.find((user) => user.email === DEMO_EMAIL) ?? null;

  if (!demoUser) {
    const now = new Date().toISOString();
    demoUser = await createUser({
      id: createId('user'),
      name: 'Chef Demo',
      email: DEMO_EMAIL,
      passwordHash: await hashPassword('demo1234'),
      createdAt: now,
      updatedAt: now,
    });
  }

  const now = new Date().toISOString();

  const breakfast = await createGroup({
    id: createId('group'),
    name: 'Desayunos',
    description: 'Ideas rápidas para empezar el día',
    recipeIds: [],
    ownerId: demoUser.id,
    createdAt: now,
    updatedAt: now,
  });

  const dinner = await createGroup({
    id: createId('group'),
    name: 'Cenas ligeras',
    description: 'Platos sencillos para la noche',
    recipeIds: [],
    ownerId: demoUser.id,
    createdAt: now,
    updatedAt: now,
  });

  const omelette: Recipe = {
    id: createId('recipe'),
    title: 'Tortilla de verduras',
    description: 'Una tortilla rápida con vegetales frescos.',
    ingredients: ['3 huevos', '1 pimentón', '1 cebolla', 'Sal al gusto'],
    steps: [
      'Pica las verduras en trozos pequeños.',
      'Saltea la cebolla y el pimentón 5 minutos.',
      'Bate los huevos, mézclalos y cocina a fuego medio.',
    ],
    authorId: demoUser.id,
    groupIds: [breakfast.id],
    prepTimeMinutes: 20,
    servings: 2,
    imageUri: null,
    createdAt: now,
    updatedAt: now,
  };

  const salad: Recipe = {
    id: createId('recipe'),
    title: 'Ensalada mediterránea',
    description: 'Fresca, colorida y lista en minutos.',
    ingredients: ['Lechuga', 'Tomate', 'Pepino', 'Aceite de oliva', 'Queso feta'],
    steps: [
      'Lava y corta todos los vegetales.',
      'Agrégalos a un bowl grande.',
      'Aliña con aceite, sal y queso feta.',
    ],
    authorId: demoUser.id,
    groupIds: [dinner.id],
    prepTimeMinutes: 15,
    servings: 2,
    imageUri: null,
    createdAt: now,
    updatedAt: now,
  };

  await createRecipe(omelette);
  await createRecipe(salad);
  await syncRecipeGroupLinks(omelette.id, [], omelette.groupIds);
  await syncRecipeGroupLinks(salad.id, [], salad.groupIds);
  await setDemoSeeded();
}
