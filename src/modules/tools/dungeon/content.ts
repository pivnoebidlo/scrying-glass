// Dungeon generator content, written for the app — both languages side by side. Creatures are SRD cards: the names as
// in the SRD of each language (present in both editions; a test checks them), with the challenge rating and the
// dungeon types they fit.
import type { DungeonType } from './generate';

type Pair = [en: string, ru: string];

export const PLACES: Record<DungeonType, Pair[]> = {
  tomb: [['Tomb', 'Гробница'], ['Crypt', 'Склеп'], ['Barrow', 'Курган']],
  cave: [['Caves', 'Пещеры'], ['Grotto', 'Грот'], ['Den', 'Логово']],
  mine: [['Mine', 'Рудник'], ['Shafts', 'Шахты'], ['Delvings', 'Выработки']],
  temple: [['Temple', 'Храм'], ['Sanctum', 'Святилище'], ['Shrine', 'Капище']],
  fortress: [['Fortress', 'Крепость'], ['Keep', 'Цитадель'], ['Stronghold', 'Твердыня']],
  tower: [['Tower', 'Башня'], ['Laboratory', 'Лаборатория'], ['Spire', 'Шпиль']],
  sewer: [['Sewers', 'Стоки'], ['Cisterns', 'Цистерны'], ['Catacombs', 'Катакомбы']],
  ruins: [['Ruins', 'Руины'], ['Halls', 'Чертоги'], ['Undercity', 'Подгород']],
};

