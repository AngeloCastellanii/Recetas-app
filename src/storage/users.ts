import type { User } from '@/types';
import { STORAGE_KEYS } from '@/storage/keys';
import { readJson, writeJson } from '@/storage/json-store';
import { normalizeText } from '@/utils/normalize';

export async function getUsers(): Promise<User[]> {
  const users = await readJson<User[]>(STORAGE_KEYS.users, []);
  return Array.isArray(users) ? users : [];
}

export async function saveUsers(users: User[]): Promise<void> {
  await writeJson(STORAGE_KEYS.users, users);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const normalized = normalizeText(email).toLowerCase();
  const users = await getUsers();
  return users.find((user) => user.email === normalized) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function createUser(user: User): Promise<User> {
  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
  return user;
}

export async function updateUser(updated: User): Promise<User> {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === updated.id);
  if (index < 0) {
    throw new Error('Usuario no encontrado.');
  }
  users[index] = updated;
  await saveUsers(users);
  return updated;
}

export async function deleteUserById(id: string): Promise<void> {
  const users = await getUsers();
  await saveUsers(users.filter((user) => user.id !== id));
}
