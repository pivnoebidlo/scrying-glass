// Порядок плиток (модуль order): сначала то, что мастер расставил, в его порядке, затем остальное (новые файлы)
// в обычном порядке. Пропавшие из группы id просто пропускаются.
export function applyOrder<T>(items: T[], id: (x: T) => string, saved: string[] | undefined): T[] {
  if (!saved?.length) return items;
  const rank = new Map(saved.map((x, i) => [x, i]));
  const placed = items.filter((x) => rank.has(id(x))).sort((a, b) => rank.get(id(a))! - rank.get(id(b))!);
  return [...placed, ...items.filter((x) => !rank.has(id(x)))];
}

// Переставить: dragged встаёт перед target (after — после него).
export function moveId(ids: string[], dragged: string, target: string, after: boolean): string[] {
  const rest = ids.filter((x) => x !== dragged);
  const i = rest.indexOf(target);
  if (i < 0) return ids;
  rest.splice(after ? i + 1 : i, 0, dragged);
  return rest;
}
