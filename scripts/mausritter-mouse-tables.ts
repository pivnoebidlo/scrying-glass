// Tables of the Mausritter SRD 2.3.1 for the mouse generator (CC BY 4.0, Losing Games and Isaac Williams; the Russian
// text — our translation, scripts/mausritter-srd.ru.md). Copied from the SRD files; English and Russian in the same order.
// Backgrounds go by HP (1–6) and pips (1–6): index (hp − 1) × 6 + (pips − 1).

export interface Background {
  name: string;
  // Item A and item B.
  a: string;
  b: string;
}

export interface MouseTables {
  backgrounds: Background[];
  birthsigns: { sign: string; disposition: string }[];
  colors: string[];
  patterns: string[];
  // d66: 11…16, 21…26 … 61…66 in order.
  details: string[];
}

export const TABLES: Record<'en' | 'ru', MouseTables> = {
  en: {
  "backgrounds": [
    {
      "name": "Test subject",
      "a": "Spell: Magic missile",
      "b": "Lead coat (Heavy armour)"
    },
    {
      "name": "Kitchen forager",
      "a": "Shield & jerkin (Light armour)",
      "b": "Cookpots"
    },
    {
      "name": "Cage dweller",
      "a": "Spell: Be understood",
      "b": "Bottle of milk"
    },
    {
      "name": "Hedge witch",
      "a": "Spell: Heal",
      "b": "Incense stick"
    },
    {
      "name": "Leatherworker",
      "a": "Shield & jerkin (Light armour)",
      "b": "Shears"
    },
    {
      "name": "Street tough",
      "a": "Dagger (Light, d6)",
      "b": "Flask of coffee"
    },
    {
      "name": "Mendicant priest",
      "a": "Spell: Restore",
      "b": "Holy symbol"
    },
    {
      "name": "Beetleherd",
      "a": "Hireling: Loyal beetle",
      "b": "Pole, 6\""
    },
    {
      "name": "Ale brewer",
      "a": "Hireling: Drunken torchbearer",
      "b": "Small barrel of ale"
    },
    {
      "name": "Fishermouse",
      "a": "Net",
      "b": "Needle (Light, d6)"
    },
    {
      "name": "Blacksmith",
      "a": "Hammer (Medium, d6/d8)",
      "b": "Metal file"
    },
    {
      "name": "Wireworker",
      "a": "Wire, spool",
      "b": "Electric lantern"
    },
    {
      "name": "Woodcutter",
      "a": "Axe (Medium, d6/d8)",
      "b": "Twine, roll"
    },
    {
      "name": "Bat cultist",
      "a": "Spell: Darkness",
      "b": "Bag of bat teeth"
    },
    {
      "name": "Tin miner",
      "a": "Pickaxe (Medium, d6/d8)",
      "b": "Lantern"
    },
    {
      "name": "Trash collector",
      "a": "Trashhook (Heavy, d10)",
      "b": "Mirror"
    },
    {
      "name": "Wall rover",
      "a": "Fishhook",
      "b": "Thread, spool"
    },
    {
      "name": "Merchant",
      "a": "Hireling: Pack rat",
      "b": "20p IOU from a noblemouse"
    },
    {
      "name": "Raft crew",
      "a": "Hammer (Medium, d6/d8)",
      "b": "Wooden spikes"
    },
    {
      "name": "Worm wrangler",
      "a": "Pole, 6\"",
      "b": "Soap"
    },
    {
      "name": "Sparrow rider",
      "a": "Fishhook",
      "b": "Goggles"
    },
    {
      "name": "Sewer guide",
      "a": "Metal file",
      "b": "Thread, spool"
    },
    {
      "name": "Prison guard",
      "a": "Chain, 6\"",
      "b": "Spear (Heavy, d10)"
    },
    {
      "name": "Fungus farmer",
      "a": "Dried mushroom (as rations)",
      "b": "Spore mask"
    },
    {
      "name": "Dam builder",
      "a": "Shovel",
      "b": "Wooden spikes"
    },
    {
      "name": "Cartographer",
      "a": "Quill & ink",
      "b": "Compass"
    },
    {
      "name": "Trap thief",
      "a": "Block of cheese",
      "b": "Glue"
    },
    {
      "name": "Vagabond",
      "a": "Tent",
      "b": "Treasure map, dubious"
    },
    {
      "name": "Grain farmer",
      "a": "Spear (Heavy, d10)",
      "b": "Whistle"
    },
    {
      "name": "Message runner",
      "a": "Bedroll",
      "b": "Documents, sealed"
    },
    {
      "name": "Troubadour",
      "a": "Musical instrument",
      "b": "Disguise kit"
    },
    {
      "name": "Gambler",
      "a": "Set of loaded dice",
      "b": "Mirror"
    },
    {
      "name": "Sap tapper",
      "a": "Bucket",
      "b": "Wooden spikes"
    },
    {
      "name": "Bee keeper",
      "a": "Jar of honey",
      "b": "Net"
    },
    {
      "name": "Librarian",
      "a": "Scrap of obscure book",
      "b": "Quill & ink"
    },
    {
      "name": "Pauper noblemouse",
      "a": "Felt hat",
      "b": "Perfume"
    }
  ],
  "birthsigns": [
    {
      "sign": "Star",
      "disposition": "Brave / Reckless"
    },
    {
      "sign": "Wheel",
      "disposition": "Industrious / Unimaginative"
    },
    {
      "sign": "Acorn",
      "disposition": "Inquisitive / Stubborn"
    },
    {
      "sign": "Storm",
      "disposition": "Generous / Wrathful"
    },
    {
      "sign": "Moon",
      "disposition": "Wise / Mysterious"
    },
    {
      "sign": "Mother",
      "disposition": "Nurturing / Worrying"
    }
  ],
  "colors": [
    "Chocolate",
    "Black",
    "White",
    "Tan",
    "Grey",
    "Blue"
  ],
  "patterns": [
    "Solid",
    "Brindle",
    "Patchy",
    "Banded",
    "Marbled",
    "Flecked"
  ],
  "details": [
    "Scarred body",
    "Corpulent body",
    "Skeletal body",
    "Willowy body",
    "Tiny body",
    "Massive body",
    "War paint",
    "Foreign clothes",
    "Elegant clothes",
    "Patched clothes",
    "Fashionable clothes",
    "Unwashed clothes",
    "Missing ear",
    "Lumpy face",
    "Beautiful face",
    "Round face",
    "Delicate face",
    "Elongated face",
    "Groomed fur",
    "Dreadlocks",
    "Dyed fur",
    "Shaved fur",
    "Frizzy fur",
    "Silky fur",
    "Night black eyes",
    "Eye patch",
    "Blood red eyes",
    "Wise eyes",
    "Sharp eyes",
    "Luminous eyes",
    "Cropped tail",
    "Whip-like tail",
    "Tufted tail",
    "Stubby tail",
    "Prehensile tail",
    "Curly tail"
  ]
},
  ru: {
  "backgrounds": [
    {
      "name": "Подопытная мышь",
      "a": "Заклинание: Волшебная стрела",
      "b": "Свинцовый плащ (тяжёлая броня)"
    },
    {
      "name": "Кухонная добытчица",
      "a": "Щит и куртка (лёгкая броня)",
      "b": "Котелки"
    },
    {
      "name": "Жилица клетки",
      "a": "Заклинание: Понимание",
      "b": "Бутылка молока"
    },
    {
      "name": "Знахарка",
      "a": "Заклинание: Исцеление",
      "b": "Палочка благовоний"
    },
    {
      "name": "Кожевница",
      "a": "Щит и куртка (лёгкая броня)",
      "b": "Ножницы"
    },
    {
      "name": "Уличная драчунья",
      "a": "Кинжал (лёгкое, к6)",
      "b": "Фляжка кофе"
    },
    {
      "name": "Нищенствующий жрец",
      "a": "Заклинание: Восстановление",
      "b": "Священный символ"
    },
    {
      "name": "Пастух жуков",
      "a": "Наёмник: верный жук",
      "b": "Шест, 6\""
    },
    {
      "name": "Пивовар",
      "a": "Наёмник: пьяный факельщик",
      "b": "Бочонок эля"
    },
    {
      "name": "Рыбачка",
      "a": "Сеть",
      "b": "Игла (лёгкое, к6)"
    },
    {
      "name": "Кузнец",
      "a": "Молот (среднее, к6/к8)",
      "b": "Напильник"
    },
    {
      "name": "Проволочник",
      "a": "Моток проволоки",
      "b": "Электрический фонарь"
    },
    {
      "name": "Дровосек",
      "a": "Топор (среднее, к6/к8)",
      "b": "Моток бечёвки"
    },
    {
      "name": "Культист летучих мышей",
      "a": "Заклинание: Тьма",
      "b": "Мешочек зубов летучей мыши"
    },
    {
      "name": "Оловянный рудокоп",
      "a": "Кирка (среднее, к6/к8)",
      "b": "Фонарь"
    },
    {
      "name": "Мусорщик",
      "a": "Мусорный крюк (тяжёлое, к10)",
      "b": "Зеркальце"
    },
    {
      "name": "Бродяга по стенам",
      "a": "Рыболовный крючок",
      "b": "Катушка ниток"
    },
    {
      "name": "Торговка",
      "a": "Наёмник: вьючная крыса",
      "b": "Долговая расписка знатной мыши на 20 п"
    },
    {
      "name": "Плотогон",
      "a": "Молот (среднее, к6/к8)",
      "b": "Деревянные колья"
    },
    {
      "name": "Укротитель червей",
      "a": "Шест, 6\"",
      "b": "Мыло"
    },
    {
      "name": "Наездница воробьёв",
      "a": "Рыболовный крючок",
      "b": "Очки-консервы"
    },
    {
      "name": "Проводник по стокам",
      "a": "Напильник",
      "b": "Катушка ниток"
    },
    {
      "name": "Тюремный стражник",
      "a": "Цепь, 6\"",
      "b": "Копьё (тяжёлое, к10)"
    },
    {
      "name": "Грибовод",
      "a": "Сушёный гриб (как паёк)",
      "b": "Маска от спор"
    },
    {
      "name": "Строитель плотин",
      "a": "Лопата",
      "b": "Деревянные колья"
    },
    {
      "name": "Картограф",
      "a": "Перо и чернила",
      "b": "Компас"
    },
    {
      "name": "Воровка из ловушек",
      "a": "Кусок сыра",
      "b": "Клей"
    },
    {
      "name": "Бродяжка",
      "a": "Палатка",
      "b": "Карта сокровищ, сомнительная"
    },
    {
      "name": "Хлебороб",
      "a": "Копьё (тяжёлое, к10)",
      "b": "Свисток"
    },
    {
      "name": "Гонец",
      "a": "Спальный мешок",
      "b": "Запечатанные бумаги"
    },
    {
      "name": "Трубадур",
      "a": "Музыкальный инструмент",
      "b": "Набор для маскировки"
    },
    {
      "name": "Игрок",
      "a": "Набор утяжелённых кубов",
      "b": "Зеркальце"
    },
    {
      "name": "Сборщица сока",
      "a": "Ведро",
      "b": "Деревянные колья"
    },
    {
      "name": "Пчеловод",
      "a": "Банка мёда",
      "b": "Сеть"
    },
    {
      "name": "Библиотекарь",
      "a": "Обрывок редкой книги",
      "b": "Перо и чернила"
    },
    {
      "name": "Обедневшая знатная мышь",
      "a": "Фетровая шляпа",
      "b": "Духи"
    }
  ],
  "birthsigns": [
    {
      "sign": "Звезда",
      "disposition": "Отважная / безрассудная"
    },
    {
      "sign": "Колесо",
      "disposition": "Трудолюбивая / без фантазии"
    },
    {
      "sign": "Жёлудь",
      "disposition": "Любопытная / упрямая"
    },
    {
      "sign": "Буря",
      "disposition": "Щедрая / гневливая"
    },
    {
      "sign": "Луна",
      "disposition": "Мудрая / загадочная"
    },
    {
      "sign": "Мать",
      "disposition": "Заботливая / тревожная"
    }
  ],
  "colors": [
    "Шоколадный",
    "Чёрный",
    "Белый",
    "Рыжевато-бурый",
    "Серый",
    "Голубой"
  ],
  "patterns": [
    "Однотонный",
    "Тигровый",
    "Пятнистый",
    "Полосатый",
    "Мраморный",
    "Крапчатый"
  ],
  "details": [
    "Тело в шрамах",
    "Тучное тело",
    "Тощее тело",
    "Гибкое тело",
    "Крохотное тело",
    "Могучее тело",
    "Боевая раскраска",
    "Чужеземная одежда",
    "Изящная одежда",
    "Латаная одежда",
    "Модная одежда",
    "Нестираная одежда",
    "Нет одного уха",
    "Шишковатая морда",
    "Красивая морда",
    "Круглая морда",
    "Тонкая морда",
    "Вытянутая морда",
    "Ухоженный мех",
    "Дреды",
    "Крашеный мех",
    "Бритый мех",
    "Всклокоченный мех",
    "Шелковистый мех",
    "Чёрные как ночь глаза",
    "Повязка на глазу",
    "Кроваво-красные глаза",
    "Мудрые глаза",
    "Зоркие глаза",
    "Светящиеся глаза",
    "Обрубленный хвост",
    "Хвост-хлыст",
    "Хвост с кисточкой",
    "Короткий хвост",
    "Цепкий хвост",
    "Хвост колечком"
  ]
},
};
