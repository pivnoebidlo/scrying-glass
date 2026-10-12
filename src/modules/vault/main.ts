// Хранилище: какая папка открыта и что в ней лежит. Само открытие, сканирование и наблюдение за
// изменениями делает ядро (ctx.vault), модуль только даёт окнам к этому доступ.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { shell, type OpenDialogOptions } from 'electron';
import { defineModule, type ModuleContext } from '../../shared/module';
import { AUDIO_EXT, IMAGE_EXT, type VaultState } from '../../shared/vault';
import { freeName } from '../../main/files';

const openDialog = (ctx: ModuleContext, opts: OpenDialogOptions) =>
  ctx.controlWindow ? ctx.dialog.showOpenDialog(ctx.controlWindow, opts) : ctx.dialog.showOpenDialog(opts);

const initialState: VaultState = { root: null, name: '', tree: null, recent: [] };

export default defineModule({
  id: 'vault',
  persist: false,
  initialState,

  actions: {
    // Выбрать папку хранилища в диалоге. Подойдёт любая, в том числе пустая.
    async choose(s, _: void, ctx) {
      const res = await openDialog(ctx, {
        title: 'Выберите папку хранилища',
        buttonLabel: 'Открыть',
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

    // Скопировать файлы в папку хранилища. Существующие файлы не перезаписываются.
    async importFiles(s, { folder }: { folder: string }, ctx) {
      const dir = ctx.vault.resolve(folder);
      if (!dir) return s;
      const res = await openDialog(ctx, {
        title: 'Добавить файлы в хранилище',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Картинки и музыка', extensions: [...IMAGE_EXT, ...AUDIO_EXT].map((e) => e.slice(1)) },
        ],
      });
      if (res.canceled) return s;
      for (const src of res.filePaths) {
        await fs.promises.copyFile(src, path.join(dir, freeName(dir, path.basename(src))), fs.constants.COPYFILE_EXCL);
      }
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
