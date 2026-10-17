import { LIMITS } from '@/constants/limits';
import { normalizeKey, normalizeText } from '@/utils/normalize';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationResult = {
  ok: boolean;
  error?: string;
};

export function validateName(value: string): ValidationResult {
  const name = normalizeText(value);
  if (name.length < LIMITS.name.min) {
    return { ok: false, error: `El nombre debe tener al menos ${LIMITS.name.min} caracteres.` };
  }
  if (name.length > LIMITS.name.max) {
    return { ok: false, error: `El nombre no puede superar ${LIMITS.name.max} caracteres.` };
  }
  return { ok: true };
}

export function validateEmail(value: string): ValidationResult {
  const email = normalizeText(value).toLowerCase();
  if (email.length < LIMITS.email.min || email.length > LIMITS.email.max) {
    return {
      ok: false,
      error: `El correo debe tener entre ${LIMITS.email.min} y ${LIMITS.email.max} caracteres.`,
    };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'Ingresa un correo válido.' };
  }
  return { ok: true };
}

export function validatePassword(value: string): ValidationResult {
  if (value.length < LIMITS.password.min) {
    return {
      ok: false,
      error: `La contraseña debe tener al menos ${LIMITS.password.min} caracteres.`,
    };
  }
  if (value.length > LIMITS.password.max) {
    return {
      ok: false,
      error: `La contraseña no puede superar ${LIMITS.password.max} caracteres.`,
    };
  }
  return { ok: true };
}

export function validateRecipeTitle(value: string): ValidationResult {
  const title = normalizeText(value);
  if (title.length < LIMITS.recipeTitle.min) {
    return {
      ok: false,
      error: `El título debe tener al menos ${LIMITS.recipeTitle.min} caracteres.`,
    };
  }
  if (title.length > LIMITS.recipeTitle.max) {
    return {
      ok: false,
      error: `El título no puede superar ${LIMITS.recipeTitle.max} caracteres.`,
    };
  }
  return { ok: true };
}

export function isSameTitle(a: string, b: string): boolean {
  return normalizeKey(a) === normalizeKey(b);
}

export function validateGroupName(value: string): ValidationResult {
  const name = normalizeText(value);
  if (name.length < LIMITS.groupName.min) {
    return {
      ok: false,
      error: `El nombre debe tener al menos ${LIMITS.groupName.min} caracteres.`,
    };
  }
  if (name.length > LIMITS.groupName.max) {
    return {
      ok: false,
      error: `El nombre no puede superar ${LIMITS.groupName.max} caracteres.`,
    };
  }
  return { ok: true };
}

export function validateGroupDescription(value: string): ValidationResult {
  const description = normalizeText(value);
  if (description.length > LIMITS.groupDescription.max) {
    return {
      ok: false,
      error: `La descripción no puede superar ${LIMITS.groupDescription.max} caracteres.`,
    };
  }
  return { ok: true };
}
