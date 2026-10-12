// Связь модулей с окном управления: открыть вкладку, узнать выбранный экран игроков.
// Окно управления подставляет реализацию при запуске. Модули не импортируют workspace напрямую:
// он сам зависит от реестра модулей, получился бы цикл.
import type { DisplayInfo } from '../../shared/api';
import type { ModuleId } from '../../shared/types';

interface Nav {
  openTab(id: ModuleId): void;
  display(): DisplayInfo | null;
}

let impl: Nav = { openTab: () => {}, display: () => null };

export const openTab = (id: ModuleId) => impl.openTab(id);
// Экран игроков, выбранный в правой панели (размеры нужны, например, чтобы показать, что видят игроки).
export const playerDisplay = () => impl.display();
export const provideNav = (nav: Nav) => (impl = nav);
