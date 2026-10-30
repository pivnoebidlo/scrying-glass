import { t, type Key } from './i18n';

// Встроенные звуки приложения (resources/sounds): пути «sound:sfx/Гром.ogg», «sound:ambience/Дождь.m4a».
export const BUILTIN_SOUND = 'sound:';
export const isBuiltinSound = (path: string) => path.startsWith(BUILTIN_SOUND);

export interface BuiltinSounds {
  // Разовые эффекты.
  sfx: string[];
  // Петли атмосферы.
  ambience: string[];
}

// Groups of the built-in sounds in the pickers, in this order: effects first, then ambience.
export const SOUND_GROUPS = ['combat', 'magic', 'creatures', 'people', 'eerie', 'things', 'nature', 'outdoors', 'weather', 'places', 'dark'] as const;
export type SoundGroup = (typeof SOUND_GROUPS)[number];

// Titles of the built-in sounds: the file name is the sound's id (saved in scenes and trays), the title comes from
// the dictionary in the interface language; the group sorts them in the pickers.
const SOUNDS: Record<string, [id: string, group: SoundGroup]> = {
  'Меч из ножен': ['swordDrawn', 'combat'],
  'Взмах оружия': ['weaponSwing', 'combat'],
  'Боевой рог': ['warHorn', 'combat'],
  'Взрыв': ['explosion', 'combat'],
  'Стрелы в мишень': ['arrowsHit', 'combat'],
  'Кнут': ['whip', 'combat'],
  'Удар': ['punch', 'combat'],
  'Падение тела': ['bodyFall', 'combat'],
  'Точильный камень': ['whetstone', 'combat'],
  'Звон клинков': ['bladesClash', 'combat'],
  'Рубящий удар': ['swordCut', 'combat'],
  'Выстрел из лука': ['bowShot', 'combat'],
  'Крик боли': ['painCry', 'combat'],
  'Марш': ['march', 'combat'],
  'Пушечный выстрел': ['cannon', 'combat'],
  'Заклинание': ['spell', 'magic'],
  'Магия': ['magic', 'magic'],
  'Волшебный перезвон': ['magicChimes', 'magic'],
  'Феи': ['fey', 'magic'],
  'Вспышка пламени': ['flameBurst', 'magic'],
  'Гонг': ['gong', 'magic'],
  'Вой оборотня': ['werewolfHowl', 'creatures'],
  'Рык чудовища': ['monsterRoar', 'creatures'],
  'Великан': ['giant', 'creatures'],
  'Ржание коня': ['horseNeigh', 'creatures'],
  'Галоп': ['gallop', 'creatures'],
  'Вороны': ['crows', 'creatures'],
  'Сова': ['owl', 'creatures'],
  'Лай собак': ['dogsBark', 'creatures'],
  'Рёв дракона': ['dragonRoar', 'creatures'],
  'Петух': ['rooster', 'creatures'],
  'Куры': ['hens', 'creatures'],
  'Свинья': ['pig', 'creatures'],
  'Корова': ['cow', 'creatures'],
  'Коза': ['goat', 'creatures'],
  'Кошка': ['cat', 'creatures'],
  'Злая кошка': ['angryCat', 'creatures'],
  'Летучие мыши': ['bats', 'creatures'],
  'Крыса': ['rat', 'creatures'],
  'Писк мыши': ['mouseSqueak', 'creatures'],
  'Хлопанье крыльев': ['wings', 'creatures'],
  'Мухи': ['flies', 'creatures'],
  'Страницы книги': ['bookPages', 'people'],
  'Монеты': ['coins', 'people'],
  'Колокол': ['bell', 'people'],
  'Набат': ['alarmBells', 'people'],
  'Аплодисменты': ['applause', 'people'],
  'Детский смех': ['childrenLaugh', 'people'],
  'Хохот огра': ['ogreLaugh', 'people'],
  'Стук в дверь': ['knock', 'people'],
  'Звон бокалов': ['clink', 'people'],
  'Наливают пиво': ['beerPour', 'people'],
  'Молоток судьи': ['gavel', 'people'],
  'Барабанная дробь': ['drumRoll', 'people'],
  'Фейерверк': ['fireworks', 'people'],
  'Хруст': ['crunch', 'people'],
  'Призрак': ['ghost', 'eerie'],
  'Цепи': ['chains', 'eerie'],
  'Вой призрака': ['ghostWail', 'eerie'],
  'Стон нежити': ['undeadMoan', 'eerie'],
  'Сердцебиение': ['heartbeat', 'eerie'],
  'Безумный смех': ['madLaughter', 'eerie'],
  'Скрип половиц': ['floorCreak', 'eerie'],
  'Смех ведьмы': ['witchLaugh', 'eerie'],
  'Шёпот': ['whisper', 'eerie'],
  'Скрип верёвки': ['ropeCreak', 'eerie'],
  'Скрип двери': ['doorCreak', 'things'],
  'Дверь открылась': ['doorOpen', 'things'],
  'Дверь захлопнулась': ['doorSlam', 'things'],
  'Разбилось стекло': ['glassBreak', 'things'],
  'Замок открылся': ['lockOpen', 'things'],
  'Рычаг': ['lever', 'things'],
  'Топор по дереву': ['axe', 'things'],
  'Пила': ['saw', 'things'],
  'Ворота амбара': ['barnDoor', 'things'],
  'Скрип решётки': ['gateCreak', 'things'],
  'Осыпались камни': ['rockfall', 'nature'],
  'Гром': ['thunder', 'nature'],
  'Всплеск': ['splash', 'nature'],
  'Шаги по листве': ['leavesSteps', 'nature'],
  'Шаги по доскам': ['woodSteps', 'nature'],
  'Треск веток': ['twigsSnap', 'nature'],
  'Лес днём': ['forestDay', 'outdoors'],
  'Лес ночью': ['forestNight', 'outdoors'],
  'Костёр': ['campfire', 'outdoors'],
  'Море': ['sea', 'outdoors'],
  'Болото': ['swamp', 'outdoors'],
  'Ночь в поле': ['fieldNight', 'outdoors'],
  'Пастбище': ['pasture', 'outdoors'],
  'Сельская округа': ['countryside', 'outdoors'],
  'Ветер в кронах': ['windInTrees', 'outdoors'],
  'Ручей': ['stream', 'outdoors'],
  'Пруд': ['pond', 'outdoors'],
  'Зимний ветер': ['winterWind', 'weather'],
  'Пустынный ветер': ['desertWind', 'weather'],
  'Дождь': ['rain', 'weather'],
  'Гроза': ['thunderstorm', 'weather'],
  'Ветер в трубе': ['chimneyWind', 'weather'],
  'Таверна': ['tavern', 'places'],
  'Рынок': ['market', 'places'],
  'Кузница': ['smithy', 'places'],
  'Камин': ['hearth', 'places'],
  'Храм': ['temple', 'places'],
  'Толпа на площади': ['crowdSquare', 'places'],
  'Ферма': ['farm', 'places'],
  'Порт': ['harbour', 'places'],
  'Жуткий лес': ['eerieForest', 'dark'],
  'Подземная река': ['undergroundRiver', 'dark'],
  'Факел': ['torch', 'dark'],
  'Пещера': ['cave', 'dark'],
  'Дом с привидениями': ['hauntedHouse', 'dark'],
  'Склеп': ['crypt', 'dark'],
  'Кипящий котёл': ['cauldron', 'dark'],
};

// «sound:sfx/Гром.ogg» -> «Thunder» / «Гром»; null — not a built-in sound or no title for it.
export function builtinSoundTitle(path: string): string | null {
  const sound = soundOf(path);
  return sound ? t(`sounds.builtin.${sound[0]}` as Key) : null;
}

function soundOf(path: string) {
  if (!isBuiltinSound(path)) return null;
  const file = path.slice(path.lastIndexOf('/') + 1).normalize('NFC');
  return SOUNDS[file.replace(/\.[^.]+$/, '')] ?? null;
}

// Built-in sounds as picker options: grouped («Combat», «Places»…) and sorted by title within a group.
export function builtinSoundOptions(paths: string[], title: (path: string) => string) {
  const rank = (p: string) => {
    const g = soundOf(p)?.[1];
    return g ? SOUND_GROUPS.indexOf(g) : SOUND_GROUPS.length;
  };
  return paths
    .map((p) => ({ id: p, title: title(p), rank: rank(p), group: t(`sounds.group.${soundOf(p)?.[1] ?? 'other'}` as Key) }))
    .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
    .map(({ rank: _, ...o }) => o);
}
