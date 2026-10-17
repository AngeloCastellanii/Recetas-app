export const LIMITS = {
  name: { min: 2, max: 40 },
  email: { min: 5, max: 80 },
  password: { min: 6, max: 32 },
  recipeTitle: { min: 2, max: 60 },
  recipeDescription: { max: 500 },
  ingredient: { min: 1, max: 80 },
  step: { min: 1, max: 300 },
  groupName: { min: 2, max: 40 },
  groupDescription: { max: 200 },
  prepTimeMinutes: { min: 0, max: 9999 },
  servings: { min: 1, max: 999 },
} as const;