export type Monster = [en: string, ru: string, cr: number, types: string];
export const MONSTERS: Monster[] = [
  ['Skeleton', 'Скелет', 0.25, 'tomb ruins fortress'], ['Zombie', 'Зомби', 0.25, 'tomb ruins sewer'],
  ['Giant Rat', 'Гигантская крыса', 0.125, 'sewer ruins mine cave'], ['Swarm of Rats', 'Рой крыс', 0.25, 'sewer ruins'],
  ['Stirge', 'Стирж', 0.125, 'cave ruins'], ['Swarm of Bats', 'Рой летучих мышей', 0.25, 'cave mine'],
  ['Bandit', 'Бандит', 0.125, 'fortress ruins'], ['Cultist', 'Культист', 0.125, 'temple tomb'],
  ['Violet Fungus', 'Фиолетовый гриб', 0.25, 'cave mine'], ['Darkmantle', 'Тёмная мантия', 0.5, 'cave mine'],
  ['Gray Ooze', 'Серая слизь', 0.5, 'sewer cave'], ['Rust Monster', 'Ржавник', 0.5, 'mine cave'],
  ['Shadow', 'Тень', 0.5, 'tomb temple ruins'], ['Worg', 'Ворг', 0.5, 'cave fortress'],
  ['Giant Spider', 'Гигантский паук', 1, 'cave ruins'], ['Ghoul', 'Упырь', 1, 'tomb sewer'],
  ['Specter', 'Спектр', 1, 'tomb tower ruins'], ['Death Dog', 'Пёс смерти', 1, 'ruins fortress'],
  ['Imp', 'Имп', 1, 'tower temple'], ['Spy', 'Шпион', 1, 'fortress tower'],
  ['Gelatinous Cube', 'Желатиновый куб', 2, 'ruins tomb sewer'], ['Ochre Jelly', 'Охровый студень', 2, 'sewer cave'],
  ['Mimic', 'Мимик', 2, 'tower ruins tomb'], ['Grick', 'Грик', 2, 'cave mine'], ['Ogre', 'Огр', 2, 'cave fortress'],
  ['Gargoyle', 'Горгулья', 2, 'temple tower ruins'], ['Bandit Captain', 'Капитан бандитов', 2, 'fortress'],
  ['Ettercap', 'Эттеркап', 2, 'cave'], ['Priest', 'Жрец', 2, 'temple'], ['Gibbering Mouther', 'Бормочущая пасть', 2, 'sewer cave'],
  ['Minotaur Skeleton', 'Скелет минотавра', 2, 'tomb ruins'], ['Ogre Zombie', 'Огр-зомби', 2, 'tomb'],
  ['Wight', 'Умертвие', 3, 'tomb'], ['Mummy', 'Мумия', 3, 'tomb temple'], ['Basilisk', 'Василиск', 3, 'cave ruins'],
  ['Knight', 'Рыцарь', 3, 'fortress'], ['Doppelganger', 'Доппельгангер', 3, 'fortress tower'],
  ['Hell Hound', 'Адская гончая', 3, 'temple fortress'], ['Owlbear', 'Совомедведь', 3, 'cave ruins'],
  ['Ghost', 'Призрак', 4, 'tomb ruins tower'], ['Black Pudding', 'Чёрная слизь', 4, 'sewer cave'], ['Ettin', 'Эттин', 4, 'cave fortress'],
  ['Troll', 'Тролль', 5, 'cave sewer'], ['Otyugh', 'Отиуг', 5, 'sewer'], ['Wraith', 'Тень смерти', 5, 'tomb'],
  ['Hill Giant', 'Холмовой великан', 5, 'cave fortress'], ['Vampire Spawn', 'Порождение вампира', 5, 'tomb fortress'],
  ['Flesh Golem', 'Голем из плоти', 5, 'tower'], ['Night Hag', 'Ночная карга', 5, 'tower temple'], ['Roper', 'Веревник', 5, 'cave mine'],
  ['Xorn', 'Зорн', 5, 'mine cave'], ['Earth Elemental', 'Земляной элементаль', 5, 'mine'], ['Bulette', 'Бюлетт', 5, 'mine cave'],
  ['Gladiator', 'Гладиатор', 5, 'fortress'], ['Mage', 'Маг', 6, 'tower'], ['Medusa', 'Медуза', 6, 'ruins temple'],
  ['Drider', 'Драйдер', 6, 'cave'], ['Chimera', 'Химера', 6, 'ruins'], ['Shield Guardian', 'Страж-щит', 7, 'tower'],
  ['Young Black Dragon', 'Молодой чёрный дракон', 7, 'sewer cave'], ['Stone Giant', 'Каменный великан', 7, 'mine cave'],
  ['Assassin', 'Убийца', 8, 'fortress'], ['Cloaker', 'Плащеносец', 8, 'cave'], ['Hydra', 'Гидра', 8, 'sewer cave'],
  ['Spirit Naga', 'Духовная нага', 8, 'temple ruins'], ['Chain Devil', 'Цепной дьявол', 8, 'temple fortress'],
  ['Young Green Dragon', 'Молодой зелёный дракон', 8, 'ruins'], ['Clay Golem', 'Глиняный голем', 9, 'tower temple'],
  ['Bone Devil', 'Костяной дьявол', 9, 'temple'], ['Fire Giant', 'Огненный великан', 9, 'fortress mine'],
  ['Stone Golem', 'Каменный голем', 10, 'tower tomb'], ['Guardian Naga', 'Нага-страж', 10, 'temple tomb'],
  ['Aboleth', 'Аболет', 10, 'sewer cave'], ['Young Red Dragon', 'Молодой красный дракон', 10, 'cave mine'],
  ['Behir', 'Бехир', 11, 'cave'], ['Horned Devil', 'Рогатый дьявол', 11, 'temple fortress'], ['Archmage', 'Архимаг', 12, 'tower'],
  ['Rakshasa', 'Ракшас', 13, 'fortress tower'], ['Adult Black Dragon', 'Взрослый чёрный дракон', 14, 'sewer ruins'],
  ['Mummy Lord', 'Повелитель мумий', 15, 'tomb temple'], ['Purple Worm', 'Пурпурный червь', 15, 'mine cave'],
  ['Iron Golem', 'Железный голем', 16, 'tower fortress'], ['Marilith', 'Марилит', 16, 'temple'],
  ['Adult Red Dragon', 'Взрослый красный дракон', 17, 'cave mine'], ['Balor', 'Балор', 19, 'temple'],
  ['Pit Fiend', 'Ямный дьявол', 20, 'temple fortress'], ['Lich', 'Лич', 21, 'tower tomb'], ['Ancient Red Dragon', 'Древний красный дракон', 24, 'cave'],
];

