// Приключения: какие папки первого уровня — приключения и какое из них сейчас открыто.
// Остальные модули фильтруют по нему то, что показывают (см. shared/adventures.ts).
import * as fs from 'node:fs';
import { defineModule, type ModuleContext } from '../../shared/module';
import { isSupplement, looksLikeAdventure, withRecent, missingFolders, SUPPLEMENT_KINDS, type AdventuresState, type SupplementKind } from '../../shared/adventures';

const initialState: AdventuresState = { list: [], current: null, initialized: false, systems: {} };

// Убирает из списка папки, которых больше нет; при первом открытии хранилища угадывает приключения.
function sync(s: AdventuresState, ctx: ModuleContext): AdventuresState {
  const tree = ctx.vault.tree;
  if (!tree) return s;
  const top = tree.folders.map((f) => f.path);
  let list = s.list.filter((p) => top.includes(p));
  if (!s.initialized) list = tree.folders.filter(looksLikeAdventure).map((f) => f.path);
  const current = s.current !== null && list.includes(s.current) ? s.current : (list[0] ?? null);
  const same = list.length === s.list.length && list.every((p, i) => p === s.list[i]) && current === s.current;
  if (same && s.initialized) return s;
  return { ...s, list, current, initialized: true, ...kept(s, list) };
}

// Supplements, the supplements adventures use and the recent list — of the folders still on the list.
function kept(s: AdventuresState, list: string[]): Pick<AdventuresState, 'supplements' | 'uses' | 'recent'> {
  const on = (a: string) => list.includes(a);
  return {
    recent: s.recent?.filter(on),
    supplements: s.supplements && Object.fromEntries(Object.entries(s.supplements).filter(([a]) => on(a))),
    uses: s.uses && Object.fromEntries(Object.entries(s.uses).filter(([a]) => on(a)).map(([a, b]) => [a, b.filter(on)])),
  };
}

// Создаёт недостающие стандартные папки во всех приключениях. true — что-то создано.
function ensure(s: AdventuresState, ctx: ModuleContext): boolean {
  let created = false;
  for (const a of s.list) {
    const folder = ctx.vault.tree?.folders.find((f) => f.path === a);
    const dir = ctx.vault.resolve(a);
    if (!folder || !dir) continue;
    for (const name of missingFolders(folder, isSupplement(s, a))) {
      fs.mkdirSync(`${dir}/${name}`, { recursive: true });
      created = true;
    }
  }
  return created;
}

export default defineModule({
  id: 'adventures',
  persist: true,
  initialState,

  init: sync,
  onTreeChange: sync,

  actions: {
    select(s, { path }: { path: string | null }) {
      return path === null || s.list.includes(path) ? { ...s, current: path, recent: withRecent(s, path) } : s;
    },

    // Отметить папку первого уровня как приключение (и создать в ней стандартные папки).
    mark(s, { path, supplement }: { path: string; supplement?: SupplementKind }, ctx) {
      if (s.list.includes(path) || path.includes('/')) return s;
      const next = {
        ...s,
        list: [...s.list, path].sort((a, b) => a.localeCompare(b, 'ru')),
        current: path,
        ...(supplement ? { supplements: { ...s.supplements, [path]: supplement } } : {}),
      };
      next.recent = withRecent(next, path);
      if (ensure(next, ctx)) ctx.vault.rescan();
      return next;
    },

    // Больше не приключение: папка остаётся как есть, просто её содержимое станет «общим».
    unmark(s, { path }: { path: string }) {
      const list = s.list.filter((p) => p !== path);
      return { ...s, list, current: s.current === path ? (list[0] ?? null) : s.current, ...kept(s, list) };
    },

    // Ролевая система приключения (path: null — всего хранилища и общего).
    setSystem(s, { path, system }: { path: string | null; system: string }) {
      return { ...s, systems: { ...s.systems, [path ?? '']: system } };
    },

    // Новое приключение: папка со стандартными подпапками. Название с «/» и подобным не годится.
    // system — его ролевая система (нет — как у хранилища).
    create(s, { name, system, supplement }: { name: string; system?: string; supplement?: SupplementKind }, ctx) {
      const clean = name.replace(/[/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
      const dir = clean && !clean.startsWith('.') ? ctx.vault.resolve(clean) : null;
      if (!dir) return s;
      fs.mkdirSync(dir, { recursive: true });
      ctx.vault.rescan();
      const next = {
        ...s,
        list: [...new Set([...s.list, clean])].sort((a, b) => a.localeCompare(b, 'ru')),
        current: clean,
        systems: system ? { ...s.systems, [clean]: system } : s.systems,
        ...(supplement ? { supplements: { ...s.supplements, [clean]: supplement } } : {}),
      };
      next.recent = withRecent(next, clean);
      ensure(next, ctx);
      ctx.vault.rescan();
      return next;
    },

    // The supplements an adventure uses (their cards and entries are seen in it).
    setUses(s, { adventure, supplements }: { adventure: string; supplements: string[] }) {
      const list = supplements.filter((b) => isSupplement(s, b) && b !== adventure && !isSupplement(s, adventure));
      const uses = { ...s.uses };
      if (list.length) uses[adventure] = list;
      else delete uses[adventure];
      return { ...s, uses };
    },

    // What a supplement is about.
    setSupplementKind(s, { path, kind }: { path: string; kind: SupplementKind }) {
      if (!isSupplement(s, path) || !SUPPLEMENT_KINDS.includes(kind)) return s;
      return { ...s, supplements: { ...s.supplements, [path]: kind } };
    },

    // Проверка при открытии хранилища: в каждом приключении есть все стандартные папки.
    ensureFolders(s, _: void, ctx) {
      if (ensure(s, ctx)) ctx.vault.rescan();
      return s;
    },
  },
});
