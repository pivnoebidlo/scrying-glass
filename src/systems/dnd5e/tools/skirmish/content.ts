// Text of a wilderness encounter, en and ru in pairs, and the creatures of open country: SRD cards of both editions,
// by name (a test checks them against the cards, their challenge and size by the 2024 SRD).
import { WILD_STYLES, type WildStyle } from '../../../../modules/tools/mapgen/layout';

// Open country and the town: a map with no walls round its places.
export const TERRAINS = [...WILD_STYLES, 'town'] as const;
export type Terrain = WildStyle | 'town';

type Pair = readonly [en: string, ru: string];
// [en, ru, challenge, where it lives, side in cells, can be talked to].
export type WildFoe = readonly [en: string, ru: string, cr: number, terrains: string, cells: number, talks: boolean];

export const WILD_FOES: readonly WildFoe[] = [
  ['Giant Crab', 'Гигантский краб', 0.125, 'shore', 1, false], ['Stirge', 'Стирж', 0.125, 'swamp', 1, false],
  ['Bandit', 'Бандит', 0.125, 'forest meadow shore town', 1, true], ['Cultist', 'Культист', 0.125, 'forest swamp town', 1, true],
  ['Wolf', 'Волк', 0.25, 'forest meadow', 1, false], ['Panther', 'Пантера', 0.25, 'forest', 1, false],
  ['Boar', 'Кабан', 0.25, 'forest meadow', 1, false], ['Swarm of Ravens', 'Рой воронов', 0.25, 'forest shore', 1, false],
  ['Giant Frog', 'Гигантская лягушка', 0.25, 'swamp', 1, false], ['Zombie', 'Зомби', 0.25, 'swamp town', 1, false],
  ['Black Bear', 'Чёрный медведь', 0.5, 'forest', 1, false], ['Worg', 'Ворг', 0.5, 'forest meadow', 2, false],
  ['Giant Wasp', 'Гигантская оса', 0.5, 'forest meadow', 1, false], ['Satyr', 'Сатир', 0.5, 'forest', 1, true],
  ['Scout', 'Разведчик', 0.5, 'forest meadow shore town', 1, true], ['Crocodile', 'Крокодил', 0.5, 'swamp', 2, false],
  ['Swarm of Insects', 'Рой насекомых', 0.5, 'swamp', 1, false], ['Dire Wolf', 'Лютый волк', 1, 'forest meadow', 2, false],
  ['Brown Bear', 'Бурый медведь', 1, 'forest', 2, false], ['Giant Spider', 'Гигантский паук', 1, 'forest', 2, false],
  ['Dryad', 'Дриада', 1, 'forest', 1, true], ['Tiger', 'Тигр', 1, 'forest', 2, false], ['Lion', 'Лев', 1, 'meadow', 2, false],
  ['Hippogriff', 'Гиппогриф', 1, 'meadow', 2, false], ['Harpy', 'Гарпия', 1, 'shore', 1, false],
  ['Giant Octopus', 'Гигантский осьминог', 1, 'shore', 2, false], ['Giant Toad', 'Гигантская жаба', 1, 'swamp', 2, false],
  ['Ghoul', 'Упырь', 1, 'swamp town', 1, false], ['Bandit Captain', 'Капитан бандитов', 2, 'forest meadow shore town', 1, true],
  ['Druid', 'Друид', 2, 'forest swamp', 1, true], ['Giant Boar', 'Гигантский кабан', 2, 'forest', 2, false],
  ['Ogre', 'Огр', 2, 'forest meadow swamp', 2, true], ['Griffon', 'Грифон', 2, 'meadow', 2, false],
  ['Ankheg', 'Анхег', 2, 'meadow', 2, false], ['Rhinoceros', 'Носорог', 2, 'meadow', 2, false],
  ['Berserker', 'Берсерк', 2, 'meadow shore town', 1, true], ['Merrow', 'Мерроу', 2, 'shore', 2, true],
  ['Sea Hag', 'Морская карга', 2, 'shore', 1, true], ['Plesiosaurus', 'Плезиозавр', 2, 'shore', 2, false],
  ['Ogre Zombie', 'Огр-зомби', 2, 'swamp', 2, false], ['Owlbear', 'Совомедведь', 3, 'forest', 2, false],
  ['Green Hag', 'Зелёная карга', 3, 'forest swamp', 1, true], ['Knight', 'Рыцарь', 3, 'meadow town', 1, true],
  ['Manticore', 'Мантикора', 3, 'meadow shore', 2, true], ['Wight', 'Умертвие', 3, 'swamp', 1, true],
  ['Elephant', 'Слон', 4, 'meadow', 3, false], ['Black Pudding', 'Чёрная слизь', 4, 'swamp', 2, false],
  ['Chuul', 'Чуул', 4, 'swamp shore', 2, false], ['Hill Giant', 'Холмовой великан', 5, 'forest meadow', 3, true],
  ['Troll', 'Тролль', 5, 'forest swamp', 2, true], ['Bulette', 'Бюлетт', 5, 'meadow', 2, false],
  ['Gorgon', 'Горгона', 5, 'meadow', 2, false], ['Gladiator', 'Гладиатор', 5, 'meadow shore town', 1, true],
  ['Water Elemental', 'Водяной элементаль', 5, 'shore', 2, false], ['Shambling Mound', 'Шатающийся холм', 5, 'swamp', 2, false],
  ['Giant Crocodile', 'Гигантский крокодил', 5, 'swamp', 3, false], ['Otyugh', 'Отиуг', 5, 'swamp', 2, false],
  ['Wyvern', 'Виверна', 6, 'meadow', 2, false], ['Mammoth', 'Мамонт', 6, 'meadow', 3, false], ['Mage', 'Маг', 6, 'meadow shore town', 1, true],
  ['Giant Ape', 'Гигантская обезьяна', 7, 'forest', 3, false], ['Young Black Dragon', 'Молодой чёрный дракон', 7, 'swamp', 2, true],
  ['Assassin', 'Убийца', 8, 'forest meadow shore town', 1, true], ['Young Green Dragon', 'Молодой зелёный дракон', 8, 'forest', 2, true],
  ['Young Bronze Dragon', 'Молодой бронзовый дракон', 8, 'shore', 2, true], ['Hydra', 'Гидра', 8, 'swamp shore', 3, false],
  ['Treant', 'Древень', 9, 'forest', 3, true], ['Roc', 'Рух', 11, 'meadow shore', 4, false], ['Storm Giant', 'Штормовой великан', 13, 'shore', 3, true],
  ['Adult Black Dragon', 'Взрослый чёрный дракон', 14, 'swamp', 3, true], ['Adult Green Dragon', 'Взрослый зелёный дракон', 15, 'forest', 3, true],
  ['Adult Bronze Dragon', 'Взрослый бронзовый дракон', 15, 'shore', 3, true], ['Purple Worm', 'Пурпурный червь', 15, 'meadow', 4, false],
  ['Dragon Turtle', 'Драконья черепаха', 17, 'shore', 4, true], ['Ancient Black Dragon', 'Древний чёрный дракон', 21, 'swamp', 4, true],
  ['Ancient Green Dragon', 'Древний зелёный дракон', 22, 'forest', 4, true], ['Ancient Bronze Dragon', 'Древний бронзовый дракон', 22, 'shore', 4, true],
  ['Kraken', 'Кракен', 23, 'shore', 4, true],
  ['Guard', 'Стражник', 0.125, 'town', 1, true], ['Giant Rat', 'Гигантская крыса', 0.125, 'town', 1, false],
  ['Swarm of Rats', 'Рой крыс', 0.25, 'town', 1, false], ['Shadow', 'Тень', 0.5, 'town', 1, false],
  ['Spy', 'Шпион', 1, 'town', 1, true], ['Imp', 'Имп', 1, 'town', 1, true], ['Animated Armor', 'Оживлённый доспех', 1, 'town', 1, false],
  ['Priest', 'Жрец', 2, 'town', 1, true], ['Gargoyle', 'Горгулья', 2, 'town', 1, true], ['Doppelganger', 'Доппельгангер', 3, 'town', 1, true],
  ['Invisible Stalker', 'Невидимый охотник', 6, 'town', 2, false], ['Oni', 'Они', 7, 'town', 2, true],
  ['Archmage', 'Архимаг', 12, 'town', 1, true], ['Rakshasa', 'Ракшас', 13, 'town', 1, true],
];

