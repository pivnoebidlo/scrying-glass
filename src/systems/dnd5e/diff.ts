// Что изменилось в листе персонажа D&D между двумя версиями — например, игрок переделал персонажа по замечаниям
// мастера и прислал новый экспорт из Long Story Short. Подписи — по-русски, как весь интерфейс.
import { characterInitiative, characterPb, totalLevel, type Dnd5eCharacter, type CharacterText } from './character';
import { ABILITIES, dict, signed } from './stats';

// Одно значение: было → стало.
export interface Change {
  label: string;
  before: string;
  after: string;
}

// Список (навыки, атаки, заклинания, строки текста): что добавилось и что пропало.
export interface ListChange {
  label: string;
  added: string[];
  removed: string[];
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

const ru = dict('ru');
const classes = (c: Dnd5eCharacter) => c.classes.map((x) => `${x.name}${x.subclass ? ` (${x.subclass})` : ''} ${x.level}`).join(' / ');
const skillName = (k: string) => ru.skills[k] ?? k;

// Строки текста без разметки списков и пустых — чтобы «- Щит» и «Щит» считались одним и тем же.
const lines = (t: string | undefined) =>
  (t ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*]|\d+\.)\s+/, '').trim())
    .filter(Boolean);
// Заклинания уровня — по запятым и строкам.
const items = (t: string | undefined) =>
  (t ?? '')
    .split(/[\n,;]/)
    .map((l) => l.replace(/^\s*(?:[-*]|\d+\.)\s+/, '').replace(/\*+/g, '').trim())
    .filter(Boolean);

function listChange(label: string, before: string[], after: string[]): ListChange | null {
  const a = new Set(before);
  const b = new Set(after);
  const added = after.filter((x) => !a.has(x));
  const removed = before.filter((x) => !b.has(x));
  return added.length || removed.length ? { label, added, removed } : null;
}

export function characterDiff(a: Dnd5eCharacter, b: Dnd5eCharacter): CharacterDiff {
  const changes: Change[] = [];
  const lists: ListChange[] = [];
  const val = (label: string, before: unknown, after: unknown) => {
    const x = before === undefined || before === null || before === '' ? '—' : String(before);
    const y = after === undefined || after === null || after === '' ? '—' : String(after);
    if (x !== y) changes.push({ label, before: x, after: y });
  };
  const list = (label: string, before: string[], after: string[]) => {
    const l = listChange(label, before, after);
    if (l) lists.push(l);
  };

  val('Класс и уровень', classes(a), classes(b));
  // У мультикласса — ещё и общий уровень (у одного класса он уже виден в строке выше).
  if (a.classes.length > 1 || b.classes.length > 1) val('Общий уровень', totalLevel(a), totalLevel(b));
  val('Вид', a.race, b.race);
  val('Предыстория', a.background, b.background);
  val('Мировоззрение', a.alignment, b.alignment);
  val('Опыт', a.xp, b.xp);
  for (const ab of ABILITIES) val(ru.abilities[ab], a.abilities[ab], b.abilities[ab]);
  val('Бонус мастерства', signed(characterPb(a)), signed(characterPb(b)));
  val('КД', a.ac, b.ac);
  val('Хиты', a.hpMax, b.hpMax);
  val('Кость хитов', a.hitDie, b.hitDie);
  val('Скорость', a.speed, b.speed);
  val('Инициатива', signed(characterInitiative(a)), signed(characterInitiative(b)));
  val('Вдохновение', a.inspiration ? 'да' : 'нет', b.inspiration ? 'да' : 'нет');

  list('Спасброски', a.saves.map((x) => ru.abilities[x]), b.saves.map((x) => ru.abilities[x]));
  const skills = (c: Dnd5eCharacter) => Object.entries(c.skills).map(([k, v]) => `${skillName(k)}${v === 2 ? ' (компетентность)' : ''}`);
  list('Навыки', skills(a), skills(b));
  const attack = (x: Dnd5eCharacter['attacks'][number]) => [x.name, x.bonus, x.damage].filter(Boolean).join(' · ');
  list('Атаки', a.attacks.map(attack), b.attacks.map(attack));

  const sa = a.spellcasting;
  const sb = b.spellcasting;
  if (sa || sb) {
    val('Заклинательная характеристика', sa ? ru.abilities[sa.ability] : '', sb ? ru.abilities[sb.ability] : '');
    val('СЛ заклинаний', sa?.dc, sb?.dc);
    val('Атака заклинанием', sa?.attack !== undefined ? signed(sa.attack) : '', sb?.attack !== undefined ? signed(sb.attack) : '');
    const levels = [...new Set([...Object.keys(sa?.slots ?? {}), ...Object.keys(sb?.slots ?? {})])].sort((x, y) => Number(x) - Number(y));
    for (const l of levels) val(`Ячейки ${l}-го круга`, sa?.slots[l], sb?.slots[l]);
    const spellLevels = [...new Set([...Object.keys(sa?.spells ?? {}), ...Object.keys(sb?.spells ?? {})])].sort((x, y) => Number(x) - Number(y));
    for (const l of spellLevels) list(l === '0' ? 'Заговоры' : `Заклинания ${l}-го круга`, items(sa?.spells[l]), items(sb?.spells[l]));
  }

  for (const [k, t] of Object.entries(COINS)) val(`Монеты, ${t}`, a.coins?.[k as keyof typeof COINS], b.coins?.[k as keyof typeof COINS]);
  for (const [k, t] of Object.entries(TEXT_TITLES)) list(t, lines(a.text[k as CharacterText]), lines(b.text[k as CharacterText]));
  const notes = (c: Dnd5eCharacter) => (c.notes ?? []).flatMap((n) => lines(n.text).map((l) => (n.title ? `${n.title}: ${l}` : l)));
  list('Заметки', notes(a), notes(b));

  return { changes, lists };
}

export const isEmptyDiff = (d: CharacterDiff) => !d.changes.length && !d.lists.length;
