import { DEMO_GROUPS, DEMO_RECIPES } from '@/storage/seed';
import { supabase } from '@/lib/supabase';
import { normalizeText } from '@/utils/normalize';

const DEMO_SEED_VERSION = 2;

/**
 * Si la base está vacía, inserta grupos/recetas de cortesía
 * atribuidos al usuario actual pero marcados is_courtesy.
 */
export async function seedCourtesyDataIfNeeded(userId: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    console.warn('[seed]', countError.message);
    return;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const groupIdByName = new Map<string, string>();

  for (const draft of DEMO_GROUPS) {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: draft.name,
        description: draft.description,
        owner_id: userId,
        is_courtesy: true,
      })
      .select('id, name')
      .single();

    if (error || !data) {
      console.warn('[seed] grupo', draft.name, error?.message);
      continue;
    }
    groupIdByName.set(normalizeText(data.name).toLowerCase(), data.id);
  }

  for (const draft of DEMO_RECIPES) {
    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        title: draft.title,
        description: draft.description,
        ingredients: draft.ingredients,
        steps: draft.steps,
        author_id: userId,
        prep_time_minutes: draft.prepTimeMinutes,
        servings: draft.servings,
        is_courtesy: true,
      })
      .select('id')
      .single();

    if (error || !recipe) {
      console.warn('[seed] receta', draft.title, error?.message);
      continue;
    }

    const links = draft.groupNames
      .map((name) => groupIdByName.get(normalizeText(name).toLowerCase()))
      .filter((id): id is string => Boolean(id))
      .map((groupId) => ({ recipe_id: recipe.id, group_id: groupId }));

    if (links.length > 0) {
      await supabase.from('recipe_groups').insert(links);
    }
  }

  void DEMO_SEED_VERSION;
}
