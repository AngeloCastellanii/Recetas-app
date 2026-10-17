export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeKey(value: string): string {
  return normalizeText(value).toLocaleLowerCase('es');
}