export const BUILDERS: Pair[] = [
  ['Dwarves of a clan that died out', 'Дварфы вымершего клана'], ['A necromancer who wanted an army', 'Некромант, мечтавший об армии'],
  ['An empire that no one remembers', 'Империя, которую никто не помнит'], ['A cult of a sleeping god', 'Культ спящего бога'],
  ['A paranoid noble family', 'Знатный род, повсюду видевший заговоры'], ['Smugglers, over generations', 'Несколько поколений контрабандистов'],
  ['Nature itself, and something that moved in later', 'Сама природа — и то, что поселилось там позже'], ['Giants, long before people came', 'Великаны, задолго до прихода людей'],
];

export const FATES: Pair[] = [
  ['It was sealed after a plague.', 'Подземелье запечатали после мора.'], ['Its masters fled from something they woke.', 'Хозяева бежали от того, что сами разбудили.'],
  ['An earthquake opened it again a month ago.', 'Месяц назад землетрясение снова открыло вход.'], ['It was abandoned when the gold ran out.', 'Подземелье бросили, когда кончилось золото.'],
  ['Its last defenders still keep their watch — dead.', 'Последние защитники всё ещё на посту — мёртвые.'], ['A flood drowned the lower halls.', 'Наводнение затопило нижние залы.'],
  ['Adventurers went in last spring and did not come back.', 'Прошлой весной туда ушли искатели приключений и не вернулись.'], ['New masters moved in and are digging deeper.', 'Туда пришли новые хозяева и копают глубже.'],
];

export const ENTRANCES: Pair[] = [
  ['A door hidden behind a waterfall.', 'Дверь за водопадом.'], ['A collapsed stairway under a dead oak.', 'Обвалившаяся лестница под мёртвым дубом.'],
  ['Huge bronze doors, half open.', 'Огромные бронзовые двери, приоткрытые наполовину.'], ['A well in an abandoned village.', 'Колодец в брошенной деревне.'],
  ['A crack in a cliff, just wide enough to squeeze through.', 'Расщелина в скале — едва протиснуться.'], ['A trapdoor under a tavern’s cellar.', 'Люк под погребом таверны.'],
  ['A gate guarded by two stone statues.', 'Ворота между двумя каменными статуями.'], ['A sinkhole that opened in a field overnight.', 'Провал, за ночь открывшийся посреди поля.'],
];

export const ATMOSPHERES: Pair[] = [
  ['Damp air, dripping water and the smell of mould.', 'Сырой воздух, капающая вода и запах плесени.'], ['Dead silence; even footsteps sound muffled.', 'Мёртвая тишина; даже шаги звучат глухо.'],
  ['A cold draught from somewhere below.', 'Холодный сквозняк откуда-то снизу.'], ['The smell of old smoke and burnt fat.', 'Запах старого дыма и горелого жира.'],
  ['Faint chanting that stops whenever someone listens.', 'Едва слышное пение — оно стихает, стоит прислушаться.'], ['Warm, stale air and the buzzing of flies.', 'Тёплый спёртый воздух и жужжание мух.'],
  ['Glowing moss on the walls gives a little green light.', 'Светящийся мох на стенах даёт немного зелёного света.'], ['Scratching inside the walls.', 'Скрежет внутри стен.'],
];

