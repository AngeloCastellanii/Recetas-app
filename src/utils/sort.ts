export function sortByNameAsc<T extends { name?: string; title?: string }>(
  items: T[],
  field: 'name' | 'title' = 'name'
): T[] {
  return [...items].sort((a, b) => {
    const left = (field === 'title' ? a.title : a.name) ?? '';
    const right = (field === 'title' ? b.title : b.name) ?? '';
    return left.localeCompare(right, 'es', { sensitivity: 'base' });
  });
}
