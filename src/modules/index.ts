// Модули приложения. Чтобы добавить новый, создайте папку modules/<имя>/ и впишите его сюда.
// Панели control.ts и display.ts окна подхватывают сами.
import core from './core/main';
import portraits from './portraits/main';

export const moduleList = [core, portraits] as const;
