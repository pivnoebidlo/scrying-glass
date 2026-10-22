// Wild magic (Tools → Wild magic, D&D): tables of surges rolled on a d100 (or any die). Built in — our own surge
// table (written for the app, English and Russian in pairs) and the Wand of Wonder from the SRD compendium (taken from
// the entry, so the GM's edit of it counts); the GM's own tables — pasted text, kept in the library (wild-magic.json).
// Pure functions: parsing a table from text, the row for a roll.

export interface SurgeRow {
  from: number;
  to: number;
  text: string;
}
export interface SurgeTable {
  id: string;
  title: string;
  // The die: the largest number of the table (100 for a d100).
  die: number;
  rows: SurgeRow[];
}

// «01–02», «7», «98-00» (00 — 100 on a d100).
const num = (s: string) => (s === '00' ? 100 : Number(s));
// A row starts a line (or a cell): «01–02 text», «| 01-05 | text |», «7. text», «7) text».
const HEAD = /^(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?(?:\s*[.):|]\s*|\s+)(.*)$/;
// A row inside the text of another one, as in tables whose rows were merged: «You cast slow. 06-10 You cast…».
// Only a range after the end of a sentence — numbers in the text («on a 01-25, a rhinoceros») stay.
const INNER = /(?<=[.!?…»"”)*]\s)(\d{2,3})\s*[-–—]\s*(\d{2,3})\s+(?=\S)/g;

// A table from text: a Markdown table, numbered lines or plain lines (then each line is one number: a d<lines>).
// Header and separator rows of a Markdown table, empty lines and «# …» are skipped.
export function parseTable(text: string): SurgeRow[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !/^\|?[\s:|-]+\|?$/.test(l))
    .map((l) => (l.startsWith('|') ? l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).filter(Boolean).join(' ') : l));
  const numbered = lines.filter((l) => HEAD.test(l));
  if (!numbered.length) return lines.map((text, i) => ({ from: i + 1, to: i + 1, text }));
  const rows: SurgeRow[] = [];
  for (const line of lines) {
    const m = HEAD.exec(line);
    if (!m) {
      // A line without a number goes on the row before it (a long effect on several lines).
      const last = rows.at(-1);
      if (last) last.text = `${last.text} ${line}`;
      continue;
    }
    let from = num(m[1]!);
    let to = m[2] ? num(m[2]) : from;
    let rest = m[3]!;
    for (const inner of [...rest.matchAll(INNER)]) {
      const at = rest.indexOf(inner[0]);
      rows.push({ from, to, text: rest.slice(0, at).trim() });
      from = num(inner[1]!);
      to = num(inner[2]!);
      rest = rest.slice(at + inner[0].length);
    }
    rows.push({ from, to, text: rest.trim() });
  }
  return rows.filter((r) => r.text && r.to >= r.from);
}

export const dieOf = (rows: SurgeRow[]) => rows.reduce((n, r) => Math.max(n, r.to), 0);

export const rowFor = (table: SurgeTable, roll: number) => table.rows.find((r) => roll >= r.from && roll <= r.to) ?? null;

export const rollDie = (die: number, random: () => number = Math.random) => 1 + Math.floor(random() * die);

// «01–02» on a d100, «7» on a d8.
export function rangeText(r: SurgeRow, die: number): string {
  const pad = (n: number) => (die >= 100 && n < 100 ? String(n).padStart(2, '0') : String(n));
  return r.from === r.to ? pad(r.from) : `${pad(r.from)}–${pad(r.to)}`;
}

// The GM's tables in the library file: { tables: [{ id, title, text }] } — the text as pasted (parsed on load).
export interface OwnTable {
  id: string;
  title: string;
  text: string;
}
export function parseOwnTables(data: unknown): OwnTable[] {
  const list = (data as { tables?: unknown } | null)?.tables;
  if (!Array.isArray(list)) return [];
  return list.flatMap((x) => {
    const t = x as Partial<OwnTable>;
    return typeof t.id === 'string' && typeof t.title === 'string' && typeof t.text === 'string' ? [{ id: t.id, title: t.title, text: t.text }] : [];
  });
}

