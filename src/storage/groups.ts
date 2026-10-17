import type { Group } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import { readJson, writeJson } from '@/storage/json-store';

export async function getGroups(): Promise<Group[]> {
  const groups = await readJson<Group[]>(STORAGE_KEYS.groups, []);
  return Array.isArray(groups) ? groups : [];
}

export async function saveGroups(groups: Group[]): Promise<void> {
  await writeJson(STORAGE_KEYS.groups, groups);
}

export async function deleteGroupsByOwnerId(ownerId: string): Promise<void> {
  const groups = await getGroups();
  await saveGroups(groups.filter((group) => group.ownerId !== ownerId));
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
