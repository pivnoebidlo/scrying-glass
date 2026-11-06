// The mouse generator's own lists: weapons to choose from (the SRD weapon classes with examples) and names
// (written for the app). English and Russian in the same order: a mouse keeps indices, its text follows the language.

export interface Weapon {
  name: string;
  // Die («d6/d8» — one paw or both) and whether it takes both paws.
  dice: string;
  both?: boolean;
}

const WEAPONS_EN: Weapon[] = [
  { name: 'Needle', dice: 'd6' },
  { name: 'Dagger', dice: 'd6' },
  { name: 'Hatchet', dice: 'd6' },
  { name: 'Sword', dice: 'd6/d8' },
  { name: 'Axe', dice: 'd6/d8' },
  { name: 'Staff', dice: 'd6/d8' },
  { name: 'Spear', dice: 'd10', both: true },
  { name: 'Trashhook', dice: 'd10', both: true },
  { name: 'Sling', dice: 'd6' },
  { name: 'Bow', dice: 'd8', both: true },
];
const WEAPONS_RU: string[] = ['Игла', 'Кинжал', 'Топорик', 'Меч', 'Топор', 'Посох', 'Копьё', 'Мусорный крюк', 'Праща', 'Лук'];
export const WEAPONS: Record<'en' | 'ru', Weapon[]> = {
  en: WEAPONS_EN,
  ru: WEAPONS_EN.map((w, i) => ({ ...w, name: WEAPONS_RU[i]! })),
};

// Plants, herbs and small things of the field.
export const NAMES: Record<'en' | 'ru', string[]> = {
  en: [
    'Bramble', 'Burdock', 'Clover', 'Daisy', 'Fennel', 'Hazel', 'Heather', 'Juniper', 'Lavender', 'Mallow',
    'Moss', 'Nettle', 'Oat', 'Parsley', 'Pepper', 'Poppy', 'Primrose', 'Rowan', 'Rue', 'Saffron',
    'Sage', 'Sorrel', 'Tansy', 'Teasel', 'Thyme', 'Truffle', 'Willow', 'Yarrow', 'Barley', 'Chicory',
  ],
  ru: [
    'Ежевика', 'Репейник', 'Клевер', 'Ромашка', 'Фенхель', 'Орешник', 'Вереск', 'Можжевельник', 'Лаванда', 'Мальва',
    'Мох', 'Крапива', 'Овсинка', 'Петрушка', 'Перчинка', 'Мак', 'Первоцвет', 'Рябинка', 'Рута', 'Шафран',
    'Шалфей', 'Щавель', 'Пижма', 'Ворсянка', 'Чабрец', 'Трюфель', 'Ивушка', 'Тысячелистник', 'Ячмень', 'Цикорий',
  ],
};
