// Treasure content, written for the app — both languages side by side (the same order). Pocket things and trinkets
// come from the retired built-in tables «What's in the Pockets» and «Trinkets and Finds». Russian — noun phrases.
type Pair = [en: string, ru: string];

export const GEMS: Record<number, Pair[]> = {
  10: [['azurite', 'азурит'], ['banded agate', 'полосатый агат'], ['hematite', 'гематит'], ['lapis lazuli', 'лазурит'], ['malachite', 'малахит'], ['turquoise', 'бирюза'], ['obsidian', 'обсидиан'], ['tiger eye', 'тигровый глаз']],
  50: [['bloodstone', 'гелиотроп'], ['carnelian', 'сердолик'], ['chalcedony', 'халцедон'], ['citrine', 'цитрин'], ['moonstone', 'лунный камень'], ['onyx', 'оникс'], ['rock crystal', 'горный хрусталь'], ['jasper', 'яшма']],
  100: [['amber', 'янтарь'], ['amethyst', 'аметист'], ['coral', 'коралл'], ['garnet', 'гранат'], ['jade', 'нефрит'], ['pearl', 'жемчужина'], ['spinel', 'шпинель'], ['tourmaline', 'турмалин']],
  500: [['alexandrite', 'александрит'], ['aquamarine', 'аквамарин'], ['black pearl', 'чёрная жемчужина'], ['blue spinel', 'синяя шпинель'], ['peridot', 'перидот'], ['topaz', 'топаз']],
  1000: [['black opal', 'чёрный опал'], ['blue sapphire', 'синий сапфир'], ['emerald', 'изумруд'], ['fire opal', 'огненный опал'], ['star ruby', 'звёздчатый рубин'], ['yellow sapphire', 'жёлтый сапфир']],
  5000: [['black sapphire', 'чёрный сапфир'], ['diamond', 'алмаз'], ['jacinth', 'гиацинт'], ['ruby', 'рубин']],
};

export const ART: Record<number, Pair[]> = {
  10: [['a carved bone dice set', 'резной набор костей для игры'], ['a copper ring with a tiny garnet', 'медное кольцо с крошечным гранатом'], ['a painted wooden icon', 'расписная деревянная икона'], ['a brass hand mirror', 'латунное ручное зеркальце']],
  50: [['a silver ewer', 'серебряный кувшин'], ['a carved bone statuette', 'статуэтка из резной кости'], ['a small gold bracelet', 'тонкий золотой браслет'], ['embroidered silk vestments', 'облачение из расшитого шёлка'], ['a copper chalice with silver filigree', 'медная чаша с серебряной филигранью']],
  100: [['a silver comb set with moonstones', 'серебряный гребень с лунными камнями'], ['a carved ivory statuette', 'статуэтка из слоновой кости'], ['a gold locket with a painted portrait', 'золотой медальон с портретом'], ['a brass censer with a pierced lid', 'латунная курильница с ажурной крышкой']],
  500: [['a gold ring set with bloodstones', 'золотой перстень с гелиотропами'], ['a fine gold chain with a fire opal', 'тонкая золотая цепочка с огненным опалом'], ['an old masterpiece painting', 'старинная картина известного мастера'], ['an embroidered silk and velvet mantle', 'мантия из шёлка и бархата с вышивкой']],
  1000: [['a jeweled gold crown', 'золотая корона с самоцветами'], ['a platinum bracelet set with a sapphire', 'платиновый браслет с сапфиром'], ['an ornate gold music box', 'золотая музыкальная шкатулка тонкой работы'], ['a gold dragon comb set with red garnets', 'золотой гребень-дракон с гранатами']],
  5000: [['a jeweled platinum ring of a lost dynasty', 'платиновый перстень с самоцветами угасшей династии'], ['a gold cup set with emeralds', 'золотой кубок с изумрудами'], ['a jeweled gold scepter', 'золотой скипетр с самоцветами']],
};

// Goods: valuable but bulky things in a stash or a lair.
export const GOODS: Pair[] = [
  ['a silver candlestick', 'серебряный подсвечник'],
  ['a bolt of fine silk', 'отрез тонкого шёлка'],
  ['a cask of old wine', 'бочонок старого вина'],
  ['a pouch of rare spices', 'мешочек редких пряностей'],
  ['a set of good tools in a leather roll', 'набор хороших инструментов в кожаном свёртке'],
  ['a fur cloak', 'меховой плащ'],
  ['a well-made dagger with a bone hilt', 'добротный кинжал с костяной рукоятью'],
  ['a book in an unknown language', 'книга на незнакомом языке'],
  ['a chest of letters and accounts — someone’s secrets', 'сундучок писем и счетов — чьи-то тайны'],
  ['a tapestry rolled into a bundle', 'гобелен, скатанный в рулон'],
  ['a small barrel of lamp oil', 'бочонок лампового масла'],
  ['a silver holy symbol of a forgotten god', 'серебряный символ забытого бога'],
  ['a pair of fine boots, never worn', 'пара отличных сапог, ни разу не надёванных'],
  ['a map of the region with notes in the margins', 'карта края с пометками на полях'],
  ['a lute with a cracked neck', 'лютня с треснувшим грифом'],
  ['bottles of ink and a stack of good parchment', 'склянки чернил и стопка хорошего пергамента'],
];

