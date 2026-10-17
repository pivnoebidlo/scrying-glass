// Хранилище: какая папка открыта и что в ней лежит. Само открытие, сканирование и наблюдение за
// изменениями делает ядро (ctx.vault), модуль только даёт окнам к этому доступ.
import { t } from '../../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { shell, type OpenDialogOptions } from 'electron';
import { defineModule, type ModuleContext } from '../../shared/module';
import type { LangSetting } from '../../shared/i18n/core';
import { AUDIO_EXT, DEFAULT_ROLES, IMAGE_EXT, type RoleNames, type VaultState } from '../../shared/vault';
import { clipboardImage, freeName } from '../../main/files';
import { listCards } from '../../main/cards';
import { deleteWords, discard, trashSettings } from '../../main/trash';

const openDialog = (ctx: ModuleContext, opts: OpenDialogOptions) =>
  ctx.controlWindow ? ctx.dialog.showOpenDialog(ctx.controlWindow, opts) : ctx.dialog.showOpenDialog(opts);

const initialState: VaultState = { root: null, name: '', tree: null, recent: [], roles: DEFAULT_ROLES, systemsOff: [], language: 'auto', lang: 'en' };

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
    async pasteImage(s, { folder }: { folder: string }, ctx) {
      const dir = ctx.vault.resolve(folder);
      if (!dir) return s;
      const img = await clipboardImage();
      if (!img) {
        const opts = {
          type: 'info' as const,
          message: t('vault.dlg.noImage'),
          detail: t('vault.dlg.noImageDetail'),
        };
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
