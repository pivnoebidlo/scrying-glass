// Навигация для модулей: открыть вкладку модуля. Окно управления подставляет реализацию при запуске.
// Модули не импортируют workspace напрямую: он сам зависит от реестра модулей, получился бы цикл.
import type { ModuleId } from '../../shared/types';

let impl: (id: ModuleId) => void = () => {};

export const openTab = (id: ModuleId) => impl(id);
export const provideNav = (fn: (id: ModuleId) => void) => (impl = fn);
