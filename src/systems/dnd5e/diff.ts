// Что изменилось в листе персонажа D&D между двумя версиями — например, игрок переделал персонажа по замечаниям
// мастера и прислал новый экспорт из Long Story Short. Как слияние в git: каждое изменение (и каждая строка списка)
// принимается или нет, mergeCharacter собирает итоговый лист. Подписи — по-русски, как весь интерфейс.
import { characterInitiative, characterPb, CHARACTER_TEXTS, type CharacterText, type Dnd5eCharacter } from './character';
import { ABILITIES, dict, signed, type Ability } from './stats';

// Одно значение: было → стало. apply переносит новое значение в итоговый лист.
export interface Change {
  id: string;
  label: string;
  before: string;
  after: string;
  apply(target: Dnd5eCharacter): void;
}

// Список (навыки, атаки, заклинания, строки текста): что добавилось и что пропало. apply переносит выбранные строки;
// all — выбраны все (тогда текст берётся из новой версии как есть, со своим порядком и разметкой).
export interface ListChange {
  id: string;
  label: string;
  added: string[];
  removed: string[];
  apply(target: Dnd5eCharacter, added: string[], removed: string[], all: boolean): void;
}

export interface CharacterDiff {
  changes: Change[];
  lists: ListChange[];
}

export const TEXT_TITLES: Record<CharacterText, string> = {
  features: 'Умения',
  traits: 'Особенности и черты',
  proficiencies: 'Владения и языки',
  equipment: 'Снаряжение',
  attacks: 'Атаки: заметки',
  personality: 'Черты характера',
  ideals: 'Идеалы',
  bonds: 'Привязанности',
  flaws: 'Слабости',
  appearance: 'Внешность',
  background: 'Предыстория',
  allies: 'Союзники и организации',
  quests: 'Задания',
};
const COINS = { pp: 'пм', gp: 'зм', ep: 'эм', sp: 'см', cp: 'мм' } as const;
const DETAILS = { age: 'Возраст', height: 'Рост', weight: 'Вес', eyes: 'Глаза', skin: 'Кожа', hair: 'Волосы' } as const;

const ru = dict('ru');
const classes = (c: Dnd5eCharacter) => c.classes.map((x) => `${x.name}${x.subclass ? ` (${x.subclass})` : ''} ${x.level}`).join(' / ');
const skillName = (k: string) => ru.skills[k] ?? k;
const show = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v));

// Строка без разметки списка — чтобы «- Щит» и «Щит» считались одним и тем же.
const bare = (l: string) => l.replace(/^\s*(?:[-*]|\d+\.)\s+/, '').replace(/\*+/g, '').trim();
const rawLines = (t: string | undefined) => (t ?? '').split('\n').filter((l) => bare(l));
// Заклинания уровня — по запятым и строкам.
const items = (t: string | undefined) => (t ?? '').split(/[\n,;]/).map(bare).filter(Boolean);

// Слияние текста по строкам: выбранные пропавшие строки убрать, выбранные новые — дописать в конец (как в новой
// версии, с её разметкой).
function mergeLines(cur: string | undefined, next: string | undefined, added: string[], removed: string[]): string {
  const drop = new Set(removed);
  const add = new Set(added);
  const kept = rawLines(cur).filter((l) => !drop.has(bare(l)));
  const extra = rawLines(next).filter((l) => add.has(bare(l)));
  return [...kept, ...extra].join('\n');
}

const set = <T extends object, K extends keyof T>(o: T, k: K, v: T[K] | undefined) => {
  if (v === undefined) delete o[k];
  else o[k] = v;
};

