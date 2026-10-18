// Shop generator content, written for the app — both languages side by side. Prices of ordinary goods (in copper)
// follow the SRD equipment tables; for the rest they are our own.
import type { ShopType } from './generate';

type Pair = [en: string, ru: string];
export type Good = [en: string, ru: string, cp: number];

export const SHOP_NAMES: Record<ShopType, Pair[]> = {
  general: [['The Full Pack', '«Полный мешок»'], ['Odds and Ends', '«Всякая всячина»'], ['The Road Ahead', '«Дальняя дорога»'], ['Everything You Need', '«Всё, что нужно»'], ['The Crooked Shelf', '«Кривая полка»'], ['Rope and Lantern', '«Верёвка и фонарь»']],
  smith: [['The Ringing Anvil', '«Звонкая наковальня»'], ['Iron and Oak', '«Железо и дуб»'], ['The Red Forge', '«Красный горн»'], ['Steel Answer', '«Стальной ответ»'], ['The Dented Helm', '«Мятый шлем»'], ['Hammer and Tongs', '«Молот и клещи»']],
  alchemist: [['The Green Bottle', '«Зелёная склянка»'], ['Remedies and Poisons', '«Снадобья и яды»'], ['The Bubbling Flask', '«Булькающая колба»'], ['Root and Ash', '«Корень и пепел»'], ['The Sleeping Toad', '«Спящая жаба»'], ['Drop by Drop', '«Капля за каплей»']],
  magic: [['The Seventh Star', '«Седьмая звезда»'], ['Curious Things', '«Любопытные вещицы»'], ['The Silver Owl', '«Серебряная сова»'], ['Enchantments by Weight', '«Чары на вес»'], ['The Locked Chest', '«Запертый сундук»'], ['Moonlight and Dust', '«Лунный свет и пыль»']],
  books: [['The Ink Well', '«Чернильница»'], ['Maps and Margins', '«Карты и поля»'], ['The Dusty Page', '«Пыльная страница»'], ['Quill and Candle', '«Перо и свеча»'], ['The Last Chapter', '«Последняя глава»'], ['Paper Roads', '«Бумажные дороги»']],
  curios: [['Second Hand', '«Вторые руки»'], ['Treasures of the Past', '«Сокровища былого»'], ['The Magpie', '«Сорока»'], ['No Questions Asked', '«Без лишних вопросов»'], ['Lost and Found', '«Потеряно и найдено»'], ['The Cluttered Attic', '«Пыльный чердак»']],
};

export const SHOP_LOOKS: Record<ShopType, Pair[]> = {
  general: [
    ['Shelves to the ceiling, sacks on the floor, and a ladder that wobbles.', 'Полки до потолка, мешки на полу и шаткая лестница.'],
    ['A narrow shop that smells of tar, soap and dried apples.', 'Узкая лавка, где пахнет дёгтем, мылом и сушёными яблоками.'],
    ['Goods hang from hooks in the ceiling; you have to duck.', 'Товары висят на крюках под потолком — приходится пригибаться.'],
  ],
  smith: [
    ['The heat of the forge hits you at the door; sparks fly in the dark.', 'Жар горна бьёт в лицо уже у двери; в полумраке летят искры.'],
    ['Weapons on the walls, armour on wooden dummies, a grindstone squealing in the yard.', 'Оружие по стенам, доспехи на деревянных болванах, во дворе визжит точило.'],
    ['A neat workshop: every tool in its place, every blade oiled.', 'Аккуратная мастерская: каждый инструмент на месте, каждый клинок смазан.'],
  ],
  alchemist: [
    ['Jars of murky liquids, dried lizards and a smell that makes your eyes water.', 'Банки с мутными жидкостями, сушёные ящерицы и запах, от которого слезятся глаза.'],
    ['Bundles of herbs hang from the beams; something bubbles in the back room.', 'С балок свисают пучки трав; в задней комнате что-то булькает.'],
    ['A clean white room with labelled shelves — and one shelf labelled “Do not touch”.', 'Чистая белая комната, полки подписаны — а на одной написано «Не трогать».'],
  ],
  magic: [
    ['The air tingles; objects on the shelves hum quietly to themselves.', 'Воздух покалывает кожу; вещи на полках тихонько гудят.'],
    ['Glass cases, velvet cushions and a doorbell that rings before you touch it.', 'Стеклянные витрины, бархатные подушечки и колокольчик, который звенит раньше, чем вы касаетесь двери.'],
    ['A cramped tower room full of dust, candles and things that move when you are not looking.', 'Тесная комната в башне — пыль, свечи и вещи, которые двигаются, пока на них не смотрят.'],
  ],
  books: [
    ['Stacks of books on every surface; a cat sleeps on the atlases.', 'Стопки книг на всех поверхностях; на атласах спит кот.'],
    ['Maps cover the walls; a magnifying glass lies on every table.', 'Стены увешаны картами; на каждом столе лежит лупа.'],
    ['Silence, candlelight and the smell of old paper.', 'Тишина, свечи и запах старой бумаги.'],
  ],
  curios: [
    ['A jumble of furniture, weapons, portraits and stuffed animals — all for sale.', 'Груда мебели, оружия, портретов и чучел — всё продаётся.'],
    ['A back-alley door, a curtain, and a counter with a bell nobody answers at once.', 'Дверь в подворотне, занавеска и прилавок с колокольчиком, на который не сразу отзываются.'],
    ['Everything here once belonged to someone else, and some of it still does.', 'Всё здесь когда-то принадлежало кому-то другому, а кое-что — до сих пор.'],
  ],
};

