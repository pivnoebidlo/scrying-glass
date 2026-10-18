// Magic item generator content, written for the app — both languages side by side. Russian names are «{object}
// {owner}» with the owner in the genitive, so nothing has to agree; the texts call the item «вещь».
import type { RelicKind } from './generate';

type Pair = [en: string, ru: string];

export const OBJECTS: Record<RelicKind, Pair[]> = {
  weapon: [['Sword', 'Меч'], ['Dagger', 'Кинжал'], ['Axe', 'Топор'], ['Spear', 'Копьё'], ['Bow', 'Лук'], ['Hammer', 'Молот'], ['Mace', 'Булава'], ['Scimitar', 'Ятаган']],
  armor: [['Shield', 'Щит'], ['Helm', 'Шлем'], ['Breastplate', 'Кираса'], ['Mail', 'Кольчуга'], ['Bracers', 'Наручи'], ['Gauntlets', 'Латные перчатки']],
  jewelry: [['Ring', 'Кольцо'], ['Amulet', 'Амулет'], ['Crown', 'Венец'], ['Brooch', 'Брошь'], ['Earring', 'Серьга'], ['Pendant', 'Подвеска']],
  wand: [['Wand', 'Волшебная палочка'], ['Staff', 'Посох'], ['Rod', 'Жезл'], ['Orb', 'Сфера']],
  clothing: [['Cloak', 'Плащ'], ['Boots', 'Сапоги'], ['Gloves', 'Перчатки'], ['Hat', 'Шляпа'], ['Belt', 'Пояс'], ['Mask', 'Маска']],
  wondrous: [['Lantern', 'Фонарь'], ['Horn', 'Рог'], ['Mirror', 'Зеркало'], ['Bell', 'Колокольчик'], ['Chalice', 'Чаша'], ['Book', 'Книга'], ['Box', 'Шкатулка'], ['Compass', 'Компас']],
};

export const OWNERS: Pair[] = [
  ['of the Drowned Queen', 'Утонувшей королевы'], ['of the Nameless Guard', 'Безымянного стража'], ['of Seven Winds', 'Семи ветров'],
  ['of the Last King', 'Последнего короля'], ['of the Ash Witch', 'Пепельной ведьмы'], ['of the Hollow Moon', 'Пустой луны'],
  ['of the First Snow', 'Первого снега'], ['of the Laughing Thief', 'Смеющегося вора'], ['of the Sunken Temple', 'Затонувшего храма'],
  ['of the Iron Oath', 'Железной клятвы'], ['of the Thousand Eyes', 'Тысячи глаз'], ['of the Silent Bell', 'Немого колокола'],
  ['of the Wolf Prince', 'Волчьего принца'], ['of Long Night', 'Долгой ночи'], ['of the Red Harvest', 'Красной жатвы'],
  ['of the Weeping Saint', 'Плачущей святой'], ['of the Broken Crown', 'Сломанной короны'], ['of the Deep Roads', 'Глубинных дорог'],
];

export const MATERIALS: Pair[] = [
  ['blackened silver', 'почерневшее серебро'], ['bone bound with gold wire', 'кость, оплетённая золотой проволокой'], ['dark wood as hard as stone', 'тёмное дерево, твёрдое как камень'],
  ['pale green bronze', 'бледно-зелёная бронза'], ['meteoric iron', 'метеоритное железо'], ['milky crystal', 'молочный хрусталь'],
  ['dragon scale', 'драконья чешуя'], ['obsidian', 'обсидиан'], ['mother-of-pearl', 'перламутр'], ['cold blue steel', 'холодная синеватая сталь'],
  ['red gold', 'красное золото'], ['petrified wood', 'окаменелое дерево'],
];

export const DETAILS: Pair[] = [
  ['runes that glow at dusk', 'руны, которые светятся в сумерках'], ['a crack mended with gold', 'трещина, заделанная золотом'],
  ['a tiny face carved where no one looks', 'крошечное лицо, вырезанное там, куда никто не смотрит'], ['a gem that seems to follow you', 'камень, который будто следит за вами'],
  ['an inscription in a dead language', 'надпись на мёртвом языке'], ['old bloodstains that will not wash off', 'старые пятна крови, которые не отмываются'],
  ['a pattern of waves that seem to move', 'узор из волн, которые будто движутся'], ['tiny bells that never ring', 'крошечные колокольчики, которые никогда не звенят'],
  ['a maker’s mark of a closed eye', 'клеймо мастера — закрытый глаз'], ['frost on it even in summer', 'иней — даже летом'],
  ['scratched tally marks, dozens of them', 'выцарапанные зарубки — их десятки'], ['a lock of hair braided into it', 'вплетённая прядь волос'],
];