// Where the foes stand: on the next place, behind the heroes, along the path, round the heroes' place.
export type FoesAt = 'ahead' | 'behind' | 'flanks' | 'around';
export interface Scene {
  id: string;
  at: FoesAt;
  // The place the heroes start at, the first or the second of three.
  heroes: 0 | 1;
  // It takes foes who can speak.
  talks: boolean;
  title: Pair;
  text: Pair;
  // In a town, when the open-country text will not do.
  inTown?: Pair;
  start: Pair;
}
export const SCENES: readonly Scene[] = [
  {
    id: 'ambush', at: 'flanks', heroes: 0, talks: false,
    title: ['Ambush', 'Засада'],
    text: ['The way ahead narrows, and the enemy lies hidden on both sides of it.', 'Путь впереди сужается, а по обе стороны от него затаился враг.'],
    start: ['The foes’ Stealth against the heroes’ passive Perception: whoever misses them is surprised.', 'Скрытность врагов против пассивной Внимательности героев: кто их не заметил, застигнут врасплох.'],
  },
  {
    id: 'roadblock', at: 'ahead', heroes: 0, talks: true,
    title: ['Roadblock', 'Застава'],
    text: ['The enemy holds the next place in plain sight and will not let anyone by for free.', 'Враг у всех на виду занял следующее место на пути и даром никого не пропустит.'],
    start: ['It begins with talk. A bribe, a threat or a lie: a Charisma check, DC 15. On a failure the talking is over.', 'Всё начинается с разговора. Подкуп, угроза или обман: проверка Харизмы, СЛ 15. При провале разговор окончен.'],
  },
  {
    id: 'camp', at: 'ahead', heroes: 0, talks: false,
    title: ['Lair ahead', 'Логово впереди'],
    text: ['The enemy has settled at the next place, busy with its own affairs, and does not know of the heroes yet.', 'Враг устроился на следующем месте, занят своими делами и о героях пока не знает.'],
    start: ['To creep up: the group’s Stealth against the foes’ passive Perception. They can also be left alone and passed by.', 'Подкрасться: Скрытность группы против пассивной Внимательности врагов. Врага можно и обойти стороной.'],
  },
  {
    id: 'pursuit', at: 'behind', heroes: 1, talks: false,
    title: ['Pursuit', 'Погоня'],
    text: ['Something has been on the heroes’ trail for a long time, and here it catches up with them. The way on is open.', 'Кто-то давно идёт по следу героев и здесь настигает их. Путь дальше открыт.'],
    start: ['The enemy comes from where the heroes came. They can stand and fight or run on to the next place.', 'Враг появляется оттуда, откуда пришли герои. Можно принять бой, а можно бежать к следующему месту.'],
  },
  {
    id: 'surrounded', at: 'around', heroes: 0, talks: false,
    title: ['Surrounded', 'В кольце'],
    text: ['The heroes have stopped to rest. The enemy closes in from every side, and the ring is not yet shut.', 'Герои остановились на привал. Враг подходит со всех сторон, и кольцо ещё не сомкнулось.'],
    inTown: ['The heroes have stopped to catch their breath. The enemy closes in from the side streets, and the ring is not yet shut.', 'Герои остановились перевести дух. Враг подходит из переулков со всех сторон, и кольцо ещё не сомкнулось.'],
    start: ['Whoever is on watch makes a Perception check, DC 15. On a success the heroes hear them coming and are ready.', 'Тот, кто на страже, проходит проверку Внимательности, СЛ 15. При успехе герои слышат врага заранее и готовы к бою.'],
  },
  {
    id: 'parley', at: 'ahead', heroes: 0, talks: true,
    title: ['Chance meeting', 'Случайная встреча'],
    text: ['The heroes and the enemy run into each other by chance. Nobody wants to be the first to start.', 'Герои и враг столкнулись случайно. Никто не хочет начинать первым.'],
    start: ['They are wary but not eager to fight: this can end in peace if the heroes offer what they want.', 'Они настороже, но в бой не рвутся: всё кончится миром, если герои предложат то, что им нужно.'],
  },
];

