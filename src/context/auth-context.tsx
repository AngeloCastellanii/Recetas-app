import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { User } from '@/types';
import {
  clearSession,
  createUser,
  findUserByEmail,
  findUserById,
  getSession,
  setSession,
  updateUser,
  deleteUserById,
} from '@/storage';
import { createId } from '@/utils/id';
import { normalizeText } from '@/utils/normalize';
import { hashPassword, verifyPassword } from '@/utils/password';
import {
  validateEmail,
  validateName,
  validatePassword,
} from '@/utils/validation';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      setUser(null);
      return;
    }
    const current = await findUserById(session.userId);
    if (!current) {
      await clearSession();
      setUser(null);
      return;
    }
    setUser(current);
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

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const nameCheck = validateName(input.name);
      if (!nameCheck.ok) {
        return { ok: false as const, error: nameCheck.error ?? 'Nombre inválido.' };
      }

      const emailCheck = validateEmail(input.email);
      if (!emailCheck.ok) {
        return { ok: false as const, error: emailCheck.error ?? 'Correo inválido.' };
      }

      const passwordCheck = validatePassword(input.password);
      if (!passwordCheck.ok) {
        return {
          ok: false as const,
          error: passwordCheck.error ?? 'Contraseña inválida.',
        };
      }

      const email = normalizeText(input.email).toLowerCase();
      const existing = await findUserByEmail(email);
      if (existing) {
        return { ok: false as const, error: 'Ya existe una cuenta con ese correo.' };
      }

      const now = new Date().toISOString();
      const created = await createUser({
        id: createId('user'),
        name: normalizeText(input.name),
        email,
        passwordHash: await hashPassword(input.password),
        createdAt: now,
        updatedAt: now,
      });

      await setSession({ userId: created.id });
      setUser(created);
      return { ok: true as const };
    },
    []
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const emailCheck = validateEmail(input.email);
      if (!emailCheck.ok) {
        return { ok: false as const, error: emailCheck.error ?? 'Correo inválido.' };
      }

      const passwordCheck = validatePassword(input.password);
      if (!passwordCheck.ok) {
        return {
          ok: false as const,
          error: passwordCheck.error ?? 'Contraseña inválida.',
        };
      }

      const email = normalizeText(input.email).toLowerCase();
      const existing = await findUserByEmail(email);
      if (!existing) {
        return { ok: false as const, error: 'Correo o contraseña incorrectos.' };
      }

      const valid = await verifyPassword(input.password, existing.passwordHash);
      if (!valid) {
        return { ok: false as const, error: 'Correo o contraseña incorrectos.' };
      }

      await setSession({ userId: existing.id });
      setUser(existing);
      return { ok: true as const };
    },
    []
  );

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (input: { name: string; email: string; password?: string }) => {
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
      const existing = await findUserByEmail(email);
      if (existing && existing.id !== user.id) {
        return { ok: false as const, error: 'Ese correo ya está en uso.' };
      }

      let passwordHash = user.passwordHash;
      if (input.password && input.password.length > 0) {
        const passwordCheck = validatePassword(input.password);
        if (!passwordCheck.ok) {
          return {
            ok: false as const,
            error: passwordCheck.error ?? 'Contraseña inválida.',
          };
        }
        passwordHash = await hashPassword(input.password);
      }

      const updated = await updateUser({
        ...user,
        name: normalizeText(input.name),
        email,
        passwordHash,
        updatedAt: new Date().toISOString(),
      });

      setUser(updated);
      return { ok: true as const };
    },
    [user]
  );

  const deleteAccount = useCallback(async () => {
    if (!user) {
      return { ok: false as const, error: 'No hay sesión activa.' };
    }

    try {
      await deleteUserById(user.id);
      await clearSession();
      setUser(null);
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: 'No se pudo borrar la cuenta.' };
    }
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
