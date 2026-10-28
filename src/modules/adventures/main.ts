// Приключения: какие папки первого уровня — приключения и какое из них сейчас открыто.
// Остальные модули фильтруют по нему то, что показывают (см. shared/adventures.ts).
import * as fs from 'node:fs';
import { defineModule, type ModuleContext } from '../../shared/module';
import { isBestiary, looksLikeAdventure, missingFolders, type AdventuresState } from '../../shared/adventures';

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

// Bestiaries and the bestiaries adventures use — of the folders still on the list.
function kept(s: AdventuresState, list: string[]): Pick<AdventuresState, 'bestiaries' | 'uses'> {
  const on = (a: string) => list.includes(a);
  return {
    bestiaries: s.bestiaries?.filter(on),
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
    for (const name of missingFolders(folder, isBestiary(s, a))) {
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
      return path === null || s.list.includes(path) ? { ...s, current: path } : s;
    },

    // Отметить папку первого уровня как приключение (и создать в ней стандартные папки).
    mark(s, { path, bestiary }: { path: string; bestiary?: boolean }, ctx) {
      if (s.list.includes(path) || path.includes('/')) return s;
      const next = {
        ...s,
        list: [...s.list, path].sort((a, b) => a.localeCompare(b, 'ru')),
        current: path,
        ...(bestiary ? { bestiaries: [...new Set([...(s.bestiaries ?? []), path])] } : {}),
      };
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
    create(s, { name, system, bestiary }: { name: string; system?: string; bestiary?: boolean }, ctx) {
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
        ...(bestiary ? { bestiaries: [...new Set([...(s.bestiaries ?? []), clean])] } : {}),
      };
      ensure(next, ctx);
      ctx.vault.rescan();
      return next;
    },

    // The bestiaries an adventure uses (their cards are seen in it).
    setUses(s, { adventure, bestiaries }: { adventure: string; bestiaries: string[] }) {
      const list = bestiaries.filter((b) => isBestiary(s, b) && b !== adventure);
      const uses = { ...s.uses };
      if (list.length) uses[adventure] = list;
      else delete uses[adventure];
      return { ...s, uses };
    },

    // Проверка при открытии хранилища: в каждом приключении есть все стандартные папки.
    ensureFolders(s, _: void, ctx) {
      if (ensure(s, ctx)) ctx.vault.rescan();
      return s;
    },
  },
});
