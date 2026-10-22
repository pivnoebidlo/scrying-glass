// Хранилище: какая папка открыта и что в ней лежит. Само открытие, сканирование и наблюдение за
// изменениями делает ядро (ctx.vault), модуль только даёт окнам к этому доступ.
import { t } from '../../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { shell, type OpenDialogOptions } from 'electron';
import { defineModule, type ModuleContext } from '../../shared/module';
import type { LangSetting } from '../../shared/i18n/core';
import { AUDIO_EXT, DEFAULT_ROLES, IMAGE_EXT, roleAccepts, type FolderRole, type RoleNames, type ThemeSetting, type VaultState } from '../../shared/vault';
import { clipboardFiles, clipboardImage, freeName } from '../../main/files';
import { listCards } from '../../main/cards';
import { deleteWords, discard, trashSettings } from '../../main/trash';

const openDialog = (ctx: ModuleContext, opts: OpenDialogOptions) =>
  ctx.controlWindow ? ctx.dialog.showOpenDialog(ctx.controlWindow, opts) : ctx.dialog.showOpenDialog(opts);

const initialState: VaultState = { root: null, name: '', tree: null, recent: [], roles: DEFAULT_ROLES, systemsOff: [], language: 'auto', lang: 'en', theme: 'auto', hotkeys: {}, themesFound: [], themeBefore: 'auto' };

