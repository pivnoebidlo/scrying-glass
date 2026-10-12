// Модули приложения. Чтобы добавить новый, создайте папку modules/<имя>/ и впишите его сюда.
// Части для окон (control.ts и display.ts) окна подхватывают сами.
import core from './core/main';
import vault from './vault/main';
import portraits from './portraits/main';

export const moduleList = [core, vault, portraits] as const;
