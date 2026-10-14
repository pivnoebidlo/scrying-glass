// Таблицы случайностей: обычный Markdown, который удобно писать и править в Obsidian.
//
//   # Слухи в таверне          — название (иначе — имя файла)
//   - Мельник разбавляет муку.  — строка списка: вариант
//   - 3× Видели огни на болоте. — «3×» (или «3x») — вариант выпадает втрое чаще
//   1-4: Ничего не случилось.   — диапазоны и номера, как в книжных таблицах d20 (тогда вес — ширина диапазона)
//   | 5-6 | Волки |             — то же в строках Markdown-таблицы
//
// В тексте варианта: [[Имена эльфов]] — бросок по другой таблице (вики-ссылка Obsidian), {2d6+1} — бросок кубов,
// {меч|топор|лук} — один из вариантов. Остальные строки (описания, заголовки разделов) пропускаются.
import { parseDice, rollDamage } from './dice';

export interface TableEntry {
  text: string;
  weight: number;
  // Диапазон, если он указан в таблице («1-4»).
  from?: number;
  to?: number;
}

export interface RandomTable {
  title: string;
  // Обычный текст перед вариантами (пояснение к таблице).
  description: string;
  entries: TableEntry[];
}

const LIST = /^\s*[-*+]\s+(?:(\d+)\s*[×xх]\s+)?(.+?)\s*$/;
const RANGE = /^\s*(\d+)\s*(?:[-–—]\s*(\d+)\s*)?[.:)]\s+(.+?)\s*$/;
const ROW = /^\s*\|\s*(\d+)\s*(?:[-–—]\s*(\d+)\s*)?\|\s*(.+?)\s*\|?\s*$/;

export function parseTable(text: string, fallbackTitle: string): RandomTable {
  let title = '';
  const about: string[] = [];
  const entries: TableEntry[] = [];
  for (const line of text.split(/\r?\n/)) {
    const h = /^\s*#\s+(.+?)\s*$/.exec(line);
    if (h && !title) {
      title = h[1]!;
      continue;
    }
    const l = LIST.exec(line);
    if (l) {
      entries.push({ text: l[2]!, weight: Math.max(1, Math.min(100, Number(l[1] ?? 1))) });
      continue;
    }
    const row = ROW.exec(line);
    const r = row ?? RANGE.exec(line);
    if (r) {
      const from = Number(r[1]);
      const to = Math.max(from, Number(r[2] ?? r[1]));
      // Ячейки строки Markdown-таблицы — через « · » (в обычной строке «|» — это выбор {а|б}, его не трогаем).
      const body = row ? r[3]!.split('|').map((c) => c.trim()).filter(Boolean).join(' · ') : r[3]!.trim();
      if (body) entries.push({ text: body, weight: to - from + 1, from, to });
      continue;
    }
    if (!entries.length && line.trim() && !/^\s*(#|\||>)/.test(line)) about.push(line.trim());
  }
  return { title: title || fallbackTitle, description: about.join(' '), entries };
}

// Сколько граней у таблицы с диапазонами 1…N подряд («d20»); null — таблица без номеров или с дырами.
export function tableDie(t: RandomTable): number | null {
  if (!t.entries.length || t.entries.some((e) => e.from === undefined)) return null;
  const sorted = [...t.entries].sort((a, b) => a.from! - b.from!);
  let next = 1;
  for (const e of sorted) {
    if (e.from !== next) return null;
    next = e.to! + 1;
  }
  return next - 1;
}

export interface RollContext {
  // Таблица по названию из [[ссылки]] (название или имя файла, без учёта регистра); нет — null.
  resolve(name: string): RandomTable | null;
  // Случайное число [0, 1). По умолчанию — crypto.
  random?: () => number;
}

const cryptoRandom = () => {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return b[0]! / 0x100000000;
};

export interface TableRoll {
  index: number;
  // На какое число выпало (для таблиц с номерами), иначе null.
  number: number | null;
  // Текст варианта с подставленными бросками и ссылками.
  text: string;
}

const MAX_DEPTH = 6;

export function rollTable(t: RandomTable, ctx: RollContext, depth = 0): TableRoll | null {
  if (!t.entries.length) return null;
  const rnd = ctx.random ?? cryptoRandom;
  const die = tableDie(t);
  let index: number;
  let number: number | null = null;
  if (die) {
    number = 1 + Math.floor(rnd() * die);
    index = t.entries.findIndex((e) => number! >= e.from! && number! <= e.to!);
  } else {
    const total = t.entries.reduce((a, e) => a + e.weight, 0);
    let x = rnd() * total;
    index = t.entries.findIndex((e) => (x -= e.weight) < 0);
    if (index < 0) index = t.entries.length - 1;
  }
  return { index, number, text: expand(t.entries[index]!.text, ctx, depth) };
}

// Подставить броски: [[Таблица]] / [[Таблица|подпись]], {2d6}, {a|b|c}. Глубина ссылок ограничена (таблица могла
// сослаться сама на себя).
export function expand(text: string, ctx: RollContext, depth = 0): string {
  const rnd = ctx.random ?? cryptoRandom;
  return text
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g, (all, name: string) => {
      const t = depth < MAX_DEPTH ? ctx.resolve(name.trim()) : null;
      return t ? (rollTable(t, ctx, depth + 1)?.text ?? '') : name.trim();
    })
    .replace(/\{([^{}]+)\}/g, (all, body: string) => {
      if (body.includes('|')) {
        const opts = body.split('|').map((s) => s.trim());
        return opts[Math.floor(rnd() * opts.length)] ?? '';
      }
      const dice = /^\s*\d*\s*[dдкk]\s*\d+/iu.test(body) ? parseDice(body) : null;
      return dice ? String(rollDamage(dice).total) : all;
    });
}

// Сравнение названий таблиц для [[ссылок]]: без регистра, «ё» = «е», без лишних пробелов.
export const tableKey = (name: string) => name.normalize('NFC').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
