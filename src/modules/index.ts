// Модули приложения. Чтобы добавить новый, создайте папку modules/<имя>/ и впишите его сюда.
// Части для окон (control.ts и display.ts) окна подхватывают сами.
import core from './core/main';
import vault from './vault/main';
import portraits from './portraits/main';
import scene from './scene/main';
import music from './music/main';
import maps from './maps/main';
import scenes from './scenes/main';
import initiative from './initiative/main';
import bestiary from './bestiary/main';
import adventures from './adventures/main';
import handouts from './handouts/main';
import order from './order/main';
import tools from './tools/main';
import timer from './timer/main';
import backup from './backup/main';
import compendium from './compendium/main';
import fate from './fate/main';
import sounds from './sounds/main';
import journal from './journal/main';
import telegram from './telegram/main';
import schedule from './schedule/main';

export const moduleList = [core, vault, adventures, scene, maps, handouts, portraits, music, scenes, initiative, bestiary, order, tools, timer, backup, compendium, fate, sounds, journal, telegram, schedule] as const;
