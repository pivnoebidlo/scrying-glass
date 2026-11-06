
export interface ExampleFaction {
  name: string;
  resources: string[];
  goals: { text: string; marks: number }[];
}

// The example factions of the SRD (Hexcrawl toolbox → Example factions).
export const EXAMPLE_FACTIONS: Record<'en' | 'ru', ExampleFaction[]> = {
  en: [
    {"name":"Cat lord","resources":["Terrifying presence","Hired mercenaries and bandits","Exorbitant wealth"],"goals":[{"text":"Raise bribes from settlement","marks":3},{"text":"Kidnap mouse servants","marks":3},{"text":"Subjugate a settlement","marks":5}]},
    {"name":"Noblemouse","resources":["Ambitious knights","Tricky legal advocates","Stocked storehouses"],"goals":[{"text":"Raise tax revenue","marks":2},{"text":"Acquire new land rights","marks":3},{"text":"Establish new settlement","marks":5}]},
    {"name":"Tunnellers guild","resources":["Rough-pawed work gangs","Solidarity with working mice"],"goals":[{"text":"Intimidate tax collector","marks":2},{"text":"Destroy noblemouse’s manor","marks":3},{"text":"Establish free settlement","marks":5}]},
    {"name":"Rat bandits","resources":["Ruthless gang","Secret hideout"],"goals":[{"text":"Dominate a trade route","marks":2},{"text":"Establish protection racket","marks":3},{"text":"Capture a fortress","marks":4}]},
    {"name":"Faerie queen","resources":["Hidden roads and portals","Shapeshifting agents","Endless illusory silver"],"goals":[{"text":"Kidnap mice","marks":2},{"text":"Trick mice out of legal standing","marks":3},{"text":"Lead settlement into Fae lands","marks":5}]},
    {"name":"Owl sorcerer","resources":["Powerful magic","Speed and fury","Magical servants"],"goals":[{"text":"Take scrying tower from crows","marks":3},{"text":"Locate leyline vortex","marks":4},{"text":"Harness the vortex’s power","marks":5}]},
    {"name":"Clutch of snakes","resources":["Silent slithering serial killers","Chilling calling cards"],"goals":[{"text":"Assassinate a settlement elder","marks":3},{"text":"Assassinate a noblemouse","marks":4},{"text":"Assassinate the queen","marks":5}]},
    {"name":"Cultists","resources":["Poorly-understood eldritch power","Clandestine insiders"],"goals":[{"text":"Recruit vulnerable mice","marks":3},{"text":"Steal powerful artifact","marks":3},{"text":"Summon ancient god","marks":5}]},
    {"name":"Frog prince","resources":["Chivalric knights","Hidden fortress"],"goals":[{"text":"Hold joust to choose a champion","marks":3},{"text":"Kidnap mouse historian","marks":3},{"text":"Find the Mug of Truth","marks":6}]},
    {"name":"Coven of crows","resources":["Cunning corvid crones","Cawing song magic","Soaring scrying tower"],"goals":[{"text":"Kidnap a mouse farmer","marks":2},{"text":"Capture a weather spirit","marks":4},{"text":"Create weather machine","marks":5}]},
  ],
  ru: [
    {"name":"Кошачий владыка","resources":["Наводит ужас","Наёмники и разбойники на службе","Несметные богатства"],"goals":[{"text":"Собрать дань с поселения","marks":3},{"text":"Похитить мышей в услужение","marks":3},{"text":"Покорить поселение","marks":5}]},
    {"name":"Знатная мышь","resources":["Честолюбивые рыцари","Ловкие стряпчие","Полные кладовые"],"goals":[{"text":"Поднять подати","marks":2},{"text":"Получить права на новые земли","marks":3},{"text":"Основать новое поселение","marks":5}]},
    {"name":"Гильдия землекопов","resources":["Артели с грубыми лапами","Солидарность трудовых мышей"],"goals":[{"text":"Запугать сборщика податей","marks":2},{"text":"Разрушить усадьбу знатной мыши","marks":3},{"text":"Основать вольное поселение","marks":5}]},
    {"name":"Крысы-разбойники","resources":["Безжалостная банда","Тайное логово"],"goals":[{"text":"Подчинить торговый путь","marks":2},{"text":"Брать плату «за защиту»","marks":3},{"text":"Захватить крепость","marks":4}]},
    {"name":"Королева фей","resources":["Тайные тропы и порталы","Лазутчики-оборотни","Бесконечное призрачное серебро"],"goals":[{"text":"Похищать мышей","marks":2},{"text":"Хитростью лишить мышей законных прав","marks":3},{"text":"Увести поселение в земли фей","marks":5}]},
    {"name":"Сова-чародей","resources":["Могучая магия","Быстрота и ярость","Волшебные слуги"],"goals":[{"text":"Отнять у ворон башню прозрения","marks":3},{"text":"Найти водоворот силовых линий","marks":4},{"text":"Подчинить силу водоворота","marks":5}]},
    {"name":"Змеиный выводок","resources":["Бесшумные скользящие убийцы","Леденящие душу метки"],"goals":[{"text":"Убить старейшину поселения","marks":3},{"text":"Убить знатную мышь","marks":4},{"text":"Убить королеву","marks":5}]},
    {"name":"Культисты","resources":["Непонятная потусторонняя сила","Тайные сторонники повсюду"],"goals":[{"text":"Завербовать беззащитных мышей","marks":3},{"text":"Украсть могущественный артефакт","marks":3},{"text":"Призвать древнего бога","marks":5}]},
    {"name":"Лягушачий принц","resources":["Благородные рыцари","Тайная крепость"],"goals":[{"text":"Устроить турнир, чтобы выбрать защитника","marks":3},{"text":"Похитить мышь-летописца","marks":3},{"text":"Найти Кружку Истины","marks":6}]},
    {"name":"Вороний ковен","resources":["Хитрые вороньи старухи","Магия каркающих песен","Парящая башня прозрения"],"goals":[{"text":"Похитить мышь-фермера","marks":2},{"text":"Поймать духа погоды","marks":4},{"text":"Построить погодную машину","marks":5}]},
  ],
};
