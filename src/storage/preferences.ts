import type { AppPreferences, ThemePreference } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import { readJson, writeJson } from '@/storage/json-store';

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'dark',
  onboardingDone: false,
  demoSeeded: false,
  demoSeedVersion: 0,
  favoritesByUser: {},
};

function normalizeTheme(value: unknown): ThemePreference {
  if (value === 'light') {
    return 'light';
  }
  return 'dark';
}

export async function getPreferences(): Promise<AppPreferences> {
  const prefs = await readJson<Partial<AppPreferences> | null>(
    STORAGE_KEYS.preferences,
    null
  );

  return {
    theme: normalizeTheme(prefs?.theme),
    onboardingDone: Boolean(prefs?.onboardingDone),
    demoSeeded: Boolean(prefs?.demoSeeded),
    demoSeedVersion:
      typeof prefs?.demoSeedVersion === 'number' ? prefs.demoSeedVersion : 0,
    favoritesByUser:
      prefs?.favoritesByUser && typeof prefs.favoritesByUser === 'object'
        ? prefs.favoritesByUser
        : {},
  };
}

export async function savePreferences(prefs: AppPreferences): Promise<void> {
  await writeJson(STORAGE_KEYS.preferences, prefs);
}

export async function setThemePreference(theme: ThemePreference): Promise<AppPreferences> {
  const current = await getPreferences();
  const next = { ...current, theme: normalizeTheme(theme) };
  await savePreferences(next);
  return next;
}

export async function setOnboardingDone(): Promise<AppPreferences> {
  const current = await getPreferences();
  const next = { ...current, onboardingDone: true };
  await savePreferences(next);
  return next;
}

export async function setDemoSeeded(version?: number): Promise<AppPreferences> {
  const current = await getPreferences();
  const next = {
    ...current,
    demoSeeded: true,
    demoSeedVersion:
      typeof version === 'number' ? version : current.demoSeedVersion,
  };
  await savePreferences(next);
  return next;
}

export async function toggleFavorite(
  userId: string,
  recipeId: string
): Promise<{ preferences: AppPreferences; isFavorite: boolean }> {
  const current = await getPreferences();
  const list = new Set(current.favoritesByUser[userId] ?? []);
  if (list.has(recipeId)) {
    list.delete(recipeId);
  } else {
    list.add(recipeId);
  }
  const next: AppPreferences = {
    ...current,
    favoritesByUser: {
      ...current.favoritesByUser,
      [userId]: Array.from(list),
    },
  };
  await savePreferences(next);
  return { preferences: next, isFavorite: list.has(recipeId) };
}
