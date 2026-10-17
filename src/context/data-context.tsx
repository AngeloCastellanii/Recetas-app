import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/context/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  createGroupRow,
  createRecipeRow,
  deleteGroupRow,
  deleteRecipeRow,
  fetchProfilesMap,
  fetchRecipesAndGroups,
  isDuplicateGroupLocal,
  isDuplicateTitleLocal,
  setRecipeGroupLink,
  updateGroupRow,
  updateRecipeRow,
} from '@/services/api';
import { seedCourtesyDataIfNeeded } from '@/services/demo-seed';
import type { FieldErrors, Group, Recipe } from '@/types';
import { normalizeText } from '@/utils/normalize';
import {
  validateGroupDescription,
  validateGroupName,
  validateIngredient,
  validatePrepTime,
  validateRecipeDescription,
  validateRecipeTitle,
  validateServings,
  validateStep,
} from '@/utils/validation';

type RecipeInput = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  groupIds: string[];
  prepTimeMinutes: string;
  servings: string;
  imageUri: string | null;
};

type Fail = { ok: false; error: string; fieldErrors?: FieldErrors };
type GroupOk = { ok: true; group: Group };
type RecipeOk = { ok: true; recipe: Recipe };

type DataContextValue = {
  groups: Group[];
  recipes: Recipe[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  getAuthorName: (authorId: string, recipe?: Recipe) => string;
  createGroup: (input: {
    name: string;
    description: string;
  }) => Promise<GroupOk | Fail>;
  updateGroup: (input: {
    id: string;
    name: string;
    description: string;
  }) => Promise<GroupOk | Fail>;
  deleteGroup: (id: string) => Promise<{ ok: true } | Fail>;
  unlinkRecipeFromGroup: (
    groupId: string,
    recipeId: string
  ) => Promise<{ ok: true } | Fail>;
  createRecipe: (input: RecipeInput) => Promise<RecipeOk | Fail>;
  updateRecipe: (input: RecipeInput & { id: string }) => Promise<RecipeOk | Fail>;
  deleteRecipe: (id: string) => Promise<{ ok: true } | Fail>;
  toggleRecipeInGroup: (
    recipeId: string,
    groupId: string
  ) => Promise<{ ok: true; linked: boolean } | Fail>;
  getGroupById: (id: string) => Group | undefined;
  getRecipeById: (id: string) => Recipe | undefined;
  getRecipesForGroup: (groupId: string) => Recipe[];
  getGroupsForRecipe: (recipeId: string) => Group[];
};

const DataContext = createContext<DataContextValue | null>(null);

function sanitizeList(
  values: string[],
  validateItem: (value: string) => { ok: boolean; error?: string }
): { ok: true; values: string[] } | { ok: false; error: string } {
  const cleaned = values.map((value) => normalizeText(value)).filter(Boolean);
  if (cleaned.length === 0) {
    return { ok: false, error: 'Agrega al menos un elemento.' };
  }

  for (const item of cleaned) {
    const check = validateItem(item);
    if (!check.ok) {
      return { ok: false, error: check.error ?? 'Elemento inválido.' };
    }
  }

  return { ok: true, values: cleaned };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setGroups([]);
      setRecipes([]);
      setAuthorNames({});
      return;
    }

    await seedCourtesyDataIfNeeded(user.id);
    const [{ recipes: nextRecipes, groups: nextGroups }, names] =
      await Promise.all([fetchRecipesAndGroups(), fetchProfilesMap()]);
    setRecipes(nextRecipes);
    setGroups(nextGroups);
    setAuthorNames(names);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (user) {
          await refresh();
        } else {
          setGroups([]);
          setRecipes([]);
          setAuthorNames({});
        }
      } catch (error) {
        console.warn('[data]', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, refresh]);

  const createGroup = useCallback(
    async (input: { name: string; description: string }) => {
      if (!user) {
        return { ok: false as const, error: 'Debes iniciar sesión.' };
      }

      const fieldErrors: FieldErrors = {};
      const nameCheck = validateGroupName(input.name);
      if (!nameCheck.ok) {
        fieldErrors.name = nameCheck.error ?? 'Nombre inválido.';
      }

      const descriptionCheck = validateGroupDescription(input.description);
      if (!descriptionCheck.ok) {
        fieldErrors.description = descriptionCheck.error ?? 'Descripción inválida.';
      }

      const name = normalizeText(input.name);
      if (!fieldErrors.name && isDuplicateGroupLocal(groups, name, user.id)) {
        fieldErrors.name = 'Ya existe un grupo con ese nombre.';
      }

      if (Object.keys(fieldErrors).length > 0) {
        return {
          ok: false as const,
          error: 'Revisa los campos marcados.',
          fieldErrors,
        };
      }

      const result = await createGroupRow({
        name,
        description: normalizeText(input.description),
        ownerId: user.id,
      });
      if (!result.ok) {
        return result;
      }
      await refresh();
      return result;
    },
    [user, groups, refresh]
  );

  const updateGroup = useCallback(
    async (input: { id: string; name: string; description: string }) => {
      if (!user) {
        return { ok: false as const, error: 'Debes iniciar sesión.' };
      }

      const existing = groups.find((group) => group.id === input.id);
      if (!existing) {
        return { ok: false as const, error: 'Grupo no encontrado.' };
      }
      if (existing.ownerId !== user.id) {
        return { ok: false as const, error: 'Solo el dueño puede editar este grupo.' };
      }

      const fieldErrors: FieldErrors = {};
      const nameCheck = validateGroupName(input.name);
      if (!nameCheck.ok) {
        fieldErrors.name = nameCheck.error ?? 'Nombre inválido.';
      }

      const descriptionCheck = validateGroupDescription(input.description);
      if (!descriptionCheck.ok) {
        fieldErrors.description = descriptionCheck.error ?? 'Descripción inválida.';
      }

      const name = normalizeText(input.name);
      if (
        !fieldErrors.name &&
        isDuplicateGroupLocal(groups, name, user.id, input.id)
      ) {
        fieldErrors.name = 'Ya existe un grupo con ese nombre.';
      }

      if (Object.keys(fieldErrors).length > 0) {
        return {
          ok: false as const,
          error: 'Revisa los campos marcados.',
          fieldErrors,
        };
      }

      const result = await updateGroupRow({
        id: input.id,
        name,
        description: normalizeText(input.description),
      });
      if (!result.ok) {
        return result;
      }
      await refresh();
      return result;
    },
    [user, groups, refresh]
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      if (!user) {
        return { ok: false as const, error: 'Debes iniciar sesión.' };
      }

      const existing = groups.find((group) => group.id === id);
      if (!existing) {
        return { ok: false as const, error: 'Grupo no encontrado.' };
      }
      if (existing.ownerId !== user.id) {
        return { ok: false as const, error: 'Solo el dueño puede borrar este grupo.' };
      }

      const result = await deleteGroupRow(id);
      if (!result.ok) {
        return result;
      }
      await refresh();
      return { ok: true as const };
    },
    [user, groups, refresh]
  );

  const unlinkRecipeFromGroup = useCallback(
    async (groupId: string, recipeId: string) => {
      if (!user) {
        return { ok: false as const, error: 'Debes iniciar sesión.' };
      }

      const existing = groups.find((group) => group.id === groupId);
      if (!existing) {
        return { ok: false as const, error: 'Grupo no encontrado.' };
      }
      if (existing.ownerId !== user.id) {
        return {
          ok: false as const,
          error: 'Solo el dueño puede quitar recetas de este grupo.',
        };
      }

      const result = await setRecipeGroupLink(recipeId, groupId, false);
      if (!result.ok) {
        return result;
      }
      await refresh();
      return { ok: true as const };
    },
    [user, groups, refresh]
  );

  const validateRecipeInput = useCallback(
    (input: RecipeInput, excludeId?: string) => {
      const fieldErrors: FieldErrors = {};

      const titleCheck = validateRecipeTitle(input.title);
      if (!titleCheck.ok) {
        fieldErrors.title = titleCheck.error ?? 'Título inválido.';
      }

      const descriptionCheck = validateRecipeDescription(input.description);
      if (!descriptionCheck.ok) {
        fieldErrors.description = descriptionCheck.error ?? 'Descripción inválida.';
      }

      const title = normalizeText(input.title);
      if (
        !fieldErrors.title &&
        user &&
        isDuplicateTitleLocal(recipes, title, user.id, excludeId)
      ) {
        fieldErrors.title = 'Ya existe una receta con ese título.';
      }

      const ingredients = sanitizeList(input.ingredients, validateIngredient);
      if (!ingredients.ok) {
        fieldErrors.ingredients =
          ingredients.error === 'Agrega al menos un elemento.'
            ? 'Agrega al menos un ingrediente.'
            : (ingredients.error ?? 'Ingredientes inválidos.');
      }

      const steps = sanitizeList(input.steps, validateStep);
      if (!steps.ok) {
        fieldErrors.steps =
          steps.error === 'Agrega al menos un elemento.'
            ? 'Agrega al menos un paso.'
            : (steps.error ?? 'Pasos inválidos.');
      }

      const prepCheck = validatePrepTime(input.prepTimeMinutes);
      if (!prepCheck.ok) {
        fieldErrors.prepTimeMinutes = prepCheck.error ?? 'Tiempo inválido.';
      }

      const servingsCheck = validateServings(input.servings);
      if (!servingsCheck.ok) {
        fieldErrors.servings = servingsCheck.error ?? 'Porciones inválidas.';
      }

      if (Object.keys(fieldErrors).length > 0 || !ingredients.ok || !steps.ok) {
        return {
          ok: false as const,
          error: 'Revisa los campos marcados.',
          fieldErrors,
        };
      }

      const validGroupIds = input.groupIds.filter((id) =>
        groups.some((group) => group.id === id && group.ownerId === user?.id)
      );

      return {
        ok: true as const,
        data: {
          title,
          description: normalizeText(input.description),
          ingredients: ingredients.values,
          steps: steps.values,
          groupIds: validGroupIds,
          prepTimeMinutes: input.prepTimeMinutes.trim()
            ? Number(input.prepTimeMinutes.trim())
            : null,
          servings: input.servings.trim() ? Number(input.servings.trim()) : null,
          imageUri: input.imageUri ?? null,
        },
      };
    },
    [recipes, groups, user?.id]
  );

  const createRecipe = useCallback(
    async (input: RecipeInput) => {
      if (!user) {
        return { ok: false as const, error: 'Debes iniciar sesión.' };
      }

      const validated = validateRecipeInput(input);
      if (!validated.ok) {
        return validated;
      }

      const result = await createRecipeRow({
        ...validated.data,
        authorId: user.id,
      });
      if (!result.ok) {
        return result;
      }
      await refresh();
      return result;
    },
    [user, validateRecipeInput, refresh]
  );

  const updateRecipe = useCallback(
    async (input: RecipeInput & { id: string }) => {
      if (!user) {
        return { ok: false as const, error: 'Debes iniciar sesión.' };
      }

      const existing = recipes.find((recipe) => recipe.id === input.id);
      if (!existing) {
        return { ok: false as const, error: 'Receta no encontrada.' };
      }
      if (existing.authorId !== user.id || existing.isCourtesy) {
        return {
          ok: false as const,
          error: existing.isCourtesy
            ? 'Las recetas de la app no se pueden editar.'
            : 'Solo el autor puede editar esta receta.',
        };
      }

      const validated = validateRecipeInput(input, input.id);
      if (!validated.ok) {
        return validated;
      }

      const result = await updateRecipeRow({
        id: input.id,
        ...validated.data,
        authorId: user.id,
      });
      if (!result.ok) {
        return result;
      }
      await refresh();
      return result;
    },
    [user, recipes, validateRecipeInput, refresh]
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
      if (!user) {
        return { ok: false as const, error: 'Debes iniciar sesión.' };
      }

      const existing = recipes.find((recipe) => recipe.id === id);
      if (!existing) {
        return { ok: false as const, error: 'Receta no encontrada.' };
      }
      if (existing.authorId !== user.id || existing.isCourtesy) {
        return {
          ok: false as const,
          error: existing.isCourtesy
            ? 'Las recetas de la app no se pueden borrar.'
            : 'Solo el autor puede borrar esta receta.',
        };
      }

      const result = await deleteRecipeRow(id);
      if (!result.ok) {
        return result;
      }
      await refresh();
      return { ok: true as const };
    },
    [user, recipes, refresh]
  );

  const toggleRecipeInGroup = useCallback(
    async (recipeId: string, groupId: string) => {
      if (!user) {
        return { ok: false as const, error: 'Debes iniciar sesión.' };
      }

      const group = groups.find((item) => item.id === groupId);
      if (!group) {
        return { ok: false as const, error: 'Grupo no encontrado.' };
      }
      if (group.ownerId !== user.id) {
        return {
          ok: false as const,
          error: 'Solo puedes guardar recetas en tus propios grupos.',
        };
      }

      const recipe = recipes.find((item) => item.id === recipeId);
      if (!recipe) {
        return { ok: false as const, error: 'Receta no encontrada.' };
      }

      const linked = (recipe.groupIds ?? []).includes(groupId);
      const result = await setRecipeGroupLink(recipeId, groupId, !linked);
      if (!result.ok) {
        return result;
      }
      await refresh();
      return { ok: true as const, linked: !linked };
    },
    [user, groups, recipes, refresh]
  );

  const getAuthorName = useCallback(
    (authorId: string, recipe?: Recipe) => {
      if (recipe?.isCourtesy) {
        return 'Cortesía de la App';
      }
      if (!authorId) {
        return 'Usuario';
      }
      if (user?.id === authorId) {
        return 'Tú';
      }
      return authorNames[authorId] || 'Usuario';
    },
    [authorNames, user?.id]
  );

  const getGroupById = useCallback(
    (id: string) => groups.find((group) => group.id === id),
    [groups]
  );

  const getRecipeById = useCallback(
    (id: string) => recipes.find((recipe) => recipe.id === id),
    [recipes]
  );

  const getRecipesForGroup = useCallback(
    (groupId: string) => {
      const group = groups.find((item) => item.id === groupId);
      if (!group) {
        return [];
      }
      const ids = new Set(group.recipeIds ?? []);
      return recipes.filter((recipe) => ids.has(recipe.id));
    },
    [groups, recipes]
  );

  const getGroupsForRecipe = useCallback(
    (recipeId: string) => {
      const recipe = recipes.find((item) => item.id === recipeId);
      if (!recipe) {
        return [];
      }
      const ids = new Set(recipe.groupIds ?? []);
      return groups.filter((group) => ids.has(group.id));
    },
    [groups, recipes]
  );

  const value = useMemo(
    () => ({
      groups,
      recipes,
      isLoading,
      refresh,
      getAuthorName,
      createGroup,
      updateGroup,
      deleteGroup,
      unlinkRecipeFromGroup,
      createRecipe,
      updateRecipe,
      deleteRecipe,
      toggleRecipeInGroup,
      getGroupById,
      getRecipeById,
      getRecipesForGroup,
      getGroupsForRecipe,
    }),
    [
      groups,
      recipes,
      isLoading,
      refresh,
      getAuthorName,
      createGroup,
      updateGroup,
      deleteGroup,
      unlinkRecipeFromGroup,
      createRecipe,
      updateRecipe,
      deleteRecipe,
      toggleRecipeInGroup,
      getGroupById,
      getRecipeById,
      getRecipesForGroup,
      getGroupsForRecipe,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe usarse dentro de DataProvider.');
  }
  return context;
}
