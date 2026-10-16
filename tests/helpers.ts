// Общее для тестов: контекст модуля без Electron и вызов действия по имени.
import type { ModuleContext } from '../src/shared/module';
import type { VaultFolder } from '../src/shared/vault';

export function ctx(tree: VaultFolder | null = null): ModuleContext {
  return {
    dialog: {} as ModuleContext['dialog'],
    controlWindow: null,
    vault: {
      root: tree ? '/vault' : null,
      tree,
      resolve: (rel) => '/vault/' + rel,
      open: async () => {
        throw new Error('не нужно в тестах');
      },
      rescan: () => {
        throw new Error('не нужно в тестах');
      },
      forget: () => {
        throw new Error('не нужно в тестах');
      },
      setRoles: () => {
        throw new Error('не нужно в тестах');
      },
      setLanguage: () => {
      throw new Error("not in tests");
    },
    setSystemsOff: () => {
        throw new Error('не нужно в тестах');
      },
    },
  };
}

// Дерево хранилища из списка путей файлов: «a/maps/x.png».
export function tree(paths: string[]): VaultFolder {
  const root: VaultFolder = { path: '', name: 'vault', folders: [], files: [] };
  for (const p of paths) {
    const parts = p.split('/');
    let f = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const path = parts.slice(0, i + 1).join('/');
      let sub = f.folders.find((x) => x.path === path);
      if (!sub) f.folders.push((sub = { path, name: parts[i]!, folders: [], files: [] }));
      f = sub;
    }
    const name = parts[parts.length - 1]!;
    f.files.push({ path: p, name, kind: /\.(png|jpe?g|webp|gif)$/i.test(name) ? 'image' : 'audio' });
  }
  return root;
}

// Действие модуля как обычная функция (действия синхронные, кроме тех, что ходят на диск).
export function run<S>(mod: { actions: Record<string, unknown> }, s: S, action: string, payload?: unknown, c = ctx()): S {
  const fn = mod.actions[action] as (s: S, p: unknown, c: ModuleContext) => S;
  return fn(s, payload, c);
}
