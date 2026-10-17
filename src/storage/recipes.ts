import type { Recipe } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import { readJson, writeJson } from '@/storage/json-store';
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

export async function deleteRecipesByAuthorId(authorId: string): Promise<string[]> {
  const recipes = await getRecipes();
  const removedIds = recipes
    .filter((recipe) => recipe.authorId === authorId)
    .map((recipe) => recipe.id);
  await saveRecipes(recipes.filter((recipe) => recipe.authorId !== authorId));
  return removedIds;
}
