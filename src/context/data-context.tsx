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
  deleteGroupById,
  getGroupsSorted,
  getRecipesSorted,
  isDuplicateGroupName,
  unlinkRecipeFromGroup as unlinkRecipeFromGroupInStore,
  updateGroup as updateGroupInStore,
} from '@/storage';
import { useAuth } from '@/context/auth-context';
import { createId } from '@/utils/id';
import { normalizeText } from '@/utils/normalize';
import {
  validateGroupDescription,
  validateGroupName,
} from '@/utils/validation';

type DataContextValue = {
  groups: Group[];
  recipes: Recipe[];
  isLoading: boolean;
  refresh: () => Promise<void>;
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
  getGroupById: (id: string) => Group | undefined;
  getRecipesForGroup: (groupId: string) => Recipe[];
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [nextGroups, nextRecipes] = await Promise.all([
      getGroupsSorted(),
      getRecipesSorted(),
    ]);
    setGroups(nextGroups);
    setRecipes(nextRecipes);
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

  const getGroupById = useCallback(
    (id: string) => groups.find((group) => group.id === id),
    [groups]
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

  const value = useMemo(
    () => ({
      groups,
      recipes,
      isLoading,
      refresh,
      createGroup,
      updateGroup,
      deleteGroup,
      unlinkRecipeFromGroup,
      getGroupById,
      getRecipesForGroup,
    }),
    [
      groups,
      recipes,
      isLoading,
      refresh,
      createGroup,
      updateGroup,
      deleteGroup,
      unlinkRecipeFromGroup,
      getGroupById,
      getRecipesForGroup,
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
