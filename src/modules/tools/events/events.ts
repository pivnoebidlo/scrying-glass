// Random events, written for the app — one list in both languages (the same tags for both). [[Name|text]] links a
// creature to its SRD card (the name as in the SRD of that language). Russian lines are in the present tense.
import type { EventDef } from './generate';

const F = ['forest'] as const;
const OPEN = ['plains', 'forest'] as const;

export const EVENTS: EventDef[] = [
  // ---------- Anywhere outdoors ----------
  { kind: 'traveler', danger: 0, en: 'A peddler with a laden mule offers trinkets, gossip and a dubious map.', ru: 'Коробейник с навьюченным мулом предлагает безделушки, сплетни и сомнительную карту.' },
  { kind: 'traveler', danger: 0, en: 'Pilgrims on their way to a holy site invite the heroes to walk with them.', ru: 'Паломники идут к святому месту и зовут героев с собой.' },
  { kind: 'traveler', danger: 0, en: 'A wounded courier with a sealed letter begs to be taken to the nearest town.', ru: 'Раненый гонец с запечатанным письмом просит довести его до ближайшего города.' },
  { kind: 'traveler', danger: 1, en: 'A wanderer offers to tell fortunes — and knows far too much about the heroes.', ru: 'Странник предлагает погадать — и знает о героях слишком много.' },
  { kind: 'traveler', danger: 1, en: 'A [[Knight|knight]] blocks the way and demands a duel for the honour of an unknown lady.', ru: '[[Рыцарь]] перегораживает путь и требует поединка во имя неизвестной дамы.' },
  { kind: 'traveler', danger: 0, en: 'A [[Scout|scout]] from a nearby garrison asks whether the heroes have seen anything strange.', ru: '[[Разведчик]] из ближнего гарнизона спрашивает, не видели ли герои чего-нибудь странного.' },
  { kind: 'traveler', danger: 1, en: 'Travelling players perform by the road; one of them slips something into a hero’s pack.', ru: 'Бродячие артисты дают представление у дороги; один из них что-то подсовывает в сумку героя.' },
  { kind: 'discovery', danger: 0, en: 'An abandoned camp, the embers still warm. Someone left in a hurry.', ru: 'Брошенный лагерь, угли ещё тёплые. Кто-то ушёл в спешке.' },
  { kind: 'discovery', danger: 0, en: 'An overgrown shrine; fresh flowers lie on the altar.', ru: 'Заросшее святилище; на алтаре — свежие цветы.' },
  { kind: 'discovery', danger: 0, en: 'A broken cart by the road: the owner is gone, the goods are untouched.', ru: 'Сломанная телега у дороги: хозяина нет, товар нетронут.' },
  { kind: 'discovery', danger: 1, en: 'A hanged man on an old oak, with a note pinned to his coat: “Thief”.', ru: 'Повешенный на старом дубе, к одежде приколота записка: «Вор».' },
  { kind: 'discovery', danger: 0, en: 'A standing stone with a carving that matches a mark on a hero’s gear.', ru: 'Стоячий камень с резьбой — такой же знак есть на снаряжении одного из героев.', check: ['history', 12] },
  { kind: 'discovery', danger: 0, en: 'A spring of clear water — the first in a day’s walk.', ru: 'Родник с чистой водой — первый за день пути.' },
  { kind: 'obstacle', danger: 0, en: 'The signpost has been turned: the road leads the wrong way.', ru: 'Указатель кто-то повернул: дорога ведёт не туда.', check: ['survival', 12] },
  { kind: 'obstacle', danger: 1, en: 'The bridge is washed out — find a ford or lose half a day.', ru: 'Мост размыт — нужен брод или крюк в полдня.', check: ['athletics', 13] },
  { kind: 'obstacle', danger: 1, en: 'A toll post: the guards want {1d4} silver from each — or a bribe.', ru: 'Пост на дороге: стража требует по {1d4} серебра с каждого — или взятку.', check: ['persuasion', 13] },
  { kind: 'encounter', danger: 1, en: 'A pack of [[Wolf|wolves]] keeps its distance and follows the heroes.', ru: 'Стая [[Волк|волков]] держится поодаль и идёт следом.' },
  { kind: 'encounter', danger: 2, en: 'Ambush: [[Bandit|bandits]] and their [[Bandit Captain|captain]] demand a “road fee”.', ru: 'Засада: [[Бандит|бандиты]] и их [[Капитан бандитов|капитан]] требуют «плату за проезд».' },
  { kind: 'encounter', danger: 1, en: 'A [[Boar|boar]] bursts out of the bushes, furious and wounded by someone’s arrow.', ru: 'Из кустов вылетает [[Кабан|кабан]], разъярённый и раненный чьей-то стрелой.' },
  { kind: 'encounter', danger: 2, en: 'An [[Ogre|ogre]] sits by the road eating a cow — and looking for dessert.', ru: 'У дороги [[Огр|огр]] доедает корову — и присматривает десерт.' },
  { kind: 'encounter', danger: 2, en: 'A [[Wyvern|wyvern]] circles overhead, lower with every pass.', ru: 'Над головой кружит [[Виверна|виверна]], с каждым кругом всё ниже.' },
  { kind: 'encounter', danger: 1, when: 'night', en: 'A [[Swarm of Bats|swarm of bats]] pours out of the dark, and something big follows it.', ru: 'Из темноты вырывается [[Рой летучих мышей|рой летучих мышей]], а за ним — что-то большое.' },
  { kind: 'encounter', danger: 2, when: 'night', en: '[[Ghoul|Ghouls]] dig at an old grave by the road and smell the living.', ru: '[[Упырь|Упыри]] раскапывают старую могилу у дороги и чуют живых.' },
  { kind: 'omen', danger: 0, en: 'A white raven follows the heroes all day and caws when they take a wrong turn.', ru: 'Белый ворон весь день летит за героями и каркает, когда они сворачивают не туда.' },
  { kind: 'omen', danger: 0, when: 'night', en: 'A falling star lands somewhere close; the ground still glows there.', ru: 'Падающая звезда падает где-то рядом; там до сих пор светится земля.' },
  { kind: 'omen', danger: 1, when: 'night', en: 'Someone calls a hero by name from the darkness. Nobody is there.', ru: 'Из темноты кто-то зовёт героя по имени. Там никого.', check: ['insight', 13] },

  // ---------- Forest ----------
  { kind: 'encounter', danger: 2, where: [...F], en: 'An [[Owlbear|owlbear]] guards its nest across the path.', ru: '[[Совомедведь]] охраняет гнездо прямо на тропе.' },
  { kind: 'encounter', danger: 2, where: [...F], en: 'Webs between the trees: [[Giant Spider|giant spiders]] wait above.', ru: 'Между деревьями паутина: наверху ждут [[Гигантский паук|гигантские пауки]].', check: ['perception', 14] },
  { kind: 'encounter', danger: 1, where: [...F], en: 'A [[Brown Bear|brown bear]] with cubs — do not get between them.', ru: '[[Бурый медведь|Медведица]] с медвежатами — только не вставать между ними.' },
  { kind: 'traveler', danger: 0, where: [...F], en: 'A [[Dryad|dryad]] asks the heroes to drive woodcutters away from her oak.', ru: '[[Дриада]] просит прогнать лесорубов от её дуба.' },
  { kind: 'discovery', danger: 0, where: [...F], en: 'A ring of mushrooms; whoever steps inside hears distant music.', ru: 'Кольцо грибов; ступившему внутрь слышится далёкая музыка.', check: ['arcana', 12] },
  { kind: 'obstacle', danger: 0, where: [...F], en: 'A fallen giant tree blocks the path; the way around is through brambles.', ru: 'Тропу перегородил упавший великан-дуб; обход — через бурелом и терновник.', check: ['athletics', 11] },
  { kind: 'encounter', danger: 1, where: ['forest', 'swamp'], when: 'night', en: 'A [[Will-o’-Wisp|will-o’-wisp]] beckons from between the trees.', ru: '[[Блуждающий огонёк]] манит из-за деревьев.' },

  // ---------- Plains ----------
  { kind: 'encounter', danger: 1, where: ['plains'], en: 'A herd of wild horses thunders past; a foal is caught in a hunter’s snare.', ru: 'Мимо проносится табун диких лошадей; жеребёнок запутался в силке охотника.', check: ['animal-handling', 12] },
  { kind: 'encounter', danger: 2, where: ['plains'], en: 'A [[Griffon|griffon]] dives at the horses.', ru: '[[Грифон]] пикирует на лошадей.' },
  { kind: 'discovery', danger: 0, where: [...OPEN], en: 'An old battlefield: rusted armor in the grass, and a banner nobody remembers.', ru: 'Старое поле битвы: ржавые доспехи в траве и знамя, которого никто не помнит.', check: ['history', 13] },
  { kind: 'obstacle', danger: 1, where: ['plains'], en: 'Prairie fire on the horizon, and the wind is blowing this way.', ru: 'На горизонте пал, и ветер дует сюда.', check: ['survival', 13] },
  { kind: 'encounter', danger: 2, where: ['plains', 'desert'], en: 'The ground shakes: an [[Ankheg|ankheg]] surfaces under the cart.', ru: 'Земля дрожит: под телегой выныривает [[Анхег|анхег]].' },

  // ---------- Mountains ----------
  { kind: 'obstacle', danger: 1, where: ['mountains'], en: 'A rockslide has buried the path; the only way on is along a narrow ledge.', ru: 'Тропу завалило камнепадом; дальше — только по узкому карнизу.', check: ['acrobatics', 13] },
  { kind: 'encounter', danger: 1, where: ['mountains'], en: '[[Giant Eagle|Giant eagles]] watch from the cliffs; they might help — for a price.', ru: '[[Гигантский орёл|Гигантские орлы]] наблюдают со скал; могут помочь — за плату.' },
  { kind: 'encounter', danger: 2, where: ['mountains'], en: 'A [[Hill Giant|hill giant]] throws boulders “for fun” at anything that moves.', ru: '[[Холмовой великан]] «для забавы» швыряет валуны во всё, что движется.' },
  { kind: 'discovery', danger: 0, where: ['mountains'], en: 'A dwarven waystone with a carved map of tunnels nobody uses any more.', ru: 'Дварфийский путевой камень с картой тоннелей, которыми больше никто не ходит.' },
  { kind: 'encounter', danger: 2, where: ['mountains', 'arctic'], en: 'A [[Troll|troll]] lives under the only bridge over the gorge.', ru: 'Под единственным мостом через ущелье живёт [[Тролль|тролль]].' },

  // ---------- Swamp ----------
  { kind: 'obstacle', danger: 1, where: ['swamp'], en: 'The firm path ends; the bog sucks at boots, and one wrong step is enough.', ru: 'Твёрдая тропа кончается; трясина засасывает сапоги, и хватит одного неверного шага.', check: ['survival', 13] },
  { kind: 'encounter', danger: 2, where: ['swamp'], en: 'Something huge moves under the water: a [[Crocodile|crocodile]] — or worse.', ru: 'Под водой движется что-то огромное: [[Крокодил|крокодил]] — или хуже.' },
  { kind: 'traveler', danger: 1, where: ['swamp'], en: 'An old woman in a hut on stilts offers a cure — she is a [[Green Hag|green hag]].', ru: 'Старуха в хижине на сваях предлагает лекарство — это [[Зелёная карга|зелёная карга]].', check: ['insight', 14] },
  { kind: 'encounter', danger: 1, where: ['swamp'], en: '[[Giant Frog|Giant frogs]] croak all around, and one of them is very hungry.', ru: 'Вокруг квакают [[Гигантская лягушка|гигантские лягушки]], и одна очень голодна.' },
  { kind: 'encounter', danger: 1, where: ['swamp', 'jungle'], en: 'A cloud of [[Stirge|stirges]] rises from the reeds.', ru: 'Из камышей поднимается туча [[Стирж|стирджей]].' },

  // ---------- Coast ----------
  { kind: 'discovery', danger: 0, where: ['coast'], en: 'A shipwreck on the shore; the cargo hold is still sealed.', ru: 'На берегу обломки корабля; трюм всё ещё запечатан.' },
  { kind: 'encounter', danger: 1, where: ['coast'], en: '[[Giant Crab|Giant crabs]] defend the beach where the heroes want to camp.', ru: '[[Гигантский краб|Гигантские крабы]] защищают пляж, где герои хотят встать лагерем.' },
  { kind: 'traveler', danger: 0, where: ['coast'], en: 'Smugglers unload a boat at dusk and offer to share — for silence.', ru: 'В сумерках контрабандисты разгружают лодку и предлагают поделиться — за молчание.' },
  { kind: 'encounter', danger: 2, where: ['coast'], when: 'night', en: 'A [[Sea Hag|sea hag]] sings from the rocks; the song pulls toward the water.', ru: 'С камней поёт [[Морская карга|морская карга]]; песня тянет к воде.', check: ['save:wis', 13] },
  { kind: 'obstacle', danger: 1, where: ['coast'], en: 'The tide comes in fast and cuts off the way back along the beach.', ru: 'Прилив наступает быстро и отрезает путь назад по пляжу.', check: ['athletics', 12] },

  // ---------- Desert ----------
  { kind: 'encounter', danger: 2, where: ['desert'], en: 'A [[Giant Scorpion|giant scorpion]] waits under the sand by the only well.', ru: 'У единственного колодца под песком поджидает [[Гигантский скорпион|гигантский скорпион]].' },
  { kind: 'discovery', danger: 0, where: ['desert'], en: 'The tip of a buried pyramid sticks out of a dune.', ru: 'Из бархана торчит верхушка занесённой пирамиды.' },
  { kind: 'obstacle', danger: 1, where: ['desert'], en: 'The water ran out sooner than expected; the next oasis is a day away.', ru: 'Вода кончилась раньше, чем думали; до следующего оазиса — день пути.', check: ['survival', 14] },
  { kind: 'traveler', danger: 0, where: ['desert'], en: 'A caravan of [[Camel|camels]] heads to the oasis; the caravan master wants guards.', ru: 'Караван [[Верблюд|верблюдов]] идёт к оазису; караванщику нужна охрана.' },
  { kind: 'encounter', danger: 2, where: ['desert'], when: 'night', en: 'A [[Mummy|mummy]] walks out of the sand toward the old tomb.', ru: 'Из песков к старой гробнице бредёт [[Мумия|мумия]].' },

  // ---------- Arctic ----------
  { kind: 'encounter', danger: 2, where: ['arctic'], en: 'A [[Polar Bear|polar bear]] is hunting, and the heroes smell like food.', ru: '[[Белый медведь]] на охоте, а герои пахнут едой.' },
  { kind: 'encounter', danger: 2, where: ['arctic'], en: '[[Winter Wolf|Winter wolves]] howl on three sides at once.', ru: '[[Зимний волк|Зимние волки]] воют сразу с трёх сторон.' },
  { kind: 'obstacle', danger: 1, where: ['arctic'], en: 'Thin ice over dark water; the far shore is close, the way around is long.', ru: 'Тонкий лёд над тёмной водой; другой берег близко, обход — долгий.', check: ['acrobatics', 13] },
  { kind: 'discovery', danger: 0, where: ['arctic'], en: 'A [[Mammoth|mammoth]] frozen in the ice, with a spear stuck in its side.', ru: 'Вмёрзший в лёд [[Мамонт|мамонт]] с копьём в боку.' },

  // ---------- Jungle ----------
  { kind: 'encounter', danger: 2, where: ['jungle'], en: 'A [[Tiger|tiger]] has been stalking the heroes since morning.', ru: 'С самого утра за героями крадётся [[Тигр|тигр]].', check: ['perception', 15] },
  { kind: 'encounter', danger: 1, where: ['jungle'], en: 'A [[Constrictor Snake|constrictor snake]] drops from a branch onto the last in line.', ru: '[[Удав]] падает с ветки на идущего последним.' },
  { kind: 'discovery', danger: 0, where: ['jungle'], en: 'A stone face, overgrown with vines, looks out of the green — its eyes are gems.', ru: 'Из зелени смотрит каменное лицо, заросшее лианами, — глаза у него из самоцветов.' },
  { kind: 'obstacle', danger: 1, where: ['jungle'], en: 'A river full of hungry fish; the vine bridge is half rotten.', ru: 'Река, полная голодных рыб; мост из лиан наполовину сгнил.', check: ['athletics', 13] },

  // ---------- City ----------
  { kind: 'traveler', danger: 0, where: ['city'], en: 'A street urchin offers to show a shortcut — and the way to anything for a coin.', ru: 'Уличный мальчишка предлагает показать короткую дорогу — и что угодно за монету.' },
  { kind: 'encounter', danger: 1, where: ['city'], en: 'A pickpocket brushes past; a purse is gone.', ru: 'Мимо проскальзывает карманник — кошель исчез.', check: ['perception', 14] },
  { kind: 'encounter', danger: 2, where: ['city'], when: 'night', en: 'In a dark alley, [[Bandit|thugs]] with clubs wait for the heroes by name.', ru: 'В тёмном переулке героев по именам поджидают [[Бандит|громилы]] с дубинками.' },
  { kind: 'obstacle', danger: 1, where: ['city'], en: 'The [[Guard|guard]] closes the street and checks papers; the heroes have none.', ru: '[[Стражник|Стража]] перекрывает улицу и проверяет бумаги; у героев их нет.', check: ['deception', 13] },
  { kind: 'discovery', danger: 0, where: ['city'], en: 'A wanted poster with a very familiar face on it.', ru: 'Объявление о розыске — с очень знакомым лицом.' },
  { kind: 'omen', danger: 0, where: ['city'], en: 'All the temple bells ring at once, in the middle of the day.', ru: 'Посреди дня разом звонят все колокола храмов.' },
  { kind: 'traveler', danger: 0, where: ['city'], en: 'A herald announces a fair tomorrow, with a prize for the strongest.', ru: 'Глашатай объявляет завтрашнюю ярмарку — с призом самому сильному.' },
  { kind: 'discovery', danger: 0, where: ['city'], en: 'A stall of a foreign merchant with very strange goods.', ru: 'Лоток заморского купца с очень странными товарами.' },
  { kind: 'traveler', danger: 0, where: ['city'], en: 'A street preacher blesses the heroes and asks for help with the poorhouse.', ru: 'Уличный проповедник благословляет героев и просит помочь богадельне.' },
  { kind: 'traveler', danger: 1, where: ['city'], en: 'A [[Cultist|cultist]] hands out leaflets about the end of the world — tomorrow.', ru: '[[Культист]] раздаёт листки о конце света — завтра.' },

  // ---------- Underground ----------
  { kind: 'encounter', danger: 2, where: ['underground'], en: 'A [[Gelatinous Cube|gelatinous cube]] fills the corridor; things float inside it.', ru: 'Коридор заполняет [[Желатиновый куб|желатиновый куб]]; внутри что-то плавает.', check: ['perception', 15] },
  { kind: 'encounter', danger: 1, where: ['underground'], en: '[[Giant Rat|Giant rats]] swarm out of a crack, fleeing something.', ru: 'Из трещины валят [[Гигантская крыса|гигантские крысы]] — бегут от чего-то.' },
  { kind: 'encounter', danger: 2, where: ['underground'], en: 'The treasure chest in the alcove has teeth — it is a [[Mimic|mimic]].', ru: 'У сундука в нише есть зубы — это [[Мимик|мимик]].', check: ['investigation', 14] },
  { kind: 'encounter', danger: 1, where: ['underground'], en: 'A [[Darkmantle|darkmantle]] hangs from the ceiling like a stalactite.', ru: 'С потолка, как сталактит, свисает [[Тёмная мантия|тёмная мантия]].', check: ['perception', 13] },
  { kind: 'obstacle', danger: 1, where: ['underground'], en: 'The tunnel floods; the air pocket ahead may or may not be there.', ru: 'Тоннель затоплен; впереди, может быть, есть воздушный карман.', check: ['athletics', 14] },
  { kind: 'discovery', danger: 0, where: ['underground'], en: 'A cavern of glowing mushrooms — and a campsite someone left long ago.', ru: 'Пещера светящихся грибов — и давно брошенная кем-то стоянка.' },
  { kind: 'discovery', danger: 1, where: ['underground'], en: 'A [[Rust Monster|rust monster]]’s nest full of half-eaten weapons.', ru: 'Гнездо [[Ржавник|ржавника]], полное надъеденного оружия.' },
  { kind: 'traveler', danger: 0, where: ['underground'], en: 'A lost miner with a dying lamp begs to be led back to the surface.', ru: 'Заблудившийся рудокоп с гаснущей лампой просит вывести его наверх.' },
  { kind: 'discovery', danger: 0, where: ['underground'], en: 'An underground lake; blind white fish circle in the lamplight.', ru: 'Подземное озеро; в свете лампы кружат слепые белые рыбы.' },
  { kind: 'discovery', danger: 0, where: ['underground'], en: 'Old rails of a mine cart lead into the dark — the cart is still on them.', ru: 'Старые рельсы рудничной вагонетки уходят в темноту — вагонетка всё ещё на них.' },
  { kind: 'discovery', danger: 0, where: ['underground'], en: 'Dwarven runes on the wall: a warning, or directions.', ru: 'Дварфийские руны на стене — предупреждение или указатель.', check: ['history', 13] },
  { kind: 'omen', danger: 0, where: ['underground'], en: 'A faint breeze — somewhere ahead there is a way out.', ru: 'Лёгкий сквозняк — где-то впереди есть выход.' },
  { kind: 'omen', danger: 1, where: ['underground'], en: 'Drums far below, steady as a heartbeat.', ru: 'Где-то глубоко внизу — барабаны, ровные, как сердцебиение.' },
];

// A rumor told on the road: the rumor itself comes from the tavern generator.
export const RUMOR_INTROS = {
  en: ['A passing traveller shares a rumor: “{rumor}”', 'At the campfire someone says: “{rumor}”', 'A merchant, lowering his voice: “{rumor}”'],
  ru: ['Встречный путник делится слухом: «{rumor}»', 'У костра кто-то рассказывает: «{rumor}»', 'Купец, понизив голос: «{rumor}»'],
};

// On a dangerous road an event can come with a complication.
export const COMPLICATIONS = {
  en: [
    'At the worst moment it starts to rain hard.',
    'Night is falling; they have an hour of light left.',
    'One of the horses goes lame.',
    'Someone has been watching all this from a distance.',
    'A second group arrives, drawn by the noise.',
    'The road behind is blocked.',
  ],
  ru: [
    'В самый неподходящий момент начинается ливень.',
    'Темнеет: светлого времени остаётся час.',
    'Одна из лошадей начинает хромать.',
    'Кто-то наблюдает за всем этим издалека.',
    'На шум подходит ещё одна группа.',
    'Дорога позади перекрыта.',
  ],
};