export const HOOKS: Pair[] = [
  ['A missing child was last seen near the entrance.', 'Пропавшего ребёнка в последний раз видели у входа.'], ['A scholar pays for a rubbing of an inscription inside.', 'Учёный заплатит за оттиск надписи внутри.'],
  ['Something comes out at night and takes livestock.', 'По ночам оттуда выходит что-то и уносит скот.'], ['A map to it was found in a dead man’s boot.', 'Карту туда нашли в сапоге у мертвеца.'],
  ['A rival party is already on its way there.', 'Туда уже направился отряд соперников.'], ['A noble wants a family heirloom brought back.', 'Вельможа хочет вернуть фамильную реликвию.'],
  ['The local priest asks to put the dead inside to rest.', 'Местный жрец просит упокоить мёртвых внутри.'], ['Strange lights have been seen there three nights in a row.', 'Три ночи подряд там видят странные огни.'],
];

export const ROOMS: Pair[] = [
  ['A guardroom with rotten bunks and a table of mouldy dice.', 'Караульная: сгнившие нары и стол с заплесневелыми костями.'], ['A chapel with a broken altar.', 'Часовня с разбитым алтарём.'],
  ['A long hall of pillars, some of them fallen.', 'Длинный зал с колоннами; часть упала.'], ['A storeroom with burst barrels and gnawed sacks.', 'Кладовая: лопнувшие бочки, прогрызенные мешки.'],
  ['A natural cavern with a stream running through it.', 'Естественная пещера, через неё бежит ручей.'], ['A library: shelves of rotten books, one whole.', 'Библиотека: полки гнилых книг, одна — целая.'],
  ['A round room with a dome painted with stars.', 'Круглый зал с куполом, расписанным звёздами.'], ['A kitchen with a cold hearth big enough to walk into.', 'Кухня с холодным очагом, в который можно войти.'],
  ['Barracks: rows of beds, armour still hanging on pegs.', 'Казарма: ряды кроватей, на крюках всё ещё висят доспехи.'], ['A narrow bridge over a chasm.', 'Узкий мост над пропастью.'],
  ['A flooded hall, water up to the waist.', 'Затопленный зал, вода по пояс.'], ['A workshop full of half-finished things.', 'Мастерская, полная недоделанных вещей.'],
  ['A burial niche wall with hundreds of skulls.', 'Стена погребальных ниш с сотнями черепов.'], ['A throne room with an empty throne.', 'Тронный зал с пустым троном.'],
  ['A prison: cells with rusted doors, one locked.', 'Тюрьма: камеры с ржавыми дверями, одна заперта.'], ['A shaft going down into darkness, with a rope ladder.', 'Колодец вниз, в темноту, с верёвочной лестницей.'],
];

export const FEATURES: Pair[] = [
  ['Part of the ceiling has collapsed.', 'Часть потолка обрушилась.'], ['Fresh footprints in the dust.', 'Свежие следы в пыли.'],
  ['A mosaic on the floor shows this very room.', 'Мозаика на полу изображает эту самую комнату.'], ['Old blood on the walls.', 'Старая кровь на стенах.'],
  ['A statue whose head turns to follow light.', 'Статуя, чья голова поворачивается за светом.'], ['A cold fire that gives light but no heat.', 'Холодный огонь — светит, но не греет.'],
  ['A message scratched by previous adventurers.', 'Надпись, выцарапанная прежними искателями приключений.'], ['Webs as thick as curtains.', 'Паутина, плотная как занавес.'],
  ['The echo answers a little too late.', 'Эхо отвечает с опозданием.'], ['A dead adventurer with a half-written letter.', 'Мёртвый искатель приключений с недописанным письмом.'],
  ['Running water can be heard behind one wall.', 'За одной из стен слышна бегущая вода.'], ['Everything here is covered with a thin layer of ash.', 'Всё покрыто тонким слоем пепла.'],
];

