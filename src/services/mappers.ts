import type { Group, Recipe, User } from '@/types';

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

type RecipeRow = {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[] | null;
  steps: string[] | null;
  author_id: string;
  prep_time_minutes: number | null;
  servings: number | null;
  image_url: string | null;
  is_courtesy: boolean | null;
  created_at: string;
  updated_at: string;
};

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_courtesy: boolean | null;
  created_at: string;
  updated_at: string;
};

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRecipe(row: RecipeRow, groupIds: string[] = []): Recipe {
  return {
    id: row.id,
    title: row.title ?? '',
    description: row.description ?? '',
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    steps: Array.isArray(row.steps) ? row.steps : [],
    authorId: row.author_id,
    groupIds,
    prepTimeMinutes:
      typeof row.prep_time_minutes === 'number' ? row.prep_time_minutes : null,
    servings: typeof row.servings === 'number' ? row.servings : null,
    imageUri: row.image_url ?? null,
    isCourtesy: Boolean(row.is_courtesy),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGroup(row: GroupRow, recipeIds: string[] = []): Group {
  return {
    id: row.id,
    name: row.name ?? '',
    description: row.description ?? '',
    ownerId: row.owner_id,
    recipeIds,
    isCourtesy: Boolean(row.is_courtesy),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
