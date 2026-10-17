import type { Recipe } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import { readJson, writeJson } from '@/storage/json-store';
import { normalizeKey } from '@/utils/normalize';
import { sortByNameAsc } from '@/utils/sort';

export async function getRecipes(): Promise<Recipe[]> {
  const recipes = await readJson<Recipe[]>(STORAGE_KEYS.recipes, []);
  return Array.isArray(recipes) ? recipes : [];
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
  recipes.push(recipe);
  await saveRecipes(recipes);
  return recipe;
}

export async function updateRecipe(updated: Recipe): Promise<Recipe> {
  const recipes = await getRecipes();
  const index = recipes.findIndex((recipe) => recipe.id === updated.id);
  if (index < 0) {
    throw new Error('Receta no encontrada.');
  }
  recipes[index] = updated;
  await saveRecipes(recipes);
  return updated;
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