export default defineModule({
  id: 'vault',
  persist: false,
  initialState,

  actions: {
    // Выбрать папку хранилища в диалоге. Подойдёт любая, в том числе пустая.
    async choose(s, _: void, ctx) {
      const res = await openDialog(ctx, {
        title: t('vault.dlg.choose'),
        buttonLabel: t('vault.dlg.open'),
        properties: ['openDirectory', 'createDirectory'],
      });
      if (res.canceled || !res.filePaths[0]) return s;
      return ctx.vault.open(res.filePaths[0]);
    },

    open(_s, { root }: { root: string }, ctx) {
      return ctx.vault.open(root);
    },

    close(_s, _: void, ctx) {
      return ctx.vault.open(null);
    },

    forget(_s, { root }: { root: string }, ctx) {
      return ctx.vault.forget(root);
    },

    // Названия папок ролей (настройки приложения). null — вернуть названия по умолчанию.
    setRoles(_s, { roles }: { roles: Partial<RoleNames> | null }, ctx) {
      return ctx.vault.setRoles(roles);
    },

    // Отключённые ролевые системы (настройки приложения).
    setSystemsOff(_s, { list }: { list: string[] }, ctx) {
      return ctx.vault.setSystemsOff(list);
    },

    // The control window's colour theme (app settings).
    setTheme(_s, { theme }: { theme: ThemeSetting }, ctx) {
      return ctx.vault.setTheme(theme);
    },
    // The GM's own hotkeys (app settings): id → combo; null — all as by default.
    setHotkeys(_s, { map }: { map: Record<string, string> | null }, ctx) {
      return ctx.vault.setHotkeys(map);
    },
    // Interface language (app settings): 'auto' or a language.
    setLanguage(_s, { language }: { language: LangSetting }, ctx) {
      return ctx.vault.setLanguage(language);
    },

    // Скопировать файлы в папку хранилища. Существующие файлы не перезаписываются.
    async importFiles(s, { folder }: { folder: string }, ctx) {
      const dir = ctx.vault.resolve(folder);
      if (!dir) return s;
      const res = await openDialog(ctx, {
        title: t('vault.dlg.addFiles'),
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: t('vault.dlg.imagesAndMusic'), extensions: [...IMAGE_EXT, ...AUDIO_EXT].map((e) => e.slice(1)) },
        ],
      });
      if (res.canceled) return s;
      for (const src of res.filePaths) {
        await fs.promises.copyFile(src, path.join(dir, freeName(dir, path.basename(src))), fs.constants.COPYFILE_EXCL);
      }
      return ctx.vault.rescan();
    },

    // Вставить картинку из буфера обмена в папку хранилища (скриншот, картинка из браузера, файл из Finder).
    // Files dropped from Finder or Explorer onto a tab (renderer/control/FileDrop.svelte): copied into the folder,
    // under a free name; only pictures, sounds and PDFs (the window has already kept those the role takes).
    async addFiles(s, { folder, paths }: { folder: string; paths: string[] }, ctx) {
      const dir = ctx.vault.resolve(folder);
      if (!dir) return s;
      const ok = [...IMAGE_EXT, ...AUDIO_EXT, '.pdf'];
      for (const src of paths) {
        if (!ok.includes(path.extname(src).toLowerCase()) || !fs.statSync(src, { throwIfNoEntry: false })?.isFile()) continue;
        await fs.promises.copyFile(src, path.join(dir, freeName(dir, path.basename(src))), fs.constants.COPYFILE_EXCL);
      }
      return ctx.vault.rescan();
    },

    // ⌘V in a tab: files copied in Finder or Explorer that the folder's role takes (all of them), else a picture from
    // the clipboard (not for music).
    async pasteImage(s, { folder, role = 'backgrounds' }: { folder: string; role?: FolderRole }, ctx) {
      const dir = ctx.vault.resolve(folder);
      if (!dir) return s;
      const files = (await clipboardFiles()).filter((f) => roleAccepts(role, f));
      if (files.length) {
        for (const src of files) await fs.promises.copyFile(src, path.join(dir, freeName(dir, path.basename(src))), fs.constants.COPYFILE_EXCL);
        return ctx.vault.rescan();
      }
      const img = role === 'music' || role === 'journal' ? null : await clipboardImage();
      if (!img) {
        const what = role === 'music' ? 'noMusic' : role === 'journal' ? 'noPdf' : 'noImage';
        const opts = { type: 'info' as const, message: t(`vault.dlg.${what}`), detail: t(`vault.dlg.${what}Detail`) };
        if (ctx.controlWindow) await ctx.dialog.showMessageBox(ctx.controlWindow, opts);
        else await ctx.dialog.showMessageBox(opts);
        return s;
      }
      fs.writeFileSync(path.join(dir, freeName(dir, img.name)), img.data, { flag: 'wx' });
      return ctx.vault.rescan();
    },

    // Переместить файлы хранилища в корзину приложения (с подтверждением, main/trash.ts; если корзину выключили в
    // настройках — удалить сразу). Это единственное место, где приложение удаляет файлы пользователя, — только по
    // его команде.
    async trash(s, { paths }: { paths: string[] }, ctx) {
      const files = paths.map((p) => ({ rel: p, abs: ctx.vault.resolve(p) })).filter((f): f is { rel: string; abs: string } => !!f.abs && fs.existsSync(f.abs));
      if (!files.length) return s;
      const names = files.map((f) => path.basename(f.abs));
      // Картинка может быть портретом карточки: сама карточка при этом останется (её удаляют из карточки).
      const owners = [...new Set(listCards().filter((c) => c.ref.scope === 'vault' && files.some((f) => c.images.includes(f.rel))).map((c) => c.name))];
      const ownersNote = owners.length
        ? t('vault.dlg.portraitOf', { cards: owners.map((n) => t('common.quote', { text: n })).join(', ') })
        : '';
      const words = deleteWords();
      const what = files.length === 1 ? t('common.quote', { text: names[0]! }) : t('vault.dlg.files', { count: files.length });
      const opts = {
        type: 'warning' as const,
        message: trashSettings().keep ? t('vault.dlg.moveToTrash', { what }) : t('vault.dlg.deleteForever', { what }),
        detail: (files.length > 1 ? names.join('\n') + '\n\n' : '') + ownersNote + words.how,
        buttons: [words.button, t('vault.dlg.cancel')],
        defaultId: 0,
        cancelId: 1,
      };
      const res = ctx.controlWindow ? await ctx.dialog.showMessageBox(ctx.controlWindow, opts) : await ctx.dialog.showMessageBox(opts);
      if (res.response !== 0) return s;
      const root = ctx.vault.root!;
      for (const f of files) discard(root, [f.rel], { title: path.basename(f.abs), kind: fs.statSync(f.abs).isDirectory() ? 'folder' : 'file' });
      return ctx.vault.rescan();
    },

    // Показать папку в Finder / Проводнике.
    async reveal(s, { folder }: { folder: string }, ctx) {
      const dir = ctx.vault.resolve(folder);
      if (dir) await shell.openPath(dir);
      return s;
    },
  },
});
