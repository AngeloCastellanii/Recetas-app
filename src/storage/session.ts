import { STORAGE_KEYS } from '@/storage/keys';
import { readJson, writeJson } from '@/storage/json-store';

/** Legacy local session shape (ya no se usa con Supabase Auth). */
type LegacySession = {
  userId: string;
};

export async function getSession(): Promise<LegacySession | null> {
  const session = await readJson<LegacySession | null>(STORAGE_KEYS.session, null);
  if (!session?.userId) {
    return null;
  }
  return session;
}

export async function setSession(session: LegacySession): Promise<void> {
  await writeJson(STORAGE_KEYS.session, session);
}

export async function clearSession(): Promise<void> {
  await writeJson(STORAGE_KEYS.session, null);
}