// Minor properties: a small magic of its own (in D&D — on top of the SRD item).
export const PROPERTIES: Pair[] = [
  ['It glows like a candle when its owner wishes.', 'Вещь светится, как свеча, когда того хочет владелец.'],
  ['It is always warm to the touch, even in snow.', 'Вещь всегда тёплая на ощупь, даже в снегу.'],
  ['It hums quietly when goblins or orcs are within a mile.', 'Вещь тихо гудит, когда в миле от неё гоблины или орки.'],
  ['It cannot get wet; water runs off it.', 'Вещь не намокает — вода стекает с неё.'],
  ['Its owner always knows which way is north.', 'Владелец всегда знает, где север.'],
  ['It returns to its owner’s hand if dropped within ten feet.', 'Вещь возвращается в руку, если упала не дальше десяти футов.'],
  ['It makes no sound, whatever happens to it.', 'Вещь не издаёт ни звука, что бы с ней ни происходило.'],
  ['Its owner can understand the speech of birds — but not answer.', 'Владелец понимает речь птиц — но ответить не может.'],
  ['It changes colour to match its owner’s mood.', 'Вещь меняет цвет вместе с настроением владельца.'],
  ['Once a day it can whisper a word to anyone within thirty feet.', 'Раз в день вещь может прошептать слово любому в тридцати футах.'],
  ['Its owner never catches a cold.', 'Владелец никогда не простужается.'],
  ['It smells of a different flower every morning.', 'Каждое утро вещь пахнет новым цветком.'],
  ['Undead within sixty feet make it frosty.', 'Рядом с нежитью (до шестидесяти футов) вещь покрывается инеем.'],
  ['It cannot be stolen: it grows too heavy for anyone but its owner.', 'Вещь не украсть: в чужих руках она становится неподъёмной.'],
];

export const CREATORS: Pair[] = [
  ['dwarven smiths of a fallen hold', 'дварфийские кузнецы павшей крепости'], ['an elven queen for her champion', 'эльфийская королева — для своего защитника'],
  ['a mad wizard who wanted to live forever', 'безумный маг, мечтавший жить вечно'], ['priests of a forgotten god', 'жрецы забытого бога'],
  ['a giant who made it small on purpose', 'великан, нарочно сделавший его маленьким'], ['a fey bargain gone wrong', 'сделка с феями, которая пошла не так'],
  ['a hag who wanted to be loved', 'карга, которой хотелось, чтобы её любили'], ['a guild of thieves, for their best', 'гильдия воров — для лучшего из своих'],
  ['an apprentice who never got to be a master', 'подмастерье, так и не ставший мастером'], ['nobody knows; it was found in a dragon’s hoard', 'неизвестно кто — его нашли в драконьем кладе'],
];

export const HISTORIES: Pair[] = [
  ['It was made for a war that never came.', 'Вещь сделали для войны, которая так и не началась.'],
  ['It was stolen from a temple, and the priests still look for it.', 'Вещь украли из храма, и жрецы до сих пор её ищут.'],
  ['Its last owner died a hero — or so the songs say.', 'Последний владелец погиб героем — так поётся в песнях.'],
  ['It changed hands at a card table more times than anyone can count.', 'Вещь столько раз переходила из рук в руки за карточным столом, что никто не сосчитает.'],
  ['It lay a century at the bottom of a lake.', 'Сто лет вещь пролежала на дне озера.'],
  ['A noble family lost it and would pay to get it back.', 'Знатный род её потерял и хорошо заплатит за возвращение.'],
  ['It was buried with a king and dug up by robbers.', 'Вещь похоронили с королём, а грабители выкопали.'],
  ['It is one of a pair; the other is still out there.', 'Это одна вещь из пары; вторая где-то есть.'],
  ['It was a gift between enemies to seal a peace that did not last.', 'Вещь подарили враги в знак мира, который не продержался.'],
  ['A prophecy mentions it — and its next owner.', 'О ней говорит пророчество — и о её следующем владельце.'],
  ['It was pawned for a meal and never bought back.', 'Вещь заложили за обед и так и не выкупили.'],
  ['It was found inside a fish.', 'Вещь нашли в брюхе рыбы.'],
];

export const QUIRKS: Pair[] = [
  ['Its owner hears faint singing in quiet rooms.', 'В тишине владелец слышит едва различимое пение.'],
  ['It must be polished every day or it sulks — its magic fails at the worst moment.', 'Вещь надо полировать каждый день, иначе она обижается — и магия отказывает в худший момент.'],
  ['Its owner becomes unusually honest.', 'Владелец становится непривычно честным.'],
  ['Cats follow its owner everywhere.', 'За владельцем повсюду ходят кошки.'],
  ['Its owner dreams of the item’s previous owners.', 'Владельцу снятся прежние хозяева вещи.'],
  ['It feels lighter in the hands of the brave.', 'В руках храбреца вещь легче.'],
  ['Its owner craves salt.', 'Владельца тянет на солёное.'],
  ['It is jealous of other magic items.', 'Вещь ревнует к другим магическим вещам.'],
  ['Flowers wilt near it.', 'Рядом с вещью вянут цветы.'],
  ['It fogs up whenever someone lies nearby.', 'Вещь запотевает, когда рядом лгут.'],
];

// A curse (sometimes): what the item does to its owner.
export const CURSES: Pair[] = [
  ['Its owner cannot willingly part with it.', 'Владелец не может по своей воле с ней расстаться.'],
  ['Every full moon its owner loses a memory.', 'Каждое полнолуние владелец теряет одно воспоминание.'],
  ['Its owner’s reflection slowly stops matching them.', 'Отражение владельца понемногу перестаёт с ним совпадать.'],
  ['Animals fear and hate its owner.', 'Животные боятся и ненавидят владельца.'],
  ['Its previous owner’s ghost comes looking for it.', 'Призрак прежнего владельца приходит за ней.'],
  ['Its owner can no longer sleep under a roof.', 'Владелец больше не может спать под крышей.'],
  ['Gold its owner touches turns to lead by morning.', 'Золото, которого коснулся владелец, к утру становится свинцом.'],
  ['Its owner speaks only in whispers.', 'Владелец может говорить только шёпотом.'],
];
