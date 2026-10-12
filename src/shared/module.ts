// Описание модуля со стороны ядра: состояние, действия, хуки.
import type { BrowserWindow, Dialog } from 'electron';

// Контекст, который получают действия модулей.
export interface ModuleContext {
  dialog: Dialog;
  appRoot: string;
  readonly assetsDir: string;
  readonly controlWindow: BrowserWindow | null;
}

// Действие: (состояние, данные, контекст) -> новое состояние.
export type Action<S, P = any> = (state: S, payload: P, ctx: ModuleContext) => S | Promise<S>;

export interface ModuleDef<Id extends string, S, A extends Record<string, Action<S>>> {
  id: Id;
  // Сохранять ли состояние модуля в campaign.json.
  persist: boolean;
  initialState: S;
  // Необязательный хук: подготовить состояние при запуске.
  init?(state: S, ctx: ModuleContext): S;
  // Где лежит файл картинки с этим id (для протокола sg-asset).
  resolveAsset?(state: S, id: string, ctx: ModuleContext): string | null;
  actions: A;
}

// Ничего не делает в рантайме, нужен только для вывода типов.
export function defineModule<const Id extends string, S, A extends Record<string, Action<S>>>(
  def: ModuleDef<Id, S, A>
): ModuleDef<Id, S, A> {
  return def;
}
