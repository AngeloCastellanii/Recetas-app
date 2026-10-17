import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppPreferences, ThemePreference } from '@/types';
import {
  getPreferences,
  seedDemoDataIfNeeded,
  setOnboardingDone as persistOnboardingDone,
  setThemePreference,
  toggleFavorite as toggleFavoriteInStore,
} from '@/storage';

type PreferencesContextValue = {
  preferences: AppPreferences;
  isLoading: boolean;
  resolvedScheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  isFavorite: (userId: string, recipeId: string) => boolean;
  toggleFavorite: (
    userId: string,
    recipeId: string
  ) => Promise<{ ok: true; isFavorite: boolean } | { ok: false; error: string }>;
  refreshPreferences: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: 'dark',
    onboardingDone: false,
    demoSeeded: false,
    demoSeedVersion: 0,
    favoritesByUser: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshPreferences = useCallback(async () => {
    const next = await getPreferences();
    setPreferences(next);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshPreferences();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshPreferences]);

  const resolvedScheme: 'light' | 'dark' = preferences.theme;

  const setTheme = useCallback(async (theme: ThemePreference) => {
    const next = await setThemePreference(theme);
    setPreferences(next);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await seedDemoDataIfNeeded();
    const next = await persistOnboardingDone();
    setPreferences(next);
  }, []);

  const isFavorite = useCallback(
    (userId: string, recipeId: string) => {
      if (!userId || !recipeId) {
        return false;
      }
      return (preferences.favoritesByUser[userId] ?? []).includes(recipeId);
    },
    [preferences.favoritesByUser]
  );

  const toggleFavorite = useCallback(
    async (userId: string, recipeId: string) => {
      if (!userId || !recipeId) {
        return { ok: false as const, error: 'No se pudo actualizar el favorito.' };
      }
      try {
        const result = await toggleFavoriteInStore(userId, recipeId);
        setPreferences(result.preferences);
        return { ok: true as const, isFavorite: result.isFavorite };
      } catch {
        return { ok: false as const, error: 'No se pudo actualizar el favorito.' };
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      preferences,
      isLoading,
      resolvedScheme,
      setTheme,
      completeOnboarding,
      isFavorite,
      toggleFavorite,
      refreshPreferences,
    }),
    [
      preferences,
      isLoading,
      resolvedScheme,
      setTheme,
      completeOnboarding,
      isFavorite,
      toggleFavorite,
      refreshPreferences,
    ]
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences debe usarse dentro de PreferencesProvider.');
  }
  return context;
}
