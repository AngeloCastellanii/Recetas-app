import { uploadRecipeImage } from '@/services/images';
import { mapGroup, mapProfile, mapRecipe } from '@/services/mappers';
import { supabase } from '@/lib/supabase';
import type { Group, Recipe, User } from '@/types';
import { normalizeText } from '@/utils/normalize';
import { sortByNameAsc } from '@/utils/sort';

export async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return mapProfile(data);
}

export async function ensureProfile(input: {
  id: string;
  name: string;
  email: string;
}): Promise<User | null> {
  const existing = await fetchProfile(input.id);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: input.id,
      name: input.name,
      email: input.email,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) {
    return null;
  }
  return mapProfile(data);
}

export async function updateProfileRow(input: {
  id: string;
  name: string;
  email: string;
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: input.name,
      email: input.email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo actualizar el perfil.' };
  }
  return { ok: true, user: mapProfile(data) };
}

export async function fetchProfilesMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('profiles').select('id, name');
  if (error || !data) {
    return {};
  }
  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.id && row.name) {
      map[row.id] = row.name;
    }
  }
  return map;
}

export async function fetchRecipesAndGroups(): Promise<{
  recipes: Recipe[];
  groups: Group[];
}> {
  const [recipesRes, groupsRes, linksRes] = await Promise.all([
    supabase.from('recipes').select('*'),
    supabase.from('groups').select('*'),
    supabase.from('recipe_groups').select('recipe_id, group_id'),
  ]);

  if (recipesRes.error) {
    throw new Error(recipesRes.error.message);
  }
  if (groupsRes.error) {
    throw new Error(groupsRes.error.message);
  }
  if (linksRes.error) {
    throw new Error(linksRes.error.message);
  }

  const links = linksRes.data ?? [];
  const groupIdsByRecipe = new Map<string, string[]>();
  const recipeIdsByGroup = new Map<string, string[]>();

  for (const link of links) {
    const recipeList = groupIdsByRecipe.get(link.recipe_id) ?? [];
    recipeList.push(link.group_id);
    groupIdsByRecipe.set(link.recipe_id, recipeList);

    const groupList = recipeIdsByGroup.get(link.group_id) ?? [];
    groupList.push(link.recipe_id);
    recipeIdsByGroup.set(link.group_id, groupList);
  }

  const recipes = sortByNameAsc(
    (recipesRes.data ?? []).map((row) =>
      mapRecipe(row, groupIdsByRecipe.get(row.id) ?? [])
    ),
    'title'
  );

  const groups = sortByNameAsc(
    (groupsRes.data ?? []).map((row) =>
      mapGroup(row, recipeIdsByGroup.get(row.id) ?? [])
    ),
    'name'
  );

  return { recipes, groups };
}

export async function createGroupRow(input: {
  name: string;
  description: string;
  ownerId: string;
}): Promise<{ ok: true; group: Group } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: input.name,
      description: input.description,
      owner_id: input.ownerId,
      is_courtesy: false,
    })
    .select('*')
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      return { ok: false, error: 'Ya existe un grupo con ese nombre.' };
    }
    return { ok: false, error: error?.message ?? 'No se pudo crear el grupo.' };
  }
  return { ok: true, group: mapGroup(data, []) };
}

export async function updateGroupRow(input: {
  id: string;
  name: string;
  description: string;
}): Promise<{ ok: true; group: Group } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('groups')
    .update({
      name: input.name,
      description: input.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      return { ok: false, error: 'Ya existe un grupo con ese nombre.' };
    }
    return { ok: false, error: error?.message ?? 'No se pudo actualizar el grupo.' };
  }
  return { ok: true, group: mapGroup(data) };
}