// What's in the pockets (from the retired table).
export const POCKETS: Pair[] = [
  ['an apple core', 'огрызок яблока'],
  ['a note: “Don’t trust Martha”', 'записка: «Не верь Марте»'],
  ['dice — one is clearly loaded', 'игральные кости — одна явно утяжелена'],
  ['a dried rose', 'засохшая роза'],
  ['a key without a tag', 'ключ без бирки'],
  ['a piece of chalk', 'кусок мела'],
  ['a carved wooden horse', 'деревянная фигурка лошадки'],
  ['a locket with a portrait of a stranger', 'медальон с портретом незнакомки'],
  ['a map of the area with a cross by the river', 'карта местности с крестиком у реки'],
  ['a vial of cloudy liquid', 'пузырёк с мутной жидкостью'],
  ['an IOU in the name of one of the heroes', 'долговая расписка на имя одного из героев'],
  ['an arrowhead wrapped in a rag', 'наконечник стрелы, завёрнутый в тряпицу'],
  ['a ferry ticket', 'билет на паром'],
  ['a handful of dried mushrooms — better not try them', 'горсть сушёных грибов — лучше не пробовать'],
  ['a deck of cards without the queen of spades', 'колода карт без дамы пик'],
  ['a wax seal with a coat of arms', 'восковая печать с гербом'],
  ['a child’s drawing: a house and three figures', 'детский рисунок: дом и три фигуры'],
  ['a whistle only dogs can hear', 'свисток, который слышат только собаки'],
  ['a broken blade with runes', 'обломок клинка с рунами'],
  ['a shopping list written backwards', 'список покупок, написанный задом наперёд'],
  ['a tooth — definitely not human', 'зуб — явно не человеческий'],
  ['a blank sheet of parchment that smells of lemon', 'чистый лист пергамента, пахнущий лимоном'],
  ['a button and a bit of string', 'пуговица и обрывок бечёвки'],
];

// Trinkets and finds (from the retired table).
export const TRINKETS: Pair[] = [
  ['a glass eye that sometimes blinks', 'стеклянный глаз, который иногда моргает'],
  ['a music box without a tune', 'музыкальная шкатулка без мелодии'],
  ['a compass that points not north but to the nearest water', 'компас, указывающий не на север, а на ближайшую воду'],
  ['a quill that writes without ink — but only the truth', 'перо, которое пишет без чернил — но только правду'],
  ['a tiny cage with a dried moth inside', 'крошечная клетка с засохшим мотыльком'],
  ['a coin with the same face on both sides', 'монета с одинаковым профилем на обеих сторонах'],
  ['a bell that rings before rain', 'колокольчик, звенящий перед дождём'],
  ['a six-fingered glove', 'перчатка на шесть пальцев'],
  ['a pebble that is always warm to the touch', 'камешек, всегда тёплый на ощупь'],
  ['a key to a door that no longer exists', 'ключ от двери, которой больше нет'],
  ['an hourglass whose sand falls upward', 'песочные часы, в которых песок сыплется вверх'],
  ['a doll with stitched eyes', 'кукла с зашитыми глазами'],
  ['a hand mirror whose reflection lags a little behind', 'зеркальце, отражение в котором чуть запаздывает'],
  ['a candle that burns with a green flame', 'свеча, горящая зелёным пламенем'],
  ['a bone flute', 'костяная флейта'],
  ['a star chart with one star too many', 'звёздная карта с одной лишней звездой'],
  ['a chess piece: a black queen carved from ivory', 'шахматная фигура: чёрная королева из слоновой кости'],
  ['a ring that won’t come off on the night of the full moon', 'кольцо, которое не снимается в полнолуние'],
  ['a pouch of seeds from an unknown plant', 'мешочек семян неизвестного растения'],
  ['a letter addressed to whoever finds it', 'письмо, адресованное тому, кто его найдёт'],
];

const count = (m: Record<number, Pair[]>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.length]));
export const SIZES = { gems: count(GEMS), art: count(ART), goods: GOODS.length, pockets: POCKETS.length, trinkets: TRINKETS.length };
