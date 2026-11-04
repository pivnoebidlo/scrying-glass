// Trap generator content, written for the app — both languages side by side. The rules (save, damage, skills) are
// keys: the numbers come from the severity and the heroes' level (generate.ts).
import type { TrapKind, TrapPlace } from './generate';

type Pair = [en: string, ru: string];
export type DamageType = 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' | 'lightning' | 'necrotic' | 'piercing' | 'poison' | 'psychic' | 'radiant' | 'slashing' | 'thunder';
// [en, ru (genitive with the word «урона», as in the dungeon generator)].
export const DAMAGE: Record<DamageType, Pair> = {
  acid: ['acid', 'урона кислотой'], bludgeoning: ['bludgeoning', 'дробящего урона'], cold: ['cold', 'урона холодом'],
  fire: ['fire', 'урона огнём'], force: ['force', 'урона силовым полем'], lightning: ['lightning', 'урона электричеством'],
  necrotic: ['necrotic', 'некротического урона'], piercing: ['piercing', 'колющего урона'], poison: ['poison', 'урона ядом'],
  psychic: ['psychic', 'психического урона'], radiant: ['radiant', 'урона излучением'], slashing: ['slashing', 'рубящего урона'],
  thunder: ['thunder', 'урона звуком'],
};

export interface Mechanism {
  kind: TrapKind;
  places: TrapPlace[];
  name: Pair;
  effect: Pair;
  clue: Pair;
  disarm: Pair;
  // A save (ability key) or an attack roll.
  save?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  // half — half the damage on a success; none — no damage on a success (a save to avoid it).
  success?: 'half' | 'none';
  damage?: DamageType;
  detect: 'perception' | 'investigation' | 'arcana';
  disable: 'sleight-of-hand' | 'arcana' | 'athletics';
}