export async function deleteGroupRow(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Al borrar un grupo también se eliminan sus recetas asociadas.
  const { data: links, error: linksError } = await supabase
    .from('recipe_groups')
    .select('recipe_id')
    .eq('group_id', id);

  if (linksError) {
    return { ok: false, error: linksError.message };
  }

  const recipeIds = Array.from(
    new Set((links ?? []).map((row) => row.recipe_id).filter(Boolean))
  );

  if (recipeIds.length > 0) {
    const { error: recipesError } = await supabase
      .from('recipes')
      .delete()
      .in('id', recipeIds);

    if (recipesError) {
      return {
        ok: false,
        error: recipesError.message || 'No se pudieron borrar las recetas del grupo.',
      };
    }
  }

  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function setRecipeGroupLink(
  recipeId: string,
  groupId: string,
  linked: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (linked) {
    const { error } = await supabase
      .from('recipe_groups')
      .upsert({ recipe_id: recipeId, group_id: groupId });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const { error } = await supabase
    .from('recipe_groups')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('group_id', groupId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function syncRecipeGroups(
  recipeId: string,
  nextGroupIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error: deleteError } = await supabase
    .from('recipe_groups')
    .delete()
    .eq('recipe_id', recipeId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  if (nextGroupIds.length === 0) {
    return { ok: true };
  }

  const { error } = await supabase.from('recipe_groups').insert(
    nextGroupIds.map((groupId) => ({
      recipe_id: recipeId,
      group_id: groupId,
    }))
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function createRecipeRow(input: {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  authorId: string;
  groupIds: string[];
  prepTimeMinutes: number | null;
  servings: number | null;
  imageUri: string | null;
}): Promise<{ ok: true; recipe: Recipe } | { ok: false; error: string }> {
  let imageUrl = input.imageUri;
  if (imageUrl) {
    const uploaded = await uploadRecipeImage(input.authorId, imageUrl);
    if (!uploaded.ok) {
      return uploaded;
    }
    imageUrl = uploaded.url;
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      title: input.title,
      description: input.description,
      ingredients: input.ingredients,
      steps: input.steps,
      author_id: input.authorId,
      prep_time_minutes: input.prepTimeMinutes,
      servings: input.servings,
      image_url: imageUrl,
      is_courtesy: false,
    })
    .select('*')
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      return { ok: false, error: 'Ya existe una receta con ese título.' };
    }
    return { ok: false, error: error?.message ?? 'No se pudo crear la receta.' };
  }

  const links = await syncRecipeGroups(data.id, input.groupIds);
  if (!links.ok) {
    return links;
  }

  return { ok: true, recipe: mapRecipe(data, input.groupIds) };
}

export async function updateRecipeRow(input: {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  authorId: string;
  groupIds: string[];
  prepTimeMinutes: number | null;
  servings: number | null;
  imageUri: string | null;
}): Promise<{ ok: true; recipe: Recipe } | { ok: false; error: string }> {
  let imageUrl = input.imageUri;
  if (imageUrl) {
    const uploaded = await uploadRecipeImage(input.authorId, imageUrl);
    if (!uploaded.ok) {
      return uploaded;
    }
    imageUrl = uploaded.url;
  }

  const { data, error } = await supabase
    .from('recipes')
    .update({
      title: input.title,
      description: input.description,
      ingredients: input.ingredients,
      steps: input.steps,
      prep_time_minutes: input.prepTimeMinutes,
      servings: input.servings,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      return { ok: false, error: 'Ya existe una receta con ese título.' };
    }
    return { ok: false, error: error?.message ?? 'No se pudo actualizar la receta.' };
  }

  const links = await syncRecipeGroups(data.id, input.groupIds);
  if (!links.ok) {
    return links;
  }

  return { ok: true, recipe: mapRecipe(data, input.groupIds) };
}

export async function deleteRecipeRow(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export function isDuplicateTitleLocal(
  recipes: Recipe[],
  title: string,
  authorId: string,
  excludeId?: string
): boolean {
  const key = normalizeText(title).toLowerCase();
  return recipes.some(
    (recipe) =>
      recipe.authorId === authorId &&
      recipe.id !== excludeId &&
      normalizeText(recipe.title).toLowerCase() === key
  );
}

export function isDuplicateGroupLocal(
  groups: Group[],
  name: string,
  ownerId: string,
  excludeId?: string
): boolean {
  const key = normalizeText(name).toLowerCase();
  return groups.some(
    (group) =>
      group.ownerId === ownerId &&
      group.id !== excludeId &&
      normalizeText(group.name).toLowerCase() === key
  );
}