export const TALKING_MOTIVES: readonly Pair[] = [
  ['They collect a toll for crossing what they call their land.', 'Собирают плату за проход по земле, которую считают своей.'],
  ['They hunt a runaway and suspect everyone.', 'Ищут беглеца и подозревают всех.'],
  ['They were hired to stop someone who looks like the heroes.', 'Наняты перехватить кого-то, похожего на героев.'],
  ['They want what the heroes are carrying.', 'Хотят отнять то, что несут герои.'],
  ['They are running from something themselves and need supplies.', 'Сами бегут от чего-то, и им нужны припасы.'],
  ['They guard something they found nearby not long ago.', 'Охраняют то, что недавно нашли поблизости.'],
  ['They follow an order they do not understand themselves.', 'Исполняют приказ, которого сами не понимают.'],
  ['They seek revenge for a wrong someone else did.', 'Мстят за обиду, которую нанёс кто-то другой.'],
];
export const BEAST_MOTIVES: readonly Pair[] = [
  ['Hunger: the heroes’ scent brought them here.', 'Голод: сюда их привёл запах героев.'],
  ['Young or a nest are close by, and they defend them.', 'Рядом детёныши или гнездо, и они их защищают.'],
  ['These are their hunting grounds, and they do not suffer strangers.', 'Это их угодья, и чужаков здесь не терпят.'],
  ['Something drove them from their usual place, and they are afraid.', 'Что-то выгнало их с обычного места, и они напуганы.'],
  ['They are wounded and furious: a stranger’s weapon has left its mark.', 'Они ранены и в ярости: на теле след чужого оружия.'],
  ['Someone lured them here on purpose.', 'Кто-то нарочно приманил их сюда.'],
];

