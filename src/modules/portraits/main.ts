// Портреты NPC: библиотека (вручную добавленные + из подключённых папок) и то, что сейчас на экране.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MessageBoxOptions, OpenDialogOptions } from 'electron';
import { defineModule, type ModuleContext } from '../../shared/module';
import { IMAGE_EXT, findCharactersDir, findAdventures, listImages, prettyName } from './scan';
import { isFromFolder, type FolderPortrait, type ManualPortrait, type PortraitGroup, type PortraitsState } from './types';

// Диалоги: с родительским окном, если оно есть.
const openDialog = (ctx: ModuleContext, opts: OpenDialogOptions) =>
  ctx.controlWindow ? ctx.dialog.showOpenDialog(ctx.controlWindow, opts) : ctx.dialog.showOpenDialog(opts);
const messageBox = (ctx: ModuleContext, opts: MessageBoxOptions) =>
  ctx.controlWindow ? ctx.dialog.showMessageBox(ctx.controlWindow, opts) : ctx.dialog.showMessageBox(opts);

// Где обычно лежат приключения: папка Adventures рядом с приложением.
function guessDefaultDir(appRoot: string): string | undefined {
  for (const name of ['Adventures', 'adventures']) {
    const p = path.join(appRoot, name);
    try { if (fs.statSync(p).isDirectory()) return p; } catch { /* нет такой */ }
  }
  return undefined;
}

// Приводит список персонажей группы в соответствие с папкой на диске.
// Уже известные файлы сохраняют свои id и имена. Новые добавляются, пропавшие убираются.
function syncGroup(s: PortraitsState, group: PortraitGroup): { state: PortraitsState; missing: boolean } {
  const charsDir = findCharactersDir(group.path);
  if (!charsDir) return { state: s, missing: true };

  const known = new Map(
    s.library.filter((p): p is FolderPortrait => isFromFolder(p) && p.groupId === group.id).map((p) => [p.path, p])
  );
  const items = listImages(charsDir).map(
    (file): FolderPortrait => known.get(file) || { id: randomUUID(), groupId: group.id, path: file, name: prettyName(file) }
  );
  const library = [...s.library.filter((p) => !isFromFolder(p) || p.groupId !== group.id), ...items];
  const alive = new Set(library.map((p) => p.id));
  return { state: { ...s, library, onScreen: s.onScreen.filter((id) => alive.has(id)) }, missing: false };
}

const initialState: PortraitsState = { library: [], groups: [], onScreen: [], showNames: true };

export default defineModule({
  id: 'portraits',
  persist: true,
  initialState,

  // При запуске подтягиваем изменения в подключённых папках.
  init(s) {
    let next = s;
    for (const g of s.groups) next = syncGroup(next, g).state;
    return next;
  },

  resolveAsset(s, id, ctx) {
    const p = s.library.find((x) => x.id === id);
    if (!p) return null;
    return isFromFolder(p) ? p.path : path.join(ctx.assetsDir, path.basename(p.file));
  },

  actions: {
    // Подключение папки приключения (или папки со многими приключениями).
    async addFolder(s, _: void, ctx) {
      const res = await openDialog(ctx, {
          title: 'Выберите папку приключения (или папку, в которой лежат приключения)',
          properties: ['openDirectory'],
          defaultPath: guessDefaultDir(ctx.appRoot),
      });
      if (res.canceled || !res.filePaths[0]) return s;

      const dirs = findAdventures(res.filePaths[0]);
      if (dirs.length === 0) {
        await messageBox(ctx, {
            type: 'info',
            message: 'В выбранной папке не найдена папка characters',
            detail: 'Ожидается структура: <приключение>/characters/картинки. Можно выбрать одну папку приключения или папку, внутри которой лежат несколько приключений.',
            buttons: ['OK'],
        });
        return s;
      }

      let next = s;
      for (const dir of dirs) {
        let group = next.groups.find((g) => g.path === dir);
        if (!group) {
          group = { id: randomUUID(), name: path.basename(dir).normalize('NFC'), path: dir };
          next = { ...next, groups: [...next.groups, group] };
        }
        next = syncGroup(next, group).state;
      }
      return next;
    },

    async rescanGroup(s, { groupId }: { groupId: string }, ctx) {
      const group = s.groups.find((g) => g.id === groupId);
      if (!group) return s;
      const res = syncGroup(s, group);
      if (res.missing) {
        await messageBox(ctx, {
            type: 'warning',
            message: `Не удалось найти папку characters в «${group.name}»`,
            detail: `Путь: ${group.path}\nВозможно, папку переместили или переименовали. Подключите её заново.`,
            buttons: ['OK'],
        });
        return s;
      }
      return res.state;
    },

    // Отключение папки: файлы на диске не трогаем, убираем только из библиотеки.
    removeGroup(s, { groupId }: { groupId: string }) {
      const library = s.library.filter((p) => !isFromFolder(p) || p.groupId !== groupId);
      const alive = new Set(library.map((p) => p.id));
      return {
        ...s,
        groups: s.groups.filter((g) => g.id !== groupId),
        library,
        onScreen: s.onScreen.filter((id) => alive.has(id)),
      };
    },

    // Отдельные картинки вручную: копируются в папку кампании.
    async add(s, _: void, ctx) {
      const res = await openDialog(ctx, {
          properties: ['openFile', 'multiSelections'],
          filters: [{ name: 'Изображения', extensions: [...IMAGE_EXT].map((e) => e.slice(1)) }],
      });
      if (res.canceled) return s;

      const added: ManualPortrait[] = [];
      for (const src of res.filePaths) {
        const id = randomUUID();
        const file = id + path.extname(src).toLowerCase();
        await fs.promises.copyFile(src, path.join(ctx.assetsDir, file));
        added.push({ id, file, name: prettyName(src) });
      }
      return { ...s, library: [...s.library, ...added] };
    },

    rename(s, { id, name }: { id: string; name: string }) {
      return { ...s, library: s.library.map((p) => (p.id === id ? { ...p, name } : p)) };
    },

    // Удаляются только вручную добавленные картинки (их копии). Файлы из папок не затрагиваются.
    remove(s, { id }: { id: string }, ctx) {
      const p = s.library.find((x) => x.id === id);
      if (!p || isFromFolder(p)) return s;
      fs.promises.unlink(path.join(ctx.assetsDir, path.basename(p.file))).catch(() => {});
      return {
        ...s,
        library: s.library.filter((x) => x.id !== id),
        onScreen: s.onScreen.filter((x) => x !== id),
      };
    },

    toggle(s, { id }: { id: string }) {
      const on = s.onScreen.includes(id);
      return { ...s, onScreen: on ? s.onScreen.filter((x) => x !== id) : [...s.onScreen, id] };
    },

    clearScreen(s) {
      return { ...s, onScreen: [] };
    },

    setShowNames(s, { value }: { value: boolean }) {
      return { ...s, showNames: value };
    },
  },
});
