// Типы состояния и действий, выведенные из списка модулей. Только типы: в окна код ядра не попадает.
import type { moduleList } from '../modules';

type AnyModule = (typeof moduleList)[number];
type ModuleById<K extends ModuleId> = Extract<AnyModule, { id: K }>;

export type ModuleId = AnyModule['id'];

export type AppState = { [K in ModuleId]: ModuleById<K>['initialState'] };

export type ActionName<K extends ModuleId> = keyof ModuleById<K>['actions'] & string;

// Данные действия: обязательны, если действие их ждёт, иначе их можно не передавать.
type PayloadArgs<F> = F extends (state: never, payload: infer P, ...rest: never[]) => unknown
  ? undefined extends P
    ? [payload?: P]
    : [payload: P]
  : never;

export type ActionArgs<K extends ModuleId, A extends ActionName<K>> = PayloadArgs<ModuleById<K>['actions'][A]>;