export function characterDiff(a: Dnd5eCharacter, b: Dnd5eCharacter): CharacterDiff {
  const changes: Change[] = [];
  const lists: ListChange[] = [];
  const val = (id: string, label: string, before: unknown, after: unknown, apply: Change['apply']) => {
    if (show(before) !== show(after)) changes.push({ id, label, before: show(before), after: show(after), apply });
  };
  const list = (id: string, label: string, before: string[], after: string[], apply: ListChange['apply']) => {
    const bs = new Set(before);
    const as = new Set(after);
    const added = [...new Set(after.filter((x) => !bs.has(x)))];
    const removed = [...new Set(before.filter((x) => !as.has(x)))];
    if (added.length || removed.length) lists.push({ id, label, added, removed, apply });
  };
  // Простое поле: новое значение целиком.
  const field = <K extends keyof Dnd5eCharacter>(k: K, label: string, fmt: (v: Dnd5eCharacter[K]) => unknown = (v) => v) =>
    val(k, label, fmt(a[k]), fmt(b[k]), (t) => set(t, k, structuredClone(b[k])));

  val('classes', 'Класс и уровень', classes(a), classes(b), (t) => (t.classes = structuredClone(b.classes)));
  field('race', 'Вид');
  field('background', 'Предыстория');
  field('alignment', 'Мировоззрение');
  field('xp', 'Опыт');
  field('player', 'Игрок');
  field('size', 'Размер', (v) => (v ? (ru.sizes[v] ?? v) : v));
  for (const [k, title] of Object.entries(DETAILS) as [keyof typeof DETAILS, string][]) {
    val(`details.${k}`, title, a.details?.[k], b.details?.[k], (t) => {
      const v = b.details?.[k];
      t.details = { ...t.details };
      set(t.details, k, v);
    });
  }
  for (const ab of ABILITIES) val(`abilities.${ab}`, ru.abilities[ab], a.abilities[ab], b.abilities[ab], (t) => (t.abilities[ab] = b.abilities[ab]));
  // Бонус мастерства и инициатива обычно считаются сами (от уровня и Ловкости) — сравниваем, только если заданы явно.
  if (a.pb !== b.pb) val('pb', 'Бонус мастерства', signed(characterPb(a)), signed(characterPb(b)), (t) => set(t, 'pb', b.pb));
  if (a.initiative !== b.initiative)
    val('initiative', 'Инициатива', signed(characterInitiative(a)), signed(characterInitiative(b)), (t) => set(t, 'initiative', b.initiative));
  field('ac', 'КД');
  field('hpMax', 'Хиты');
  field('hitDie', 'Кость хитов');
  field('speed', 'Скорость');
  field('inspiration', 'Вдохновение', (v) => (v ? 'да' : 'нет'));

  list(
    'saves',
    'Спасброски',
    a.saves.map((x) => ru.abilities[x]),
    b.saves.map((x) => ru.abilities[x]),
    (t, added, removed) => {
      const ab = (name: string) => ABILITIES.find((x) => ru.abilities[x] === name) as Ability;
      t.saves = [...t.saves.filter((x) => !removed.map(ab).includes(x)), ...added.map(ab).filter((x) => !t.saves.includes(x))];
    }
  );
  const skillText = (k: string, v: 1 | 2) => `${skillName(k)}${v === 2 ? ' (компетентность)' : ''}`;
  const skillKey = (c: Dnd5eCharacter, text: string) => Object.entries(c.skills).find(([k, v]) => skillText(k, v) === text);
  list(
    'skills',
    'Навыки',
    Object.entries(a.skills).map(([k, v]) => skillText(k, v)),
    Object.entries(b.skills).map(([k, v]) => skillText(k, v)),
    (t, added, removed) => {
      for (const x of removed) {
        const e = skillKey(a, x);
        if (e && t.skills[e[0]] === e[1]) delete t.skills[e[0]];
      }
      for (const x of added) {
        const e = skillKey(b, x);
        if (e) t.skills[e[0]] = e[1];
      }
    }
  );
  const attack = (x: Dnd5eCharacter['attacks'][number]) => [x.name, x.bonus, x.damage].filter(Boolean).join(' · ');
  list('attacks', 'Атаки', a.attacks.map(attack), b.attacks.map(attack), (t, added, removed) => {
    t.attacks = [...t.attacks.filter((x) => !removed.includes(attack(x))), ...b.attacks.filter((x) => added.includes(attack(x)))];
  });

  const sa = a.spellcasting;
  const sb = b.spellcasting;
  // Заклинательство в итоговом листе (появилось только в новой версии — заводим с её характеристикой).
  const cast = (t: Dnd5eCharacter) => (t.spellcasting ??= { ability: sb?.ability ?? 'int', slots: {}, spells: {} });
  if (sa && !sb) {
    val('spellcasting', 'Заклинания', 'есть', 'нет', (t) => delete t.spellcasting);
  } else if (sb) {
    val('spellcasting.ability', 'Заклинательная характеристика', sa ? ru.abilities[sa.ability] : '', ru.abilities[sb.ability], (t) => (cast(t).ability = sb.ability));
    val('spellcasting.dc', 'СЛ заклинаний', sa?.dc, sb.dc, (t) => set(cast(t), 'dc', sb.dc));
    val('spellcasting.attack', 'Атака заклинанием', sa?.attack !== undefined ? signed(sa.attack) : '', sb.attack !== undefined ? signed(sb.attack) : '', (t) =>
      set(cast(t), 'attack', sb.attack)
    );
    const levels = [...new Set([...Object.keys(sa?.slots ?? {}), ...Object.keys(sb.slots)])].sort((x, y) => Number(x) - Number(y));
    for (const l of levels) val(`spellcasting.slots.${l}`, `Ячейки ${l}-го круга`, sa?.slots[l], sb.slots[l], (t) => set(cast(t).slots, l, sb.slots[l]));
    const spellLevels = [...new Set([...Object.keys(sa?.spells ?? {}), ...Object.keys(sb.spells)])].sort((x, y) => Number(x) - Number(y));
    for (const l of spellLevels) {
      list(`spellcasting.spells.${l}`, l === '0' ? 'Заговоры' : `Заклинания ${l}-го круга`, items(sa?.spells[l]), items(sb.spells[l]), (t, added, removed, all) => {
        const s = cast(t).spells;
        const text = all ? (sb.spells[l] ?? '') : [...items(s[l]).filter((x) => !removed.includes(x)), ...added].join(', ');
        set(s, l, text || undefined);
      });
    }
  }

  for (const [k, title] of Object.entries(COINS) as [keyof typeof COINS, string][]) {
    val(`coins.${k}`, `Монеты, ${title}`, a.coins?.[k], b.coins?.[k], (t) => {
      t.coins = { ...t.coins };
      set(t.coins, k, b.coins?.[k]);
    });
  }
  for (const k of CHARACTER_TEXTS) {
    list(`text.${k}`, TEXT_TITLES[k], rawLines(a.text[k]).map(bare), rawLines(b.text[k]).map(bare), (t, added, removed, all) => {
      const text = all ? (b.text[k] ?? '') : mergeLines(t.text[k], b.text[k], added, removed);
      t.text = { ...t.text };
      set(t.text, k, text || undefined);
    });
  }
  // Заметки — целиком по заголовку.
  const titles = [...new Set([...(a.notes ?? []), ...(b.notes ?? [])].map((n) => n.title))];
  for (const title of titles) {
    const before = a.notes?.find((n) => n.title === title)?.text;
    const after = b.notes?.find((n) => n.title === title)?.text;
    val(`notes.${title}`, `Заметка «${title || 'без названия'}»`, before?.trim(), after?.trim(), (t) => {
      const rest = (t.notes ?? []).filter((n) => n.title !== title);
      t.notes = after === undefined ? rest : [...rest, { title, text: after }];
    });
  }

  return { changes, lists };
}