export const GOODS: Record<Exclude<ShopType, 'magic'>, Good[]> = {
  general: [
    ['Rope, hempen (50 feet)', 'Пеньковая верёвка (50 футов)', 100], ['Torch', 'Факел', 1], ['Rations (1 day)', 'Рацион (1 день)', 50], ['Bedroll', 'Спальник', 100],
    ['Hooded lantern', 'Закрытый фонарь', 500], ['Oil (flask)', 'Масло (фляга)', 10], ['Tinderbox', 'Трутница', 50], ['Waterskin', 'Бурдюк', 20],
    ['Backpack', 'Рюкзак', 200], ['Crowbar', 'Ломик', 200], ['Shovel', 'Лопата', 200], ['Blanket', 'Одеяло', 50], ['Iron pot', 'Железный котелок', 200],
    ['Fishing tackle', 'Рыболовные снасти', 100], ['Hunting trap', 'Капкан', 500], ['Steel mirror', 'Стальное зеркальце', 500], ['Grappling hook', 'Крюк-кошка', 200],
    ['Chain (10 feet)', 'Цепь (10 футов)', 500], ['Manacles', 'Кандалы', 200], ['Caltrops (bag)', 'Мешочек шипов', 100], ['Candle', 'Свеча', 1], ['Soap', 'Мыло', 2],
    ['Chalk', 'Мел', 1], ['Sack', 'Мешок', 1], ['Signal whistle', 'Сигнальный свисток', 5],
  ],
  smith: [
    ['Dagger', 'Кинжал', 200], ['Handaxe', 'Ручной топор', 500], ['Mace', 'Булава', 500], ['Spear', 'Копьё', 100], ['Shortsword', 'Короткий меч', 1000],
    ['Longsword', 'Длинный меч', 1500], ['Battleaxe', 'Боевой топор', 1000], ['Warhammer', 'Боевой молот', 1500], ['Greatsword', 'Двуручный меч', 5000],
    ['Rapier', 'Рапира', 2500], ['Shortbow', 'Короткий лук', 2500], ['Longbow', 'Длинный лук', 5000], ['Light crossbow', 'Лёгкий арбалет', 2500],
    ['Arrows (20)', 'Стрелы (20)', 100], ['Shield', 'Щит', 1000], ['Leather armor', 'Кожаный доспех', 1000], ['Studded leather armor', 'Проклёпанный кожаный доспех', 4500],
    ['Chain shirt', 'Кольчужная рубаха', 5000], ['Scale mail', 'Чешуйчатый доспех', 5000], ['Chain mail', 'Кольчуга', 7500], ['Breastplate', 'Кираса', 40000],
    ['Splint armor', 'Наборный доспех', 20000], ['Half plate armor', 'Полулаты', 75000], ['Plate armor', 'Латы', 150000],
  ],
  alchemist: [
    ['Potion of Healing', 'Зелье лечения', 5000], ['Antitoxin', 'Противоядие', 5000], ['Acid (vial)', 'Кислота (флакон)', 2500], ['Alchemist’s fire (flask)', 'Алхимический огонь (фляга)', 5000],
    ['Holy water (flask)', 'Святая вода (фляга)', 2500], ['Healer’s kit', 'Набор целителя', 500], ['Herbalism kit', 'Набор травника', 500], ['Perfume (vial)', 'Духи (флакон)', 500],
    ['Basic poison (vial)', 'Простой яд (флакон)', 10000], ['A salve for bruises', 'Мазь от ушибов', 100], ['Tea against nightmares', 'Чай от кошмаров', 20],
    ['Smelling salts', 'Нюхательная соль', 50], ['A love potion — probably fake', 'Приворотное зелье — скорее всего, подделка', 1000], ['Insect repellent', 'Средство от мошкары', 30],
    ['Hair dye of any colour', 'Краска для волос любого цвета', 200], ['A tonic “for courage”', 'Настойка «для храбрости»', 100],
  ],
  books: [
    ['Blank book', 'Чистая книга', 2500], ['Map of the region', 'Карта края', 100], ['Spellbook (blank)', 'Книга заклинаний (чистая)', 5000], ['Ink (1 ounce bottle)', 'Чернила (бутылочка)', 1000],
    ['Ink pen', 'Перо', 2], ['Parchment (one sheet)', 'Пергамент (лист)', 10], ['Sealing wax', 'Сургуч', 50], ['Scroll case', 'Футляр для свитков', 100],
    ['A bestiary of the northern wilds', 'Бестиарий северных земель', 2500], ['A history of the local lords', 'История местных лордов', 1000], ['A sea chart', 'Морская карта', 500],
    ['A treatise on dragons (mostly wrong)', 'Трактат о драконах (в основном ошибочный)', 1500], ['A book of children’s tales', 'Книга детских сказок', 500],
    ['A cookery book', 'Поваренная книга', 500], ['A prayer book', 'Молитвенник', 1000], ['A star atlas', 'Звёздный атлас', 3000], ['A grammar of Elvish', 'Грамматика эльфийского', 2000],
  ],
  curios: [
    ['A silver hand mirror', 'Серебряное зеркальце', 2500], ['An old sword with a notched blade', 'Старый меч с зазубренным клинком', 800], ['A music box', 'Музыкальная шкатулка', 1500],
    ['A stuffed owlbear head', 'Чучело головы совомедведя', 4000], ['A jeweled snuffbox', 'Табакерка с камешками', 3000], ['Ivory chess pieces (one missing)', 'Шахматы из слоновой кости (без одной фигуры)', 2000],
    ['A creepy porcelain doll', 'Жутковатая фарфоровая кукла', 200], ['An hourglass', 'Песочные часы', 2500], ['A ship’s sextant', 'Корабельный секстант', 3000], ['A merchant’s scale', 'Купеческие весы', 500],
    ['A lute with a new string', 'Лютня с новой струной', 3500], ['A portrait of an unknown noble', 'Портрет неизвестного вельможи', 1000], ['A helmet with a dent', 'Шлем с вмятиной', 600],
    ['A locked box without a key', 'Запертая шкатулка без ключа', 500], ['A spyglass', 'Подзорная труба', 100000], ['A deck of fortune-telling cards', 'Колода гадальных карт', 300],
  ],
};

