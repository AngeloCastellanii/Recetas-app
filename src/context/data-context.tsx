import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Group, Recipe } from '@/types';
import {
  createGroup as createGroupInStore,
  createRecipe as createRecipeInStore,
  deleteGroupById,
  deleteRecipeById,
  getGroupsSorted,
  getRecipesSorted,
  getUsers,
  isDuplicateGroupName,
  isDuplicateRecipeTitle,
  syncRecipeGroupLinks,
  unlinkRecipeFromGroup as unlinkRecipeFromGroupInStore,
  unlinkRecipesFromAllGroups,
  updateGroup as updateGroupInStore,
  updateRecipe as updateRecipeInStore,
} from '@/storage';
import { useAuth } from '@/context/auth-context';
import { createId } from '@/utils/id';
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
};

type DataContextValue = {
  groups: Group[];
  recipes: Recipe[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  getAuthorName: (authorId: string) => string;
  createGroup: (input: {
    name: string;
    description: string;
  }) => Promise<{ ok: true; group: Group } | { ok: false; error: string }>;
  updateGroup: (input: {
    id: string;
    name: string;
    description: string;
  }) => Promise<{ ok: true; group: Group } | { ok: false; error: string }>;
  deleteGroup: (
    id: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  unlinkRecipeFromGroup: (
    groupId: string,
    recipeId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  createRecipe: (
    input: RecipeInput
  ) => Promise<{ ok: true; recipe: Recipe } | { ok: false; error: string }>;
  updateRecipe: (
    input: RecipeInput & { id: string }
  ) => Promise<{ ok: true; recipe: Recipe } | { ok: false; error: string }>;
  deleteRecipe: (
    id: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
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
    const [nextGroups, nextRecipes, nextUsers] = await Promise.all([
      getGroupsSorted(),
      getRecipesSorted(),
      getUsers(),
    ]);
    setGroups(Array.isArray(nextGroups) ? nextGroups : []);
    setRecipes(Array.isArray(nextRecipes) ? nextRecipes : []);
    const names: Record<string, string> = {};
    for (const item of Array.isArray(nextUsers) ? nextUsers : []) {
      if (item?.id && item?.name) {
        names[item.id] = item.name;
      }
    }
    setAuthorNames(names);
  }, []);

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

      const nameCheck = validateGroupName(input.name);
      if (!nameCheck.ok) {
        return { ok: false as const, error: nameCheck.error ?? 'Nombre inválido.' };
      }

      const descriptionCheck = validateGroupDescription(input.description);
      if (!descriptionCheck.ok) {
        return {
          ok: false as const,
          error: descriptionCheck.error ?? 'Descripción inválida.',
        };
      }

      const name = normalizeText(input.name);
      const current = await getGroupsSorted();
      if (isDuplicateGroupName(current, name)) {
        return {
          ok: false as const,
          error: 'Ya existe un grupo con ese nombre.',
        };
      }

      const now = new Date().toISOString();
      const group = await createGroupInStore({
        id: createId('group'),
        name,
        description: normalizeText(input.description),
        recipeIds: [],
        ownerId: user.id,
        createdAt: now,
        updatedAt: now,
      });

      await refresh();
      return { ok: true as const, group };
    },
    [user, refresh]
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

      const nameCheck = validateGroupName(input.name);
      if (!nameCheck.ok) {
        return { ok: false as const, error: nameCheck.error ?? 'Nombre inválido.' };
      }

      const descriptionCheck = validateGroupDescription(input.description);
      if (!descriptionCheck.ok) {
        return {
          ok: false as const,
          error: descriptionCheck.error ?? 'Descripción inválida.',
        };
      }

      const name = normalizeText(input.name);
      if (isDuplicateGroupName(groups, name, input.id)) {
        return {
          ok: false as const,
          error: 'Ya existe un grupo con ese nombre.',
        };
      }

      const group = await updateGroupInStore({
        ...existing,
        name,
        description: normalizeText(input.description),
        updatedAt: new Date().toISOString(),
      });

      await refresh();
      return { ok: true as const, group };
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

      try {
        await deleteGroupById(id);
        await refresh();
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: 'No se pudo borrar el grupo.' };
      }
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

      try {
        await unlinkRecipeFromGroupInStore(groupId, recipeId);
        await refresh();
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: 'No se pudo quitar la receta del grupo.' };
      }
    },
    [user, groups, refresh]
  );

  const validateRecipeInput = useCallback(
    (input: RecipeInput, excludeId?: string) => {
      const titleCheck = validateRecipeTitle(input.title);
      if (!titleCheck.ok) {
        return { ok: false as const, error: titleCheck.error ?? 'Título inválido.' };
      }

      const descriptionCheck = validateRecipeDescription(input.description);
      if (!descriptionCheck.ok) {
        return {
          ok: false as const,
          error: descriptionCheck.error ?? 'Descripción inválida.',
        };
      }

      const title = normalizeText(input.title);
      if (isDuplicateRecipeTitle(recipes, title, excludeId)) {
        return {
          ok: false as const,
          error: 'Ya existe una receta con ese título.',
        };
      }

      const ingredients = sanitizeList(input.ingredients, validateIngredient);
      if (!ingredients.ok) {
        return {
          ok: false as const,
          error:
            ingredients.error === 'Agrega al menos un elemento.'
              ? 'Agrega al menos un ingrediente.'
              : ingredients.error,
        };
      }

      const steps = sanitizeList(input.steps, validateStep);
      if (!steps.ok) {
        return {
          ok: false as const,
          error:
            steps.error === 'Agrega al menos un elemento.'
              ? 'Agrega al menos un paso.'
              : steps.error,
        };
      }

      const prepCheck = validatePrepTime(input.prepTimeMinutes);
      if (!prepCheck.ok) {
        return { ok: false as const, error: prepCheck.error ?? 'Tiempo inválido.' };
      }

      const servingsCheck = validateServings(input.servings);
      if (!servingsCheck.ok) {
        return {
          ok: false as const,
          error: servingsCheck.error ?? 'Porciones inválidas.',
        };
      }

      const validGroupIds = input.groupIds.filter((id) =>
        groups.some((group) => group.id === id)
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
        },
      };
    },
    [recipes, groups]
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

      const now = new Date().toISOString();
      const recipe = await createRecipeInStore({
        id: createId('recipe'),
        authorId: user.id,
        createdAt: now,
        updatedAt: now,
        ...validated.data,
      });

      await syncRecipeGroupLinks(recipe.id, [], recipe.groupIds);
      await refresh();
      return { ok: true as const, recipe };
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
      if (existing.authorId !== user.id) {
        return {
          ok: false as const,
          error: 'Solo el autor puede editar esta receta.',
        };
      }

      const validated = validateRecipeInput(input, input.id);
      if (!validated.ok) {
        return validated;
      }

      const recipe = await updateRecipeInStore({
        ...existing,
        ...validated.data,
        updatedAt: new Date().toISOString(),
      });

      await syncRecipeGroupLinks(
        recipe.id,
        existing.groupIds ?? [],
        recipe.groupIds ?? []
      );
      await refresh();
      return { ok: true as const, recipe };
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
      if (existing.authorId !== user.id) {
        return {
          ok: false as const,
          error: 'Solo el autor puede borrar esta receta.',
        };
      }

      try {
        await deleteRecipeById(id);
        await unlinkRecipesFromAllGroups([id]);
        await refresh();
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: 'No se pudo borrar la receta.' };
      }
    },
    [user, recipes, refresh]
  );

  const getAuthorName = useCallback(
    (authorId: string) => {
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