export const isEmptyDiff = (d: CharacterDiff) => !d.changes.length && !d.lists.length;

// Ключ строки списка для выбора: «skills+Акробатика», «attacks−Кинжал · +5 · 1d4+3».
export const lineId = (list: ListChange, added: boolean, text: string) => `${list.id}${added ? '+' : '−'}${text}`;

// Все изменения разом (выбор по умолчанию — взять всё новое).
export const allIds = (d: CharacterDiff) => [
  ...d.changes.map((c) => c.id),
  ...d.lists.flatMap((l) => [...l.added.map((x) => lineId(l, true, x)), ...l.removed.map((x) => lineId(l, false, x))]),
];

// Итоговый лист: прежний с принятыми изменениями.
export function mergeCharacter(a: Dnd5eCharacter, d: CharacterDiff, accepted: ReadonlySet<string>): Dnd5eCharacter {
  const t = structuredClone(a);
  for (const c of d.changes) if (accepted.has(c.id)) c.apply(t);
  for (const l of d.lists) {
    const added = l.added.filter((x) => accepted.has(lineId(l, true, x)));
    const removed = l.removed.filter((x) => accepted.has(lineId(l, false, x)));
    if (added.length || removed.length) l.apply(t, added, removed, added.length === l.added.length && removed.length === l.removed.length);
  }
  return t;
}
