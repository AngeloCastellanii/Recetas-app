import type { Recipe } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import { readJson, writeJson } from '@/storage/json-store';
import { normalizeKey } from '@/utils/normalize';
import { sortByNameAsc } from '@/utils/sort';

function normalizeRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    title: recipe.title ?? '',
    description: recipe.description ?? '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    groupIds: Array.isArray(recipe.groupIds) ? recipe.groupIds : [],
    imageUri: recipe.imageUri ?? null,
    prepTimeMinutes:
      typeof recipe.prepTimeMinutes === 'number' ? recipe.prepTimeMinutes : null,
    servings: typeof recipe.servings === 'number' ? recipe.servings : null,
  };
}

export async function getRecipes(): Promise<Recipe[]> {
  const recipes = await readJson<Recipe[]>(STORAGE_KEYS.recipes, []);
  return (Array.isArray(recipes) ? recipes : []).map(normalizeRecipe);
}

export async function getRecipesSorted(): Promise<Recipe[]> {
  return sortByNameAsc(await getRecipes(), 'title');
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  await writeJson(STORAGE_KEYS.recipes, recipes);
}

export async function findRecipeById(id: string): Promise<Recipe | null> {
  const recipes = await getRecipes();
  return recipes.find((recipe) => recipe.id === id) ?? null;
}

export async function createRecipe(recipe: Recipe): Promise<Recipe> {
  const recipes = await getRecipes();
  recipes.push(normalizeRecipe(recipe));
  await saveRecipes(recipes);
  return normalizeRecipe(recipe);
}

export async function updateRecipe(updated: Recipe): Promise<Recipe> {
  const recipes = await getRecipes();
  const index = recipes.findIndex((recipe) => recipe.id === updated.id);
  if (index < 0) {
    throw new Error('Receta no encontrada.');
  }
  recipes[index] = normalizeRecipe(updated);
  await saveRecipes(recipes);
  return recipes[index];
}

export async function deleteRecipeById(recipeId: string): Promise<void> {
  const recipes = await getRecipes();
  await saveRecipes(recipes.filter((recipe) => recipe.id !== recipeId));
}

export async function deleteRecipesByAuthorId(authorId: string): Promise<string[]> {
  const recipes = await getRecipes();
  const removedIds = recipes
    .filter((recipe) => recipe.authorId === authorId)
    .map((recipe) => recipe.id);
  await saveRecipes(recipes.filter((recipe) => recipe.authorId !== authorId));
  return removedIds;
}

export function isDuplicateRecipeTitle(
  recipes: Recipe[],
  title: string,
  excludeId?: string
): boolean {
  const key = normalizeKey(title);
  return recipes.some(
    (recipe) => recipe.id !== excludeId && normalizeKey(recipe.title) === key
  );
}
