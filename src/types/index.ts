export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type Recipe = {
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
  isCourtesy: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  recipeIds: string[];
  ownerId: string;
  isCourtesy: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ThemePreference = 'light' | 'dark';

export type AppPreferences = {
  theme: ThemePreference;
  onboardingDone: boolean;
  demoSeeded: boolean;
  /** Incrementar cuando se amplíe el catálogo demo para reinyectar recetas nuevas. */
  demoSeedVersion: number;
  favoritesByUser: Record<string, string[]>;
};

export type FieldErrors = Record<string, string>;
