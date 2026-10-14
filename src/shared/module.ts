// Описание модуля со стороны ядра: состояние, действия, хуки.
import type { BrowserWindow, Dialog } from 'electron';
import type { RoleNames, VaultFolder, VaultState } from './vault';

// Хранилище, как его видят модули.
export interface VaultAccess {
  readonly root: string | null;
  readonly tree: VaultFolder | null;
  // Абсолютный путь к файлу хранилища. null, если хранилище не открыто или путь выходит за его пределы.
  resolve(rel: string): string | null;
  // Открывает другое хранилище (null — закрыть). Возвращает новое состояние модуля vault.
  open(root: string | null): Promise<VaultState>;
  // Перечитать хранилище, не дожидаясь наблюдателя (например, сразу после копирования файлов).
  rescan(): VaultState;
  // Забыть хранилище в списке недавних.
  forget(root: string): VaultState;
  // Свои названия папок ролей (null — названия по умолчанию). Сохраняются в настройках приложения.
  setRoles(roles: Partial<RoleNames> | null): VaultState;
  // Отключённые ролевые системы. Сохраняются в настройках приложения.
  setSystemsOff(list: string[]): VaultState;
}

// Контекст, который получают действия и хуки модулей.
export interface ModuleContext {
  dialog: Dialog;
  readonly controlWindow: BrowserWindow | null;
  vault: VaultAccess;
}

// Действие: (состояние, данные, контекст) -> новое состояние.
export type Action<S, P = any> = (state: S, payload: P, ctx: ModuleContext) => S | Promise<S>;

export interface ModuleDef<Id extends string, S, A extends Record<string, Action<S>>> {
  id: Id;
  // Сохранять ли состояние модуля в хранилище (.scrying-glass/state.json).
  persist: boolean;
  initialState: S;
  // Необязательный хук: подготовить состояние после открытия хранилища.
  init?(state: S, ctx: ModuleContext): S;
  // Необязательный хук: файлы в хранилище изменились (дерево уже перечитано, ctx.vault.tree новое).
  onTreeChange?(state: S, ctx: ModuleContext): S;
  actions: A;
}

// Ничего не делает в рантайме, нужен только для вывода типов.
export function defineModule<const Id extends string, S, A extends Record<string, Action<S>>>(
  def: ModuleDef<Id, S, A>
): ModuleDef<Id, S, A> {
  return def;
}
