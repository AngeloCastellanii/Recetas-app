import { getGroups, saveGroups } from '@/storage/groups';

export async function syncRecipeGroupLinks(
  recipeId: string,
  previousGroupIds: string[],
  nextGroupIds: string[]
): Promise<void> {
  const previous = new Set(previousGroupIds);
  const next = new Set(nextGroupIds);
  const groups = await getGroups();

  const updated = groups.map((group) => {
    const recipeIds = new Set(group.recipeIds ?? []);

    if (previous.has(group.id) && !next.has(group.id)) {
      recipeIds.delete(recipeId);
    }
    if (next.has(group.id)) {
      recipeIds.add(recipeId);
    }

    return {
      ...group,
      recipeIds: Array.from(recipeIds),
      updatedAt: new Date().toISOString(),
    };
  });

  await saveGroups(updated);
}
