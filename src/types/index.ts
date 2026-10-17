export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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
  createdAt: string;
  updatedAt: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  recipeIds: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  userId: string;
};
