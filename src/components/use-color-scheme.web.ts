import { usePreferences } from '@/context/preferences-context';

export function useColorScheme(): 'light' | 'dark' {
  const { resolvedScheme } = usePreferences();
  return resolvedScheme;
}
