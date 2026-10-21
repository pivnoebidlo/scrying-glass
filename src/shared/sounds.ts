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

// Titles of the built-in sounds: the file name is the sound's id (saved in scenes and trays), the title comes from
// the dictionary in the interface language.
const SOUND_IDS: Record<string, string> = {
  'Меч из ножен': 'swordDrawn',
  'Скрип двери': 'doorCreak',
  'Вой оборотня': 'werewolfHowl',
  'Рык чудовища': 'monsterRoar',
  'Взмах оружия': 'weaponSwing',
  'Дверь открылась': 'doorOpen',
  'Дверь захлопнулась': 'doorSlam',
  'Разбилось стекло': 'glassBreak',
  'Замок открылся': 'lockOpen',
  'Осыпались камни': 'rockfall',
  'Страницы книги': 'bookPages',
  'Заклинание': 'spell',
  'Призрак': 'ghost',
  'Магия': 'magic',
  'Великан': 'giant',
  'Рычаг': 'lever',
  'Монеты': 'coins',
  'Гром': 'thunder',
  'Лес днём': 'forestDay',
  'Жуткий лес': 'eerieForest',
  'Лес ночью': 'forestNight',
  'Зимний ветер': 'winterWind',
  'Подземная река': 'undergroundRiver',
  'Пустынный ветер': 'desertWind',
  'Дождь': 'rain',
  'Костёр': 'campfire',
  'Море': 'sea',
  'Факел': 'torch',
  'Болото': 'swamp',
  'Гроза': 'thunderstorm',
  'Таверна': 'tavern',
  'Рынок': 'market',
  'Пещера': 'cave',
  'Дом с привидениями': 'hauntedHouse',
  'Склеп': 'crypt',
  'Кузница': 'smithy',
  'Ночь в поле': 'fieldNight',
  'Камин': 'hearth',
  'Храм': 'temple',
  'Пастбище': 'pasture',
  'Ветер в трубе': 'chimneyWind',
  'Колокол': 'bell',
  'Набат': 'alarmBells',
  'Боевой рог': 'warHorn',
  'Взрыв': 'explosion',
  'Цепи': 'chains',
  'Стрелы в мишень': 'arrowsHit',
  'Кнут': 'whip',
  'Удар': 'punch',
  'Падение тела': 'bodyFall',
  'Точильный камень': 'whetstone',
  'Вой призрака': 'ghostWail',
  'Стон нежити': 'undeadMoan',
  'Ржание коня': 'horseNeigh',
  'Галоп': 'gallop',
  'Вороны': 'crows',
  'Сова': 'owl',
  'Сердцебиение': 'heartbeat',
  'Безумный смех': 'madLaughter',
  'Скрип половиц': 'floorCreak',
  'Лай собак': 'dogsBark',
};

// «sound:sfx/Гром.ogg» -> «Thunder» / «Гром»; null — not a built-in sound or no title for it.
export function builtinSoundTitle(path: string): string | null {
  if (!isBuiltinSound(path)) return null;
  const file = path.slice(path.lastIndexOf('/') + 1).normalize('NFC');
  const id = SOUND_IDS[file.replace(/\.[^.]+$/, '')];
  return id ? t(`sounds.builtin.${id}` as Key) : null;
}