export const PUZZLES: Pair[] = [
  ['A door with four levers; the frescoes show the order of the seasons.', 'Дверь с четырьмя рычагами; фрески показывают порядок времён года.'],
  ['A riddle carved on a sealed door; the answer must be spoken aloud.', 'Загадка, вырезанная на запертой двери; ответ нужно произнести вслух.'],
  ['Statues that must all face the same way.', 'Статуи, которые все надо повернуть в одну сторону.'],
  ['A floor of tiles with symbols — only some are safe to step on.', 'Пол из плиток с символами — наступать можно не на все.'],
  ['Scales that must be balanced with things found in the dungeon.', 'Весы, которые надо уравновесить вещами из подземелья.'],
  ['A ghost who opens the way only if told how it died.', 'Призрак, который откроет путь, только если ему расскажут, как он умер.'],
  ['A locked chest with a lock that changes shape every minute.', 'Сундук с замком, который каждую минуту меняет форму.'],
  ['Mirrors that must reflect a beam of light onto a gem in the wall.', 'Зеркала, которыми нужно направить луч света на камень в стене.'],
  ['Bells of different notes; the door opens to a tune hummed by a statue.', 'Колокола разных нот; дверь откроется под мелодию, которую напевает статуя.'],
  ['A bridge that appears only while no one looks down.', 'Мост, который есть, только пока никто не смотрит вниз.'],
];

// [en, ru, save ability (systems/dnd5e key), damage type en, damage type ru (genitive)].
export type Trap = [en: string, ru: string, save: string, dmgEn: string, dmgRu: string];
export const TRAPS: Trap[] = [
  ['A pressure plate fires poisoned darts from the walls.', 'Нажимная плита — из стен вылетают отравленные дротики.', 'dex', 'poison', 'урона ядом'],
  ['A section of floor tilts into a pit with spikes.', 'Часть пола опрокидывается в яму с кольями.', 'dex', 'piercing', 'колющего урона'],
  ['A tripwire brings down a block of stone.', 'Растяжка обрушивает каменный блок.', 'dex', 'bludgeoning', 'дробящего урона'],
  ['A glyph on the door explodes in flame.', 'Знак на двери взрывается пламенем.', 'dex', 'fire', 'урона огнём'],
  ['The door seals and the room fills with sand.', 'Дверь запирается, и комната заполняется песком.', 'str', 'bludgeoning', 'дробящего урона'],
  ['A blade swings out of the ceiling at neck height.', 'Из потолка на уровне шеи вылетает лезвие.', 'dex', 'slashing', 'рубящего урона'],
  ['Green gas hisses out of the skulls on the walls.', 'Из черепов на стенах с шипением выходит зелёный газ.', 'con', 'poison', 'урона ядом'],
  ['A cursed idol whispers to whoever touches it.', 'Проклятый идол шепчет тому, кто к нему прикоснётся.', 'wis', 'psychic', 'психического урона'],
  ['Lightning arcs between two bronze pillars.', 'Между двумя бронзовыми колоннами бьёт молния.', 'dex', 'lightning', 'урона электричеством'],
  ['Frost spreads from a rune on the floor.', 'От руны на полу расползается иней.', 'con', 'cold', 'урона холодом'],
];

export const TWISTS: Pair[] = [
  ['The real treasure is a map to a second, deeper level.', 'Настоящее сокровище — карта второго, более глубокого уровня.'],
  ['The hoard belongs to someone still alive who will want it back.', 'Клад принадлежит тому, кто ещё жив и захочет его вернуть.'],
  ['Among the treasure is a letter that changes everything about the boss.', 'Среди сокровищ — письмо, меняющее всё, что известно о главном противнике.'],
  ['Taking the treasure wakes something below.', 'Если взять сокровище, внизу что-то проснётся.'],
  ['A prisoner is kept here, and they know a way out.', 'Здесь держат пленника, и он знает другой выход.'],
  ['The hoard has already been looted — almost.', 'Клад уже разграбили — почти.'],
];
