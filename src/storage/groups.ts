import type { Group } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import { readJson, writeJson } from '@/storage/json-store';
import { getRecipes, saveRecipes } from '@/storage/recipes';
import { normalizeKey } from '@/utils/normalize';
import { sortByNameAsc } from '@/utils/sort';

export async function getGroups(): Promise<Group[]> {
  const groups = await readJson<Group[]>(STORAGE_KEYS.groups, []);
  return Array.isArray(groups) ? groups : [];
}

export async function getGroupsSorted(): Promise<Group[]> {
  return sortByNameAsc(await getGroups(), 'name');
}

export async function saveGroups(groups: Group[]): Promise<void> {
  await writeJson(STORAGE_KEYS.groups, groups);
}

export async function findGroupById(id: string): Promise<Group | null> {
  const groups = await getGroups();
  return groups.find((group) => group.id === id) ?? null;
}

export async function createGroup(group: Group): Promise<Group> {
  const groups = await getGroups();
  groups.push(group);
  await saveGroups(groups);
  return group;
}

export async function updateGroup(updated: Group): Promise<Group> {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === updated.id);
  if (index < 0) {
    throw new Error('Grupo no encontrado.');
  }
  groups[index] = updated;
  await saveGroups(groups);
  return updated;
}

async function unlinkGroupFromRecipes(groupId: string): Promise<void> {
  const recipes = await getRecipes();
  const next = recipes.map((recipe) => ({
    ...recipe,
    groupIds: (recipe.groupIds ?? []).filter((id) => id !== groupId),
  }));
  await saveRecipes(next);
}

export async function deleteGroupById(groupId: string): Promise<void> {
  const groups = await getGroups();
  await saveGroups(groups.filter((group) => group.id !== groupId));
  await unlinkGroupFromRecipes(groupId);
}

export async function deleteGroupsByOwnerId(ownerId: string): Promise<void> {
  const groups = await getGroups();
  const owned = groups.filter((group) => group.ownerId === ownerId);
  const remaining = groups.filter((group) => group.ownerId !== ownerId);
  await saveGroups(remaining);

  for (const group of owned) {
    await unlinkGroupFromRecipes(group.id);
  }
}

export async function unlinkRecipeFromGroup(
  groupId: string,
  recipeId: string
): Promise<void> {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error('Grupo no encontrado.');
  }

  await updateGroup({
    ...group,
    recipeIds: (group.recipeIds ?? []).filter((id) => id !== recipeId),
    updatedAt: new Date().toISOString(),
  });

  const recipes = await getRecipes();
  await saveRecipes(
    recipes.map((recipe) =>
      recipe.id === recipeId
        ? {
            ...recipe,
            groupIds: (recipe.groupIds ?? []).filter((id) => id !== groupId),
            updatedAt: new Date().toISOString(),
          }
        : recipe
    )
  );
}

export async function unlinkRecipesFromAllGroups(recipeIds: string[]): Promise<void> {
  if (recipeIds.length === 0) {
    return;
  }

  const removed = new Set(recipeIds);
  const groups = await getGroups();
  const next = groups.map((group) => ({
    ...group,
    recipeIds: (group.recipeIds ?? []).filter((id) => !removed.has(id)),
  }));
  await saveGroups(next);
}

export function isDuplicateGroupName(
  groups: Group[],
  name: string,
  excludeId?: string
): boolean {
  const key = normalizeKey(name);
  return groups.some(
    (group) => group.id !== excludeId && normalizeKey(group.name) === key
  );
}