export const MECHANISMS: Mechanism[] = [
  {
    kind: 'mechanical', places: ['corridor', 'room'], damage: 'poison', detect: 'perception', disable: 'sleight-of-hand',
    name: ['Poisoned darts', 'Отравленные дротики'],
    effect: ['Darts fly out of holes in the wall at everyone in a 10-foot line. A creature hit is Poisoned for 1 hour.', 'Из отверстий в стене вылетают дротики — по всем на линии длиной 10 футов. Задетый отравлен на 1 час.'],
    clue: ['Rows of tiny holes between the stones, dark with old grease.', 'Ряды крошечных отверстий между камнями, тёмных от старой смазки.'],
    disarm: ['Plug the holes with wax or cloth, or jam the plate that releases the darts.', 'Заткнуть отверстия воском или тряпками либо заклинить плиту, спускающую дротики.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'room'], save: 'dex', success: 'none', damage: 'bludgeoning', detect: 'perception', disable: 'athletics',
    name: ['Hidden pit', 'Скрытая яма'],
    effect: ['A 10-foot square of floor swings down. On a failed save the creature falls 30 feet and lands Prone.', 'Квадрат пола со стороной 10 футов проваливается. При провале существо падает на 30 футов и оказывается лежащим.'],
    clue: ['A thin straight crack in the dust, and a slight hollow sound under the boots.', 'Тонкая прямая трещина в пыли, и под сапогами звук чуть глуше.'],
    disarm: ['Wedge the lid shut with spikes, or lay planks across it.', 'Заклинить крышку клиньями или перекинуть через неё доски.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'room'], save: 'dex', success: 'none', damage: 'piercing', detect: 'perception', disable: 'athletics',
    name: ['Spiked pit', 'Яма с кольями'],
    effect: ['The floor gives way above sharpened stakes. On a failed save the creature falls among them, and its Speed is halved until it is healed.', 'Пол проваливается над заострёнными кольями. При провале существо падает на них, и его Скорость уменьшается вдвое, пока его не вылечат.'],
    clue: ['The floor here is too clean, and a smell of old rot rises from the joints.', 'Пол здесь слишком чистый, а из щелей тянет застарелой гнилью.'],
    disarm: ['Wedge the lid shut, or knock it open and walk along the ledge.', 'Заклинить крышку либо обрушить её и пройти по краю.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'room'], save: 'dex', detect: 'perception', disable: 'sleight-of-hand',
    name: ['Falling net', 'Падающая сеть'],
    effect: ['A weighted net drops on everyone in a 10-foot square. On a failed save a creature is Restrained until it cuts itself free, and a bell rings somewhere ahead.', 'Сеть с грузилами падает на всех в квадрате со стороной 10 футов. При провале существо опутано, пока не выпутается, а где-то впереди звонит колокольчик.'],
    clue: ['A cord runs up the wall and disappears into the shadows of the ceiling.', 'По стене тянется шнур и исчезает в тени под потолком.'],
    disarm: ['Cut the cord while holding the net’s weight, or tie it off.', 'Перерезать шнур, удерживая вес сети, или закрепить его.'],
  },
  {
    kind: 'mechanical', places: ['corridor'], save: 'dex', success: 'half', damage: 'bludgeoning', detect: 'perception', disable: 'athletics',
    name: ['Rolling boulder', 'Катящийся валун'],
    effect: ['A boulder as wide as the passage rolls down it. Everyone in the corridor saves; on a failure a creature is also knocked Prone.', 'По проходу катится валун шириной с коридор. Спасбросок совершают все в коридоре; при провале существо ещё и сбито с ног.'],
    clue: ['Long grooves in the floor, and the passage slopes very slightly.', 'Длинные борозды в полу, и коридор идёт чуть под уклон.'],
    disarm: ['Hammer wedges into the grooves; the boulder stops on them.', 'Вбить клинья в борозды: валун остановится на них.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'room'], save: 'dex', success: 'half', damage: 'bludgeoning', detect: 'investigation', disable: 'athletics',
    name: ['Collapsing ceiling', 'Обвал свода'],
    effect: ['The vault comes down on everyone in a 20-foot square. The rubble turns the area into difficult terrain and blocks the way back.', 'Свод рушится на всех в квадрате со стороной 20 футов. Завал делает местность труднопроходимой и перекрывает путь назад.'],
    clue: ['Fresh cracks in the vault, dust on the floor, and a rotten beam held by a single pin.', 'Свежие трещины в своде, пыль на полу и трухлявая балка на одном штыре.'],
    disarm: ['Prop the beam up and pull out the pin slowly.', 'Подпереть балку и медленно вынуть штырь.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'door'], damage: 'slashing', detect: 'perception', disable: 'sleight-of-hand',
    name: ['Swinging blade', 'Маятник-лезвие'],
    effect: ['A blade swings out of a slot in the ceiling at chest height, then swings back on the next turn.', 'Из щели в потолке на уровне груди вылетает лезвие, а на следующем ходу возвращается.'],
    clue: ['A slot in the ceiling and a fresh scratch across both walls.', 'Щель в потолке и свежая царапина через обе стены.'],
    disarm: ['Jam the slot with a spike, or tie the blade’s arm once it has swung.', 'Заклинить щель штырём или привязать рычаг лезвия после взмаха.'],
  },
  {
    kind: 'mechanical', places: ['door', 'treasure'], save: 'con', success: 'half', damage: 'poison', detect: 'investigation', disable: 'sleight-of-hand',
    name: ['Poisoned needle', 'Отравленная игла'],
    effect: ['A needle springs from the lock into the hand. On a failed save the creature is also Poisoned for 1 hour.', 'Из замка в руку выскакивает игла. При провале существо ещё и отравлено на 1 час.'],
    clue: ['A pinhole beside the keyhole with a sticky dark stain around it.', 'Рядом со скважиной — прокол с липким тёмным пятном вокруг.'],
    disarm: ['Bend the needle with a thin pick, or open the lock with a tool from arm’s length.', 'Отогнуть иглу тонкой отмычкой или открывать замок инструментом на вытянутой руке.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'door', 'treasure'], damage: 'piercing', detect: 'perception', disable: 'sleight-of-hand',
    name: ['Spring spear', 'Копьё на пружине'],
    effect: ['A spear shoots out of a hidden niche at whoever stands in front of it.', 'Из скрытой ниши вылетает копьё — в того, кто стоит напротив.'],
    clue: ['A dark square seam at waist height, and old blood on the opposite wall.', 'Тёмный квадратный шов на уровне пояса и старая кровь на стене напротив.'],
    disarm: ['Block the niche with a shield or a plank, or release the spring from the side.', 'Закрыть нишу щитом или доской либо спустить пружину, стоя сбоку.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'door', 'room'], save: 'dex', success: 'half', damage: 'fire', detect: 'perception', disable: 'sleight-of-hand',
    name: ['Burning oil', 'Горящее масло'],
    effect: ['Oil pours from the ceiling and catches on a flint striker. The floor burns for 1 minute; anyone entering or starting a turn there saves again.', 'С потолка льётся масло и вспыхивает от кремня. Пол горит 1 минуту; кто входит туда или начинает там ход — снова совершает спасбросок.'],
    clue: ['A smell of lamp oil, and a greasy sheen on the stones overhead.', 'Запах лампового масла и жирный блеск на камнях вверху.'],
    disarm: ['Remove the flint, or drain the reservoir through its pipe.', 'Снять кремень или слить масло из резервуара по трубе.'],
  },
  {
    kind: 'mechanical', places: ['room'], save: 'str', success: 'half', damage: 'bludgeoning', detect: 'investigation', disable: 'athletics',
    name: ['Flooding chamber', 'Затапливаемый зал'],
    effect: ['The doors seal and water bursts through the walls. It fills the room in 1 minute; every round the current throws everyone against the stone.', 'Двери запираются, из стен бьёт вода. Зал заполняется за 1 минуту, и каждый раунд поток бросает всех о камни.'],
    clue: ['Tide lines on the walls, drains stopped from below, and everything smells of silt.', 'Следы воды на стенах, стоки заткнуты снизу, всюду запах ила.'],
    disarm: ['Force the sluice shut, or break the door’s counterweight.', 'Силой закрыть шлюз или сломать противовес двери.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'room'], save: 'str', success: 'half', damage: 'bludgeoning', detect: 'investigation', disable: 'athletics',
    name: ['Crushing walls', 'Сдвигающиеся стены'],
    effect: ['Both walls grind towards each other, and the doors lock. They meet in 3 rounds; each round everyone between them saves.', 'Обе стены с грохотом ползут навстречу, двери запираются. Они сойдутся за 3 раунда; каждый раунд все между ними совершают спасбросок.'],
    clue: ['Straight scrapes along the floor, and the walls do not reach the corners.', 'Прямые царапины вдоль пола, а стены не доходят до углов.'],
    disarm: ['Jam a beam between the walls, or find and break the chain in the gap behind one.', 'Распереть стены бревном или найти и разбить цепь в зазоре за стеной.'],
  },
  {
    kind: 'mechanical', places: ['room', 'treasure'], save: 'con', success: 'half', damage: 'poison', detect: 'perception', disable: 'sleight-of-hand',
    name: ['Gas vents', 'Ядовитый газ'],
    effect: ['Green gas hisses out and fills a 20-foot sphere for 1 minute. On a failed save a creature is also Poisoned while it stays inside.', 'С шипением выходит зелёный газ и заполняет сферу радиусом 20 футов на 1 минуту. При провале существо ещё и отравлено, пока остаётся внутри.'],
    clue: ['A bitter almond smell, dead insects along the wall, and small brass grilles.', 'Запах горького миндаля, дохлые насекомые вдоль стены и маленькие латунные решётки.'],
    disarm: ['Stuff the grilles with wet cloth, or close the valve behind them.', 'Забить решётки мокрой тканью или закрыть вентиль за ними.'],
  },
  {
    kind: 'mechanical', places: ['door', 'treasure'], save: 'dex', success: 'half', damage: 'acid', detect: 'perception', disable: 'sleight-of-hand',
    name: ['Acid spray', 'Струя кислоты'],
    effect: ['A carved face or the lid itself sprays acid in a 15-foot cone. On a failure the target’s armour or pack is pitted and smoking.', 'Резная морда или сама крышка брызжет кислотой конусом 15 футов. При провале доспех или мешок цели шипит и покрывается оспинами.'],
    clue: ['The stone in front is eaten away, and there is a sharp vinegar smell.', 'Камень впереди разъеден, и резко пахнет уксусом.'],
    disarm: ['Plug the nozzle with clay, or tilt the object so the jet goes away.', 'Залепить сопло глиной или повернуть предмет, чтобы струя ушла в сторону.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'door'], save: 'dex', success: 'half', damage: 'piercing', detect: 'perception', disable: 'athletics',
    name: ['Falling portcullis', 'Падающая решётка'],
    effect: ['A spiked grate slams down. On a success the creature jumps to the side of its choice; the grate separates the party, and lifting it takes a DC 20 Strength check.', 'Решётка с шипами падает вниз. При успехе существо отскакивает на сторону по выбору; решётка разделяет отряд, поднять её — проверка Силы СЛ 20.'],
    clue: ['Grooves in both door jambs, and holes in the floor to receive the spikes.', 'Пазы в обоих косяках и отверстия в полу под шипы.'],
    disarm: ['Wedge the grooves with spikes so the grate cannot run.', 'Вбить в пазы клинья, чтобы решётка не прошла.'],
  },
  {
    kind: 'mechanical', places: ['corridor', 'room'], save: 'dex', success: 'none', damage: 'slashing', detect: 'investigation', disable: 'sleight-of-hand',
    name: ['Tilting floor', 'Опрокидывающийся пол'],
    effect: ['The floor tips into a greased slide towards spinning blades. On a failed save a creature slides all the way down.', 'Пол опрокидывается и становится смазанной горкой к вращающимся лезвиям. При провале существо съезжает до самого низа.'],
    clue: ['The floor rests on a central axle: a stone dropped at one end clicks at the other.', 'Пол лежит на оси: камень, брошенный на один край, щёлкает на другом.'],
    disarm: ['Slide a wedge under the axle plate to lock it.', 'Подсунуть клин под плиту оси и застопорить её.'],
  },

  {
    kind: 'magical', places: ['corridor', 'door', 'treasure'], save: 'dex', success: 'half', damage: 'fire', detect: 'arcana', disable: 'arcana',
    name: ['Burning glyph', 'Огненный знак'],
    effect: ['A hidden glyph flares and bursts into flame in a 20-foot sphere. Unattended things in it catch fire.', 'Скрытый знак вспыхивает и взрывается пламенем в сфере радиусом 20 футов. Вещи, которые никто не держит, загораются.'],
    clue: ['A faint smell of smoke with no fire, and lines that glimmer in torchlight.', 'Лёгкий запах дыма без огня и линии, поблёскивающие в свете факела.'],
    disarm: ['Break the glyph’s outline, or spend its charge from a distance.', 'Разорвать контур знака либо истратить заряд издалека.'],
  },
  {
    kind: 'magical', places: ['corridor', 'room'], save: 'dex', success: 'half', damage: 'lightning', detect: 'perception', disable: 'arcana',
    name: ['Storm pillars', 'Грозовые колонны'],
    effect: ['Lightning arcs between two bronze pillars through everyone in the line between them, and again every round while anyone stands there.', 'Между двумя бронзовыми колоннами бьёт молния — через всех на линии между ними, и так каждый раунд, пока там кто-то стоит.'],
    clue: ['Hair stands on end, and the bronze is scorched on the facing sides.', 'Волосы встают дыбом, а бронза опалена с обращённых друг к другу сторон.'],
    disarm: ['Connect the pillars with a chain to ground them, or scratch out the rune on one.', 'Соединить колонны цепью или соскоблить руну на одной из них.'],
  },
  {
    kind: 'magical', places: ['door', 'room'], save: 'con', success: 'half', damage: 'cold', detect: 'perception', disable: 'arcana',
    name: ['Rune of hoarfrost', 'Руна инея'],
    effect: ['Frost races out from a rune in a 15-foot radius. On a failed save a creature’s Speed is halved until the end of its next turn, and the floor stays slick.', 'От руны расползается иней радиусом 15 футов. При провале Скорость существа уменьшается вдвое до конца его следующего хода, а пол остаётся скользким.'],
    clue: ['Breath turns to steam here, and a pattern of ice crystals points inwards.', 'Дыхание здесь становится паром, а узор инея сходится к одной точке.'],
    disarm: ['Warm the rune with fire until it cracks, or counter it with magic.', 'Прогреть руну огнём, пока не треснет, или снять её магией.'],
  },
  {
    kind: 'magical', places: ['corridor', 'door', 'treasure'], save: 'con', success: 'half', damage: 'thunder', detect: 'arcana', disable: 'arcana',
    name: ['Thunder ward', 'Громовая печать'],
    effect: ['A clap of thunder bursts from the ward, audible 300 feet away. On a failed save a creature is also Deafened for 1 minute.', 'От печати расходится громовой раскат, слышный за 300 футов. При провале существо ещё и оглохло на 1 минуту.'],
    clue: ['Dust lies in rippling rings around one spot, and the air hums.', 'Пыль лежит кольцами вокруг одной точки, а воздух гудит.'],
    disarm: ['Trace the ward’s sign backwards, or muffle it with a Silence spell.', 'Провести знак печати в обратном порядке или заглушить её заклинанием «Тишина».'],
  },
  {
    kind: 'magical', places: ['room', 'treasure'], save: 'wis', success: 'half', damage: 'psychic', detect: 'arcana', disable: 'arcana',
    name: ['Whispering idol', 'Шепчущий идол'],
    effect: ['The idol speaks a victim’s worst fear aloud. On a failed save a creature is also Frightened of the idol for 1 minute.', 'Идол вслух произносит худший страх жертвы. При провале существо ещё и испугано идолом на 1 минуту.'],
    clue: ['A low murmur at the edge of hearing, and a dry offering of hair at its feet.', 'Тихое бормотание на грани слуха и подношение из волос у ног идола.'],
    disarm: ['Blindfold the idol, turn it to the wall, or feed it a false name.', 'Завязать идолу глаза, повернуть его к стене или назвать ему чужое имя.'],
  },
  {
    kind: 'magical', places: ['room', 'treasure'], save: 'con', success: 'half', damage: 'necrotic', detect: 'perception', disable: 'arcana',
    name: ['Black mist', 'Чёрный туман'],
    effect: ['Black mist pours out and fills a 15-foot radius for 1 minute, heavily obscuring it. Living things inside save at the start of each turn.', 'Выползает чёрный туман и на 1 минуту заполняет радиус 15 футов; видимость в нём нулевая. Живые внутри совершают спасбросок в начале каждого хода.'],
    clue: ['Flowers and moss are withered in a neat circle around it.', 'Цветы и мох вокруг увяли ровным кругом.'],
    disarm: ['Seal the source with holy water or salt, or say a funeral rite over it.', 'Запечатать источник святой водой или солью либо прочесть над ним погребальный обряд.'],
  },
  {
    kind: 'magical', places: ['door', 'room'], save: 'con', success: 'half', damage: 'radiant', detect: 'arcana', disable: 'arcana',
    name: ['Sigil of judgement', 'Знак суда'],
    effect: ['A holy sigil blazes at anyone who does not know the sign of its order. On a failed save a creature is also Blinded for 1 minute.', 'Священный знак вспыхивает перед каждым, кто не знает символа ордена. При провале существо ещё и ослеплено на 1 минуту.'],
    clue: ['The soot around the sigil has been burned clean, and it is warm to the touch.', 'Копоть вокруг знака выжжена дочиста, и он тёплый на ощупь.'],
    disarm: ['Show the order’s sign, or cover the sigil with an offering.', 'Показать символ ордена или закрыть знак подношением.'],
  },
  {
    kind: 'magical', places: ['corridor', 'room'], save: 'cha', detect: 'arcana', disable: 'arcana',
    name: ['Banishing circle', 'Круг изгнания'],
    effect: ['On a failed save a creature vanishes and appears in a locked cell elsewhere in the place, with no gear lost and no way of telling where it is.', 'При провале существо исчезает и оказывается в запертой камере в другой части этого места — со всем снаряжением и без понятия, где оно.'],
    clue: ['A perfect circle of cleaner stone, and a boot print that stops in the middle.', 'Идеальный круг чистого камня и след сапога, обрывающийся посередине.'],
    disarm: ['Smudge the circle’s rim, or step through with the words carved under it.', 'Смазать край круга или войти, произнеся слова, вырезанные под ним.'],
  },
  {
    kind: 'magical', places: ['corridor', 'room'], damage: 'force', detect: 'perception', disable: 'arcana',
    name: ['Watching statue', 'Глядящая статуя'],
    effect: ['The statue’s eyes turn, and a bolt of force strikes anyone who moves in its sight — once per round, until they leave.', 'Глаза статуи поворачиваются, и силовой заряд бьёт в того, кто движется у неё на виду, — раз в раунд, пока он не уйдёт.'],
    clue: ['Its eyes are polished gems, and every scorch mark is in line with them.', 'Глаза — полированные камни, и все подпалины лежат на одной линии с ними.'],
    disarm: ['Cover its eyes, or move only while it looks away — it turns on a slow count.', 'Закрыть ей глаза или двигаться, только пока она смотрит в сторону: поворачивается она размеренно.'],
  },
  {
    kind: 'magical', places: ['door', 'treasure'], save: 'wis', detect: 'arcana', disable: 'arcana',
    name: ['Sleeper’s seal', 'Печать сна'],
    effect: ['Everyone in 20 feet feels an irresistible drowsiness. On a failed save a creature is Unconscious for 1 minute, or until shaken awake.', 'Всех в пределах 20 футов клонит в непреодолимый сон. При провале существо без сознания 1 минуту или пока его не растолкают.'],
    clue: ['Dust-covered skeletons lie curled up peacefully, and one finds oneself yawning.', 'Запылённые скелеты лежат мирно, свернувшись, и сам собой подступает зевок.'],
    disarm: ['Break the wax seal with a blessed tool, or stay awake while reading its words.', 'Сломать восковую печать освящённым инструментом или прочитать её слова, не засыпая.'],
  },
  {
    kind: 'magical', places: ['treasure'], save: 'str', detect: 'arcana', disable: 'arcana',
    name: ['Binding gold', 'Цепкое золото'],
    effect: ['The coins flow up the arm of whoever touches them. On a failed save a creature is Restrained by living gold until someone returns everything taken.', 'Монеты текут вверх по руке коснувшегося. При провале существо опутано живым золотом, пока кто-нибудь не вернёт всё взятое.'],
    clue: ['The coins shift by themselves when no one is looking.', 'Монеты сами собой шевелятся, когда на них никто не смотрит.'],
    disarm: ['Lift the hoard with a tool, never by hand, or trade the same weight for it.', 'Брать клад инструментом, не руками, или обменять на столько же по весу.'],
  },
  {
    kind: 'magical', places: ['room'], save: 'wis', success: 'half', damage: 'psychic', detect: 'perception', disable: 'arcana',
    name: ['Mirror of regret', 'Зеркало сожалений'],
    effect: ['The mirror shows a hero’s worst memory. On a failed save a creature is also Stunned until the end of its next turn.', 'Зеркало показывает худшее воспоминание героя. При провале существо ещё и ошеломлено до конца своего следующего хода.'],
    clue: ['No dust on the glass, and the reflection is a moment late.', 'На стекле нет пыли, а отражение чуть запаздывает.'],
    disarm: ['Cover the mirror, or go past it with eyes shut.', 'Завесить зеркало или пройти мимо с закрытыми глазами.'],
  },
  {
    kind: 'magical', places: ['corridor', 'room'], save: 'dex', success: 'none', damage: 'bludgeoning', detect: 'perception', disable: 'arcana',
    name: ['Upturned ground', 'Перевёрнутый верх'],
    effect: ['Gravity reverses in a 20-foot square. On a failed save a creature falls to the ceiling, then back down when the effect ends a round later.', 'В квадрате со стороной 20 футов тяжесть меняет направление. При провале существо падает на потолок, а через раунд, когда эффект кончится, обратно.'],
    clue: ['The ceiling is scratched and bloodstained, while the floor is untouched.', 'Потолок исцарапан и в пятнах крови, а пол нетронут.'],
    disarm: ['Rope yourselves to the floor rings, or disrupt the sign set into the keystone.', 'Привязаться к кольцам в полу или повредить знак в замковом камне.'],
  },
];

// What sets it off, by kind and place.
export const TRIGGERS: Record<TrapKind, Record<TrapPlace, Pair[]>> = {
  mechanical: {
    corridor: [
      ['A pressure plate under a loose flagstone.', 'Нажимная плита под шатким камнем.'],
      ['A tripwire at shin height.', 'Растяжка на высоте голени.'],
      ['A torch bracket that pulls down like a lever.', 'Держатель факела, который опускается, как рычаг.'],
      ['The third step of a low stair.', 'Третья ступень невысокой лестницы.'],
      ['More than 100 pounds on the same spot.', 'Больше 100 фунтов в одном месте.'],
      ['Stepping off the worn middle of the passage.', 'Шаг в сторону от протоптанной середины прохода.'],
    ],
    door: [
      ['Turning the handle the wrong way.', 'Ручку повернули не в ту сторону.'],
      ['Opening the door more than a hand’s width.', 'Дверь открыли шире ладони.'],
      ['Picking the lock badly.', 'Неудачная попытка взломать замок.'],
      ['A thread stretched across the far side.', 'Нить, натянутая с другой стороны.'],
      ['Closing the door behind you.', 'Дверь закрыли за собой.'],
      ['Using the wrong key from the ring.', 'Не тот ключ из связки.'],
    ],
    room: [
      ['Lifting the object on the pedestal.', 'С постамента подняли предмет.'],
      ['A floor tile in the middle of the room.', 'Плита в середине зала.'],
      ['Pulling the only lever in sight.', 'Потянули единственный рычаг на виду.'],
      ['A thin wire across the far doorway.', 'Тонкая проволока в дальнем проёме.'],
      ['Opening the second door before closing the first.', 'Вторую дверь открыли, не закрыв первую.'],
      ['Walking on the mosaic’s wrong colour.', 'Шаг на камни не того цвета в мозаике.'],
    ],
    treasure: [
      ['Lifting the lid.', 'Подняли крышку.'],
      ['Taking the top layer of coins off a hidden plate.', 'С потайной плиты сняли верхний слой монет.'],
      ['Moving the chest from its place.', 'Сундук сдвинули с места.'],
      ['Picking the lock badly.', 'Неудачная попытка взломать замок.'],
      ['Reaching into the chest past the false bottom.', 'Сунули руку за ложное дно.'],
      ['Taking the largest gem first.', 'Первым взяли самый крупный камень.'],
    ],
  },
  magical: {
    corridor: [
      ['Crossing an invisible line without the password.', 'Невидимую черту пересекли без пароля.'],
      ['Speaking aloud in the passage.', 'В коридоре заговорили вслух.'],
      ['A creature that is not of the builders’ people passing by.', 'Мимо прошёл кто-то не из народа строителей.'],
      ['Bringing a light past the carved arch.', 'Свет пронесли под резной аркой.'],
      ['Casting any spell here.', 'Здесь сотворили любое заклинание.'],
      ['Walking past against the direction of the arrows.', 'Прошли против нарисованных стрелок.'],
    ],
    door: [
      ['Touching the door.', 'Коснулись двери.'],
      ['Opening it without saying the word on the lintel.', 'Открыли, не произнеся слово с притолоки.'],
      ['Reading the inscription aloud.', 'Надпись прочли вслух.'],
      ['Attempting Knock or any other magic on the lock.', 'На замок использовали «Открывание» или другую магию.'],
      ['Knocking the wrong number of times.', 'Постучали не столько раз, сколько нужно.'],
      ['Anyone carrying a weapon stepping through.', 'В проём вошли с оружием.'],
    ],
    room: [
      ['Standing inside the room for 1 minute.', 'В зале пробыли 1 минуту.'],
      ['Touching the altar or the central object.', 'Коснулись алтаря или предмета в центре.'],
      ['Drawing a weapon here.', 'Здесь обнажили оружие.'],
      ['Stepping on the inscribed circle.', 'Наступили на начертанный круг.'],
      ['Any creature here falling asleep or taking a rest.', 'Здесь кто-то уснул или устроил отдых.'],
      ['Breaking the silence with a raised voice.', 'Тишину нарушили громким голосом.'],
    ],
    treasure: [
      ['Touching anything in the hoard.', 'Коснулись чего-либо в кладе.'],
      ['Carrying the object out of the room.', 'Предмет вынесли из зала.'],
      ['Opening it without the owner’s blood or name.', 'Открыли без крови или имени хозяина.'],
      ['Casting Detect Magic on it.', 'На него сотворили «Обнаружение магии».'],
      ['Reading the inscription inside the lid.', 'Прочли надпись под крышкой.'],
      ['Anyone taking more than one thing.', 'Кто-то взял больше одной вещи.'],
    ],
  },
};

// How those who belong here go past it.
export const BYPASSES: Pair[] = [
  ['A hidden catch behind a loose stone turns it off for 1 minute.', 'Потайная защёлка за шатким камнем отключает её на 1 минуту.'],
  ['Those who know keep to the left wall, on the stones with a small notch.', 'Знающие идут вдоль левой стены — по камням с маленькой зарубкой.'],
  ['A password carved in small letters above the arch.', 'Пароль мелкими буквами вырезан над аркой.'],
  ['The servants’ passage runs behind this wall.', 'За этой стеной проходит ход для слуг.'],
  ['A key worn by the guards makes it safe.', 'Её делает безопасной ключ, который носят стражники.'],
  ['It sleeps at noon and midnight, for as long as a bell tolls.', 'В полдень и в полночь она спит — пока бьёт колокол.'],
  ['A token of the order, shown openly, keeps it quiet.', 'Её усмиряет знак ордена, показанный открыто.'],
  ['Anyone walking backwards does not set it off.', 'Идущий спиной вперёд её не задевает.'],
  ['A rope ladder is hidden in the rafters above it.', 'Над ней под балками спрятана верёвочная лестница.'],
  ['It only reacts to iron: the builders wore bronze.', 'Она реагирует только на железо, а строители носили бронзу.'],
  ['There is no way past. The builders never meant to come back.', 'Обхода нет: строители не собирались возвращаться.'],
  ['It works only in one direction: from the other side it is harmless.', 'Она работает лишь в одну сторону: с другой безвредна.'],
  ['A bucket of water, a bell rope, a song: a local custom keeps it asleep.', 'Ведро воды, верёвка колокола, песня: её усыпляет местный обычай.'],
  ['A tame creature here knows the safe path and can be followed.', 'Здешний ручной зверёк знает безопасный путь, и за ним можно пойти.'],
];

// What makes it worse.
export const COMPLICATIONS: Pair[] = [
  ['It resets by itself after 1 minute.', 'Через 1 минуту она взводится сама.'],
  ['The noise reaches the nearest guards.', 'Шум доходит до ближайшей стражи.'],
  ['It is only the first half: a second trap waits for those who dodge the first.', 'Это лишь первая половина: вторая ждёт тех, кто увернулся от первой.'],
  ['The door behind locks when it goes off.', 'Когда она срабатывает, дверь позади запирается.'],
  ['A creature lives in it now and will not be happy.', 'В ней теперь кто-то живёт, и он будет недоволен.'],
  ['It is badly worn: it may fail, or go off a moment too late.', 'Она сильно изношена: может не сработать или сработать с опозданием.'],
  ['The obvious trap here is a decoy for this one.', 'Заметная ловушка рядом — обманка, чтобы отвлечь от этой.'],
  ['It marks whoever sets it off with a smell or a glow for a day.', 'Сработав, она на день метит виновника запахом или свечением.'],
  ['Disarming it opens a way for something locked behind it.', 'Если её обезвредить, выйдет то, что она сдерживала.'],
  ['It is linked to the next room, and resets what is there.', 'Она связана со следующим залом и взводит всё, что там есть.'],
  ['An earlier explorer left a false warning sign here.', 'Прошлый искатель оставил здесь ложное предупреждение.'],
  ['There is a real reward inside the mechanism, if someone is brave enough.', 'В самом механизме спрятана настоящая награда — для смельчаков.'],
  ['It goes off a second time if anyone tries to rescue the victim.', 'Она срабатывает снова, если кто-то бросится спасать жертву.'],
  ['Nothing bad — it is now only dangerous to the careless.', 'Ничего особенного: теперь она опасна только беспечным.'],
];

// Who set it, and why.
export const MAKERS: Pair[] = [
  ['Dwarven masons, to keep looters out of their dead.', 'Дварфы-каменщики — чтобы мародёры не добрались до их мёртвых.'],
  ['A paranoid wizard who trusted no apprentice.', 'Мнительный волшебник, не доверявший ученикам.'],
  ['Kobolds, who tested it on one another.', 'Кобольды, проверявшие её друг на друге.'],
  ['The priests, as a test of the faithful.', 'Жрецы — как испытание для верующих.'],
  ['Smugglers, to protect a hidden route.', 'Контрабандисты — чтобы защитить тайный путь.'],
  ['A thieves’ guild, as an exam for its novices.', 'Гильдия воров — как экзамен для новичков.'],
  ['An old king, to hide his shame rather than his gold.', 'Старый король — чтобы скрыть не золото, а свой позор.'],
  ['A gnome inventor, who was very proud of it.', 'Гном-изобретатель, очень ею гордившийся.'],
  ['The current residents, who found it and repaired it.', 'Нынешние обитатели: нашли её и починили.'],
  ['No one remembers. It is older than the walls around it.', 'Никто не помнит: она старше окружающих стен.'],
  ['A jealous lover, for one particular person.', 'Ревнивец — для одного определённого человека.'],
  ['A warden, to keep something in rather than to keep people out.', 'Страж — чтобы что-то удержать внутри, а не чтобы не пускать снаружи.'],
];

// What is left of those who came before.
export const REMAINS: Pair[] = [
  ['A skeleton still holds a rusted crowbar.', 'Скелет всё ещё сжимает ржавый лом.'],
  ['A torn page of notes warns: “not the left one”.', 'Рваный лист с записями предупреждает: «только не левая».'],
  ['A single boot, the foot still inside.', 'Один сапог — вместе со ступнёй.'],
  ['A dead rat, recently: it still works.', 'Дохлая крыса, недавняя: значит, всё ещё работает.'],
  ['A chalk mark from another party: an X and a date.', 'Меловая отметка другого отряда: крест и дата.'],
  ['Three broken lockpicks on the floor.', 'Три сломанные отмычки на полу.'],
  ['A purse with a few coins that no one came back for.', 'Кошель с несколькими монетами, за которым никто не вернулся.'],
  ['A burnt lantern and a very clean silhouette on the wall.', 'Обгоревший фонарь и очень чистый силуэт на стене.'],
  ['Nothing at all: it has been swept clean.', 'Ничего: здесь всё тщательно подметено.'],
  ['A dying torch: someone was here less than an hour ago.', 'Догорающий факел: кто-то был здесь меньше часа назад.'],
  ['Scratches on the wall count the days someone spent trapped.', 'Царапины на стене считают дни, которые кто-то провёл взаперти.'],
  ['A holy symbol, snapped in half.', 'Священный символ, разломанный пополам.'],
];