const COMMON: readonly Pair[] = [
  ['A third party watches the fight and joins the side that is winning.', 'За боем следит кто-то третий и примкнёт к тому, кто побеждает.'],
  ['One of the foes wants out and will talk if given the chance.', 'Один из врагов хочет сбежать и заговорит, если дать ему шанс.'],
  ['After three rounds the noise draws something worse.', 'Через три раунда шум привлекает кого-то похуже.'],
  ['A traveller is caught in the middle and needs saving.', 'Посреди схватки оказался путник, и его надо спасать.'],
  ['The light is failing: after three rounds everything past 6 cells is dimly lit.', 'Темнеет: через три раунда всё дальше 6 клеток в тусклом свете.'],
  ['The foes have fresh tracks of something very large among theirs.', 'Среди следов врага есть свежие следы чего-то очень большого.'],
  ['The foes carry something that belongs to someone the heroes know.', 'У врагов вещь, принадлежащая кому-то из знакомых героев.'],
  ['The foes lose heart once half of them are down.', 'Когда половина врагов падёт, остальные дрогнут.'],
];
const BY_TERRAIN: Record<Terrain, readonly Pair[]> = {
  town: [
    ['The watch arrives in three rounds and takes everyone with a weapon in hand.', 'Через три раунда приходит стража и хватает всех, кто с оружием в руках.'],
    ['Bystanders run in panic and block the street for two rounds.', 'Прохожие в панике бегут и на два раунда перекрывают улицу.'],
    ['A burning lamp falls and a house catches fire: the people inside are shouting for help.', 'Падает горящая лампа, и дом загорается: внутри кричат и зовут на помощь.'],
  ],
  forest: [
    ['A dry thicket catches fire and the flames spread 2 cells every round.', 'Сухая чаща загорается, и огонь расходится на 2 клетки за раунд.'],
    ['An old tree comes down between the fighters when struck hard.', 'От сильного удара старое дерево падает прямо между бойцами.'],
    ['Fog creeps between the trees: past 4 cells everything is heavily obscured.', 'Между деревьями ползёт туман: дальше 4 клеток всё сильно заслонено.'],
  ],
  meadow: [
    ['A dust storm rises: ranged attacks have Disadvantage for two rounds.', 'Поднимается пыльная буря: дальние атаки с помехой два раунда.'],
    ['A panicked herd runs across the field in the third round.', 'На третий раунд через поле несётся обезумевшее стадо.'],
    ['Dry grass catches fire and the wind drives it toward the heroes.', 'Сухая трава загорается, и ветер гонит пламя на героев.'],
  ],
  shore: [
    ['The tide comes in: every round the water takes 1 cell of the beach.', 'Начинается прилив: каждый раунд вода забирает 1 клетку берега.'],
    ['A boat lies on the sand, the one way off for someone.', 'На песке лежит лодка, для кого-то единственный путь отсюда.'],
    ['A big wave hits the beach: Strength save, DC 13, or fall Prone.', 'На берег обрушивается большая волна: спасбросок Силы, СЛ 13, иначе падение ничком.'],
  ],
  swamp: [
    ['A patch of bog swallows whoever stops on it: Strength check, DC 13, to get out.', 'Участок топи затягивает того, кто на нём остановился: проверка Силы, СЛ 13, чтобы выбраться.'],
    ['Marsh gas drifts in: fire here explodes for 2d6 damage.', 'Наплывает болотный газ: огонь здесь взрывается на 2к6 урона.'],
    ['Biting flies swarm everyone who stands still: Disadvantage on concentration.', 'Гнус облепляет всех, кто стоит на месте: помеха на концентрацию.'],
  ],
};
export const complicationsOf = (terrain: Terrain): readonly Pair[] => [...COMMON, ...BY_TERRAIN[terrain]];

// What the map's ground means at the table.
export const GROUND: Record<Terrain, Pair> = {
  town: ['Corners and walls give half or three-quarters cover. Climbing to a roof: Athletics, DC 12.', 'Углы и стены дают укрытие на ½ или ¾. Забраться на крышу: Атлетика, СЛ 12.'],
  forest: ['Trees give half cover; the undergrowth off the paths is difficult terrain.', 'Деревья дают укрытие на ½; подлесок вне троп считается труднопроходимой местностью.'],
  meadow: ['Open ground: the rare trees and boulders give half cover. A river is difficult terrain.', 'Открытое место: редкие деревья и валуны дают укрытие на ½. Река считается труднопроходимой местностью.'],
  shore: ['Boulders and trees give half cover. Sand and shallow water are difficult terrain.', 'Валуны и деревья дают укрытие на ½. Песок и мелководье считаются труднопроходимой местностью.'],
  swamp: ['Standing water and fords are difficult terrain; the firm ground is the clearings and paths.', 'Стоячая вода и броды считаются труднопроходимой местностью; твёрдая земля есть только на полянах и тропах.'],
};
