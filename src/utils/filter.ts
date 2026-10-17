import { normalizeKey } from '@/utils/normalize';
import type { Group, Recipe } from '@/types';

export function recipeMatchesQuery(recipe: Recipe, query: string): boolean {
  const q = normalizeKey(query);
  if (!q) {
    return true;
  }

  const haystack = [
    recipe.title,
    recipe.description,
    ...(recipe.ingredients ?? []),
    ...(recipe.steps ?? []),
  ]
    .join(' ')
    .toLocaleLowerCase('es');

  return haystack.includes(q);
}

export function groupMatchesQuery(group: Group, query: string): boolean {
  const q = normalizeKey(query);
  if (!q) {
    return true;
  }

  return normalizeKey(`${group.name} ${group.description}`).includes(q);
}
