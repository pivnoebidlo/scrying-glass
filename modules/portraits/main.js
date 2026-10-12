// Портреты NPC: библиотека (вручную добавленные + из подключённых папок) и то, что сейчас на экране.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { IMAGE_EXT, findCharactersDir, findAdventures, listImages, prettyName } = require('./scan');

// Аргументы для диалога: с родительским окном, если оно есть.
const withParent = (ctx, opts) => (ctx.controlWindow ? [ctx.controlWindow, opts] : [opts]);

// Где обычно лежат приключения: папка Adventures рядом с приложением.
function guessDefaultDir(appRoot) {
  for (const name of ['Adventures', 'adventures']) {
    const p = path.join(appRoot, name);
    try { if (fs.statSync(p).isDirectory()) return p; } catch (_) { /* нет такой */ }
  }
  return undefined;
}

// Приводит список персонажей группы в соответствие с папкой на диске.
// Уже известные файлы сохраняют свои id и имена. Новые добавляются, пропавшие убираются.
function syncGroup(s, group) {
  const charsDir = findCharactersDir(group.path);
  if (!charsDir) return { state: s, missing: true };

  const known = new Map(s.library.filter((p) => p.groupId === group.id).map((p) => [p.path, p]));
  const items = listImages(charsDir).map(
    (file) => known.get(file) || { id: crypto.randomUUID(), groupId: group.id, path: file, name: prettyName(file) }
  );
  const library = [...s.library.filter((p) => p.groupId !== group.id), ...items];
  const alive = new Set(library.map((p) => p.id));
  return { state: { ...s, library, onScreen: s.onScreen.filter((id) => alive.has(id)) }, missing: false };
}

module.exports = {
  id: 'portraits',
  persist: true,
  initialState: { library: [], groups: [], onScreen: [], showNames: true },

  // При запуске подтягиваем изменения в подключённых папках.
  init(s) {
    let next = s;
    for (const g of s.groups) next = syncGroup(next, g).state;
    return next;
  },

  // Где лежит файл картинки (для протокола sg-asset).
  resolveAsset(s, id, ctx) {
    const p = s.library.find((x) => x.id === id);
    if (!p) return null;
    return p.path || path.join(ctx.assetsDir, path.basename(p.file));
  },

  actions: {
    // Подключение папки приключения (или папки со многими приключениями).
    async addFolder(s, _payload, ctx) {
      const res = await ctx.dialog.showOpenDialog(
        ...withParent(ctx, {
          title: 'Выберите папку приключения (или папку, в которой лежат приключения)',
          properties: ['openDirectory'],
          defaultPath: guessDefaultDir(ctx.appRoot),
        })
      );
      if (res.canceled || !res.filePaths.length) return s;

      const dirs = findAdventures(res.filePaths[0]);
      if (dirs.length === 0) {
        await ctx.dialog.showMessageBox(
          ...withParent(ctx, {
            type: 'info',
            message: 'В выбранной папке не найдена папка characters',
            detail: 'Ожидается структура: <приключение>/characters/картинки. Можно выбрать одну папку приключения или папку, внутри которой лежат несколько приключений.',
            buttons: ['OK'],
          })
        );
        return s;
      }

      let next = s;
      for (const dir of dirs) {
        let group = next.groups.find((g) => g.path === dir);
        if (!group) {
          group = { id: crypto.randomUUID(), name: path.basename(dir).normalize('NFC'), path: dir };
          next = { ...next, groups: [...next.groups, group] };
        }
        next = syncGroup(next, group).state;
      }
      return next;
    },

    async rescanGroup(s, { groupId }, ctx) {
      const group = s.groups.find((g) => g.id === groupId);
      if (!group) return s;
      const res = syncGroup(s, group);
      if (res.missing) {
        await ctx.dialog.showMessageBox(
          ...withParent(ctx, {
            type: 'warning',
            message: `Не удалось найти папку characters в «${group.name}»`,
            detail: `Путь: ${group.path}\nВозможно, папку переместили или переименовали. Подключите её заново.`,
            buttons: ['OK'],
          })
        );
        return s;
      }
      return res.state;
    },

    // Отключение папки: файлы на диске не трогаем, убираем только из библиотеки.
    removeGroup(s, { groupId }) {
      const library = s.library.filter((p) => p.groupId !== groupId);
      const alive = new Set(library.map((p) => p.id));
      return {
        ...s,
        groups: s.groups.filter((g) => g.id !== groupId),
        library,
        onScreen: s.onScreen.filter((id) => alive.has(id)),
      };
    },

    // Отдельные картинки вручную: копируются в папку кампании.
    async add(s, _payload, ctx) {
      const res = await ctx.dialog.showOpenDialog(
        ...withParent(ctx, {
          properties: ['openFile', 'multiSelections'],
          filters: [{ name: 'Изображения', extensions: [...IMAGE_EXT].map((e) => e.slice(1)) }],
        })
      );
      if (res.canceled) return s;

      const added = [];
      for (const src of res.filePaths) {
        const id = crypto.randomUUID();
        const ext = path.extname(src).toLowerCase();
        const file = id + ext;
        await fs.promises.copyFile(src, path.join(ctx.assetsDir, file));
        added.push({ id, file, name: prettyName(src) });
      }
      return { ...s, library: [...s.library, ...added] };
    },

    rename(s, { id, name }) {
      return { ...s, library: s.library.map((p) => (p.id === id ? { ...p, name } : p)) };
    },

    // Удаляются только вручную добавленные картинки (их копии). Файлы из папок не затрагиваются.
    remove(s, { id }, ctx) {
      const p = s.library.find((x) => x.id === id);
      if (!p || p.path) return s;
      fs.promises.unlink(path.join(ctx.assetsDir, path.basename(p.file))).catch(() => {});
      return {
        ...s,
        library: s.library.filter((x) => x.id !== id),
        onScreen: s.onScreen.filter((x) => x !== id),
      };
    },

    toggle(s, { id }) {
      const on = s.onScreen.includes(id);
      return { ...s, onScreen: on ? s.onScreen.filter((x) => x !== id) : [...s.onScreen, id] };
    },

    clearScreen(s) {
      return { ...s, onScreen: [] };
    },

    setShowNames(s, { value }) {
      return { ...s, showNames: !!value };
    },
  },
};
