import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ensureProfile, fetchProfile, updateProfileRow } from '@/services/api';
import type { User } from '@/types';
import { mapAuthError } from '@/utils/auth-errors';
import { normalizeText } from '@/utils/normalize';
import {
  validateEmail,
  validateName,
  validatePassword,
} from '@/utils/validation';

/** Evita ráfagas de login/registro que disparan rate limit de Supabase. */
let authInFlight = false;
let authCooldownUntil = 0;

function beginAuthRequest(): { ok: true } | { ok: false; error: string } {
  const now = Date.now();
  if (now < authCooldownUntil) {
    const seconds = Math.max(1, Math.ceil((authCooldownUntil - now) / 1000));
    return {
      ok: false,
      error: `Espera ${seconds}s antes de intentar de nuevo.`,
    };
  }
  if (authInFlight) {
    return {
      ok: false,
      error: 'Ya hay un intento en curso. Espera un momento.',
    };
  }
  authInFlight = true;
  return { ok: true };
}

function endAuthRequest(failed: boolean) {
  authInFlight = false;
  if (failed) {
    authCooldownUntil = Date.now() + 2500;
  }
}

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  login: (input: {
    email: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (input: {
    name: string;
    email: string;
    password?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteAccount: () => Promise<{ ok: true } | { ok: false; error: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function configError() {
  return {
    ok: false as const,
    error:
      'Supabase no está configurado. Crea un archivo .env con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;
    if (!sessionUser) {
      setUser(null);
      return;
    }

    let profile = await fetchProfile(sessionUser.id);
    if (!profile) {
      profile = await ensureProfile({
        id: sessionUser.id,
        name:
          (sessionUser.user_metadata?.name as string | undefined) ||
          sessionUser.email?.split('@')[0] ||
          'Usuario',
        email: sessionUser.email ?? '',
      });
    }
    setUser(profile);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await refreshUser();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refreshUser();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      if (!isSupabaseConfigured) {
        return configError();
      }

      const gate = beginAuthRequest();
      if (!gate.ok) {
        return { ok: false as const, error: gate.error };
      }

      const nameCheck = validateName(input.name);
      if (!nameCheck.ok) {
        endAuthRequest(false);
        return { ok: false as const, error: nameCheck.error ?? 'Nombre inválido.' };
      }

      const emailCheck = validateEmail(input.email);
      if (!emailCheck.ok) {
        endAuthRequest(false);
        return { ok: false as const, error: emailCheck.error ?? 'Correo inválido.' };
      }

      const passwordCheck = validatePassword(input.password);
      if (!passwordCheck.ok) {
        endAuthRequest(false);
        return {
          ok: false as const,
          error: passwordCheck.error ?? 'Contraseña inválida.',
        };
      }

      const email = normalizeText(input.email).toLowerCase();
      const name = normalizeText(input.name);

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: input.password,
          options: { data: { name } },
        });

        if (error) {
          endAuthRequest(true);
          return { ok: false as const, error: mapAuthError(error) };
        }

        if (!data.user) {
          endAuthRequest(true);
          return {
            ok: false as const,
            error:
              'Revisa tu correo para confirmar la cuenta, o desactiva Confirm email en Supabase.',
          };
        }

        const profile = await ensureProfile({
          id: data.user.id,
          name,
          email,
        });
        setUser(profile);
        endAuthRequest(false);
        return { ok: true as const };
      } catch (err) {
        endAuthRequest(true);
        return { ok: false as const, error: mapAuthError(err) };
      }
    },
    []
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      if (!isSupabaseConfigured) {
        return configError();
      }

      const gate = beginAuthRequest();
      if (!gate.ok) {
        return { ok: false as const, error: gate.error };
      }

      const emailCheck = validateEmail(input.email);
      if (!emailCheck.ok) {
        endAuthRequest(false);
        return { ok: false as const, error: emailCheck.error ?? 'Correo inválido.' };
      }

      const passwordCheck = validatePassword(input.password);
      if (!passwordCheck.ok) {
        endAuthRequest(false);
        return {
          ok: false as const,
          error: passwordCheck.error ?? 'Contraseña inválida.',
        };
      }

      const email = normalizeText(input.email).toLowerCase();
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: input.password,
        });

        if (error) {
          endAuthRequest(true);
          return { ok: false as const, error: mapAuthError(error) };
        }

        await refreshUser();
        endAuthRequest(false);
        return { ok: true as const };
      } catch (err) {
        endAuthRequest(true);
        return { ok: false as const, error: mapAuthError(err) };
      }
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (input: { name: string; email: string; password?: string }) => {
      if (!isSupabaseConfigured) {
        return configError();
      }
      if (!user) {
        return { ok: false as const, error: 'No hay sesión activa.' };
      }

      const nameCheck = validateName(input.name);
      if (!nameCheck.ok) {
        return { ok: false as const, error: nameCheck.error ?? 'Nombre inválido.' };
      }

      const emailCheck = validateEmail(input.email);
      if (!emailCheck.ok) {
        return { ok: false as const, error: emailCheck.error ?? 'Correo inválido.' };
      }

      const email = normalizeText(input.email).toLowerCase();
      const name = normalizeText(input.name);

      if (email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) {
          return { ok: false as const, error: error.message };
        }
      }

      if (input.password && input.password.length > 0) {
        const passwordCheck = validatePassword(input.password);
        if (!passwordCheck.ok) {
          return {
            ok: false as const,
            error: passwordCheck.error ?? 'Contraseña inválida.',
          };
        }
        const { error } = await supabase.auth.updateUser({
          password: input.password,
        });
        if (error) {
          return { ok: false as const, error: error.message };
        }
      }

      const result = await updateProfileRow({ id: user.id, name, email });
      if (!result.ok) {
        return result;
      }
      setUser(result.user);
      return { ok: true as const };
    },
    [user]
  );

  const deleteAccount = useCallback(async () => {
    if (!user) {
      return { ok: false as const, error: 'No hay sesión activa.' };
    }

    // Borra datos del usuario; la cuenta auth requiere service role o Edge Function.
    // Eliminamos recetas/grupos propios y cerramos sesión.
    await supabase.from('recipes').delete().eq('author_id', user.id);
    await supabase.from('groups').delete().eq('owner_id', user.id);
    await supabase.auth.signOut();
    setUser(null);
    return { ok: true as const };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      register,
      login,
      logout,
      refreshUser,
      updateProfile,
      deleteAccount,
    }),
    [
      user,
      isLoading,
      register,
      login,
      logout,
      refreshUser,
      updateProfile,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return context;
}