export const QUIRKS: Pair[] = [
  ['A parrot announces every customer — rudely.', 'Попугай объявляет каждого покупателя — грубо.'],
  ['Prices change with the owner’s mood.', 'Цены меняются вместе с настроением хозяина.'],
  ['Haggling is welcome; refusing to haggle is an insult.', 'Торговаться здесь принято; отказ торговаться — оскорбление.'],
  ['Everything is sold only in pairs.', 'Всё продаётся только парами.'],
  ['The shop is open only at night.', 'Лавка открыта только по ночам.'],
  ['Payment in stories is accepted, if the story is good.', 'Принимается оплата историями — если история хорошая.'],
  ['A guard dog sleeps across the doorway and must be stepped over.', 'Поперёк порога спит сторожевой пёс — приходится перешагивать.'],
  ['Every purchase is wrapped in old wanted posters.', 'Каждую покупку заворачивают в старые объявления о розыске.'],
  ['The owner buys anything — and asks no questions.', 'Хозяин покупает что угодно — и не задаёт вопросов.'],
  ['There is a discount for anyone who can name the owner’s cat.', 'Скидка тому, кто угадает имя хозяйского кота.'],
  ['A rival shop opposite sells everything a copper cheaper.', 'Лавка напротив продаёт всё на медяк дешевле.'],
  ['Regulars get a cup of tea; strangers get watched.', 'Постоянным — чашка чая; чужакам — пристальный взгляд.'],
];

export const HOOKS: Pair[] = [
  ['The last delivery never arrived; the owner pays well to find the cart.', 'Последний обоз так и не пришёл; хозяин хорошо заплатит, если его найдут.'],
  ['Someone keeps breaking in at night, but nothing is ever stolen.', 'Кто-то по ночам вламывается в лавку, но ничего не пропадает.'],
  ['The owner needs a rare ingredient from a dangerous place.', 'Хозяину нужен редкий товар из опасного места.'],
  ['A local gang demands a share of the profits.', 'Местная банда требует долю с выручки.'],
  ['One item for sale was stolen from one of the heroes’ friends.', 'Одна из вещей на продажу украдена у друга кого-то из героев.'],
  ['The owner is selling up and leaving town in a hurry — why?', 'Хозяин распродаёт всё и спешно уезжает — почему?'],
  ['A customer bought something here yesterday and was found dead this morning.', 'Покупатель, взявший здесь вчера одну вещь, утром найден мёртвым.'],
  ['The owner offers a big discount in exchange for delivering a sealed package.', 'Хозяин даёт большую скидку, если доставить запечатанный свёрток.'],
  ['The guild wants this shop closed and is looking for an excuse.', 'Гильдия хочет закрыть лавку и ищет повод.'],
  ['The owner’s apprentice has disappeared with the account book.', 'Подмастерье хозяина исчез вместе с расходной книгой.'],
];

// Outside D&D the magic shop sells curiosities without prices (the NPC generator's magic trinkets).