// Our own surge table: 50 effects, two numbers each. English and Russian in pairs; spell names in *italics* are SRD
// spells of both editions (they become links).
const SURGE: [string, string][] = [
  ['For the next minute, every word you speak is echoed three times from somewhere nearby.', 'Минуту каждое ваше слово трижды повторяет эхо откуда-то поблизости.'],
  ['You cast *Fog Cloud* centered on yourself.', 'Вы накладываете *Туманное облако* с центром на себе.'],
  ['Your shadow comes loose and follows you for 1 hour, a step behind, copying everything you do a moment too late.', 'Ваша тень отделяется и час ходит за вами на шаг позади, повторяя всё с опозданием.'],
  ['For 1 round you fall upward: you rise 20 feet, and at the start of your next turn you fall back down.', 'На 1 раунд вы падаете вверх: поднимаетесь на 20 футов, а в начале следующего хода падаете обратно.'],
  ['You cast *Faerie Fire* centered on yourself; the light is the color of your eyes.', 'Вы накладываете *Огонь фей* с центром на себе; свет — цвета ваших глаз.'],
  ['Every open flame within 60 feet goes out and relights 1 minute later in a different color.', 'Все открытые огни в пределах 60 футов гаснут и через минуту загораются снова — другого цвета.'],
  ['You regain 2d8 hit points as warm golden light pours from your mouth.', 'Вы восстанавливаете 2к8 хитов; изо рта льётся тёплый золотой свет.'],
  ['The nearest door, chest or lid within 30 feet of you bursts open.', 'Ближайшая к вам дверь, сундук или крышка в пределах 30 футов распахивается.'],
  ['You cast *Thunderwave* at its lowest level.', 'Вы накладываете заклинание *Волна грома* наименьшего уровня.'],
  ['For 1 hour you understand animals as if under *Speak with Animals*, but people sound like birdsong to you.', 'Час вы понимаете животных, как от заклинания *Разговор с животными*, а речь людей звучит для вас как птичий щебет.'],
  ['Your hair grows a foot longer and turns silver; it goes back to normal after a long rest.', 'Ваши волосы отрастают на фут и становятся серебряными; после долгого отдыха всё возвращается.'],
  ['A small rain cloud forms over your head and follows you for 10 minutes.', 'Над вашей головой появляется маленькая дождевая туча и десять минут следует за вами.'],
  ['You cast *Misty Step*, but the GM chooses where you appear.', 'Вы накладываете *Туманный шаг*, но где вы появитесь, решает мастер.'],
  ['The next creature you touch within 1 minute regains 1d8 hit points; undead takes 1d8 radiant damage instead.', 'Следующее существо, которого вы коснётесь в течение минуты, восстанавливает 1к8 хитов; нежить вместо этого получает 1к8 урона излучением.'],
  ['Every coin you carry turns to copper for 24 hours.', 'Все монеты при вас на сутки становятся медными.'],
  ['You cast *Entangle* centered on a point 20 feet in front of you.', 'Вы накладываете *Опутывание* с центром в точке в 20 футах перед вами.'],
  ['You shed bright light in a 20-foot radius for 1 minute, as if under *Light*, and cannot put it out.', 'Минуту вы испускаете яркий свет радиусом 20 футов, как от заклинания *Свет*, и не можете его погасить.'],
  ['You swap places with the nearest creature you can see within 60 feet.', 'Вы меняетесь местами с ближайшим видимым вами существом в пределах 60 футов.'],
  ['For the next hour you can only speak in questions.', 'Следующий час вы можете говорить только вопросами.'],
  ['You cast *Slow*; you are one of its targets.', 'Вы накладываете *Замедление*; одна из целей — вы сами.'],
  ['You cast *Haste* on the creature nearest to you (not yourself); it lasts 1 minute without concentration.', 'Вы накладываете *Ускорение* на ближайшее к вам существо (не на себя); оно длится минуту без концентрации.'],
  ['Every plant within 30 feet bursts into bloom; the scent can be smelled a mile away.', 'Растения в пределах 30 футов разом зацветают; запах слышно за милю.'],
  ['You turn invisible for 1 minute — but your clothes and gear do not.', 'Вы становитесь невидимы на минуту — но одежда и снаряжение остаются видимыми.'],
  ['You cast *Grease* under your own feet.', 'Вы накладываете *Скольжение* себе под ноги.'],
  ['A spectral hand, as from *Mage Hand*, does small tasks for you for 1 hour — slowly and grudgingly.', 'Призрачная рука, как от заклинания *Волшебная рука*, час выполняет ваши мелкие просьбы — медленно и нехотя.'],
  ['Each creature within 30 feet, you included, must succeed on a DC 13 Wisdom saving throw or laugh for 1 round as if under *Hideous Laughter*.', 'Каждое существо в пределах 30 футов, включая вас, должно преуспеть в спасброске Мудрости СЛ 13, иначе 1 раунд смеётся, как от заклинания *Жуткий смех*.'],
  ['For 1 minute you weigh almost nothing, as if under *Feather Fall*; a strong wind can carry you off.', 'Минуту вы почти ничего не весите, как от заклинания *Падение пёрышком*; сильный ветер может вас унести.'],
  ['Small objects (up to 1 pound) within 10 feet float into the air and drop 1 minute later.', 'Мелкие предметы (до фунта) в пределах 10 футов взлетают и через минуту падают.'],
  ['You cast *Darkness* centered on yourself.', 'Вы накладываете заклинание *Тьма* с центром на себе.'],
  ['Your voice is deafeningly loud for 1 minute; you have disadvantage on Dexterity (Stealth) checks.', 'Минуту ваш голос оглушительно громок; у вас помеха на проверки Ловкости (Скрытность).'],
  ['You cast *Blur* on yourself.', 'Вы накладываете *Размытость* на себя.'],
  ['Two illusory copies of you appear, as from *Mirror Image*, and loudly mock your enemies.', 'Появляются две ваши иллюзорные копии, как от заклинания *Отражения*, и громко дразнят ваших врагов.'],
  ['You gain 2d10 temporary hit points; while they last, your skin is the grey of stone.', 'Вы получаете 2к10 временных хитов; пока они есть, ваша кожа серая, как камень.'],
  ['You cast *Sleep* centered on a point within 30 feet that the GM chooses.', 'Вы накладываете *Усыпление* с центром в точке в пределах 30 футов, которую выбирает мастер.'],
  ['Every nonmagical lock within 60 feet unlocks with a click.', 'Все немагические замки в пределах 60 футов со щелчком открываются.'],
  ['For 1 minute, each time you cast a spell, a flock of sparrows bursts out of your sleeves.', 'Минуту каждый раз, когда вы накладываете заклинание, из ваших рукавов вылетает стая воробьёв.'],
  ['You cast *Fly* on yourself, but you can only fly backward.', 'Вы накладываете на себя *Полёт*, но лететь можете только спиной вперёд.'],
  ['You cast *Blink* on yourself.', 'Вы накладываете на себя *Мерцание*.'],
  ['You cast *Calm Emotions* centered on yourself.', 'Вы накладываете *Успокоение эмоций* с центром на себе.'],
  ['Snow falls in a 30-foot radius around you for 1 minute, whatever the weather.', 'Минуту в радиусе 30 футов вокруг вас идёт снег — какая бы ни была погода.'],
  ['You cast *Stinking Cloud* centered on a point within 60 feet that the GM chooses.', 'Вы накладываете *Удушающее облако* с центром в точке в пределах 60 футов, которую выбирает мастер.'],
  ['You grow one size larger for 1 minute, as if under *Enlarge/Reduce*.', 'Минуту вы на одну категорию размера больше, как от заклинания *Увеличение/уменьшение*.'],
  ['You shrink one size for 1 minute, as if under *Enlarge/Reduce*.', 'Минуту вы на одну категорию размера меньше, как от заклинания *Увеличение/уменьшение*.'],
  ['You and each ally within 30 feet gain the benefit of *Bless* for 1 minute, without concentration.', 'Вы и каждый союзник в пределах 30 футов на минуту получаете *Благословение* без концентрации.'],
  ['Each creature within 30 feet, you included, must succeed on a DC 13 Charisma saving throw or suffer *Bane* for 1 minute.', 'Каждое существо в пределах 30 футов, включая вас, должно преуспеть в спасброске Харизмы СЛ 13, иначе на минуту попадает под заклинание *Порча*.'],
  ['The next spell you cast within 1 minute doesn’t expend a spell slot.', 'Следующее заклинание в течение минуты вы накладываете, не тратя ячейку.'],
  ['You lose your lowest-level unexpended spell slot.', 'Вы теряете неистраченную ячейку самого низкого уровня.'],
  ['You cast *Web* centered on yourself.', 'Вы накладываете заклинание *Паутина* с центром на себе.'],
  ['For 1 hour, any liquid you touch turns to plain water.', 'Час любая жидкость, которой вы касаетесь, превращается в простую воду.'],
  ['Roll twice more on this table and apply both results.', 'Бросьте по этой таблице ещё дважды и примените оба результата.'],
];

export const SURGE_ID = 'surge';
export const surgeRows = (lang: string): SurgeRow[] =>
  SURGE.map(([en, ru], i) => ({ from: i * 2 + 1, to: i * 2 + 2, text: lang === 'ru' ? ru : en }));

// Whether a surge happens at all: the d20 after a sorcerer's spell — in the 2014 rules a surge on a 1, in the 2024 rules
// on a 20.
export type Edition = '2014' | '2024';
export const surgeOn = (edition: Edition) => (edition === '2014' ? 1 : 20);
export const isSurge = (d20: number, edition: Edition) => d20 === surgeOn(edition);
