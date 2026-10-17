import type { Session } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import { readJson, removeKey, writeJson } from '@/storage/json-store';

export async function getSession(): Promise<Session | null> {
  const session = await readJson<Session | null>(STORAGE_KEYS.session, null);
  if (!session || typeof session.userId !== 'string' || !session.userId) {
    return null;
  }
  return session;
}

export async function setSession(session: Session): Promise<void> {
  await writeJson(STORAGE_KEYS.session, session);
}

export async function clearSession(): Promise<void> {
  await removeKey(STORAGE_KEYS.session);
}
