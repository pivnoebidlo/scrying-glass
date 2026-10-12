// Модули приложения. Чтобы добавить новый, создайте папку modules/<имя>/ и впишите его сюда.
// Части для окон (control.ts и display.ts) окна подхватывают сами.
import core from './core/main';
import vault from './vault/main';
import portraits from './portraits/main';
import scene from './scene/main';
import music from './music/main';
import maps from './maps/main';
import scenes from './scenes/main';

export const moduleList = [core, vault, scene, maps, portraits, music, scenes] as const;
