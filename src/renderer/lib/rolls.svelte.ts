// Журнал бросков мастера: броски из статблоков и листов персонажей (к20 и урон D&D, кубы Fate). Только в окне управления, игрокам не виден.
import { hotkeyLabel } from '../../shared/hotkeys';
import { t } from './i18n.svelte';
import { die, parseDice, rollD20, rollDamage, rollSave, type D20Mode, type D20Roll, type DamageRoll, type SaveRoll } from '../../shared/dice';
import { getLang } from '../../shared/i18n';
import { pushPool, rollPack, type Degrees, type PackRollResult, type RollSpec, type RollWords } from '../../shared/syspack';
import { runTable, type TableEvent, type TablePick, type TableSource, type TableStep } from '../../shared/rolltable';

export interface RollEntry {
  id: number;
  time: number;
  // Кто бросает и что: «Гоблин», «Скимитар».
  who: string;
  what: string;
  d20?: D20Roll;
  // Roll-under save (Mausritter): d20 ≤ the attribute.
  save?: SaveRoll;
  // A roll of a system pack (shared/syspack.ts); `pushed` — it was pushed already.
  pack?: PackRollResult & { pushed?: boolean };
  // A roll table and the tables its result led to (shared/rolltable.ts); `start` — to roll it again.
  table?: { steps: TableStep[]; start: TableSource };
  // Something happened in the game (a fight began, someone went down…): a line only to offer the tables marked so.
  event?: TableEvent;
  // Попадание проверяется по натуральной 20/1 только у атак.
  attack?: boolean;
  // A d20 check judged against a DC typed here: two degrees or four (Pathfinder); dc — the one typed.
  degrees?: Degrees;
  dc?: number;
  damage: DamageRoll[];
}

const MAX = 50;

// Roll tables are compendium entries: the compendium (its background part) tells the log how to find them, Telegram —
// how to send a result. Neither is a part of this file's world (renderer/lib does not import modules).
export interface TableHooks {
  resolve(name: string): TableSource | null;
  // The tables offered on a natural 20 or 1, or on an event of the game, here.
  offered(on: TableEvent): TableSource[];
}
let next = 1;

class Rolls {
  list = $state<RollEntry[]>([]);
  open = $state(false);
  tables = $state.raw<TableHooks | null>(null);
  // Send a result as Markdown (null — no Telegram).
  telegram = $state.raw<((title: string, markdown: string) => void) | null>(null);

  private push(e: Omit<RollEntry, 'id' | 'time'>) {
    this.list = [...this.list, { ...e, id: next++, time: Date.now() }].slice(-MAX);
    this.open = true;
  }

  // Проверка, спасбросок, навык, инициатива.
  // degrees — the log offers a DC to judge it against (Pathfinder: four degrees).
  check(who: string, what: string, bonus: number, mode: D20Mode = 'normal', degrees?: Degrees) {
    this.push({ who, what, d20: rollD20(bonus, mode), ...(degrees ? { degrees } : {}), damage: [] });
  }

  // The DC a check (or a pack's d20 roll) is judged against; null — none.
  setDc(id: number, dc: number | null) {
    this.list = this.list.map((x) => (x.id === id ? (dc === null ? (({ dc: _d, ...rest }) => rest)(x) : { ...x, dc }) : x));
  }

  // Атака: к20 и сразу урон (на натуральной 20 — с удвоенными кубами).
  attack(who: string, what: string, bonus: number, damage: string[], mode: D20Mode = 'normal') {
    const d20 = rollD20(bonus, mode);
    const crit = d20.natural === 20;
    const dmg = damage.map(parseDice).filter((x) => x !== null).map((x) => rollDamage(x, crit));
    this.push({ who, what, d20, attack: true, damage: dmg });
  }

  // Mausritter: a save against STR, DEX or WIL.
  save(who: string, what: string, target: number, mode: D20Mode = 'normal') {
    this.push({ who, what, save: rollSave(target, mode), damage: [] });
  }

  // A roll of a system pack: the spec of the field, its numbers from the card.
  packRoll(who: string, what: string, spec: RollSpec, value: (formula: string) => number, mode: D20Mode = 'normal', row?: Record<string, unknown>) {
    this.push({ who, what, pack: rollPack(spec, value, getLang(), packWords(), die, mode, row), damage: [] });
  }

  // Push a pack's pool roll: a new line, the old one can't be pushed again.
  pushRoll(e: RollEntry) {
    if (!e.pack?.push || e.pack.pushed) return;
    this.list = this.list.map((x) => (x.id === e.id ? { ...x, pack: { ...x.pack!, pushed: true } } : x));
    const r = pushPool(e.pack.push, packWords(), die);
    this.push({ who: e.who, what: `${e.what} · ${t('pack.pushed')}`, pack: { ...r, pushed: true }, damage: [] });
  }

  // A roll table: rolled with the chain of tables its result links to; `pick` — the numbers the players rolled.
  table(start: TableSource, who = t('cmp.type.table'), pick?: TablePick) {
    const steps = runTable(start, (name) => this.tables?.resolve(name) ?? null, die, pick);
    this.push({ who, what: start.title, table: { steps, start }, damage: [] });
  }

  // An event of the game: a line in the log only when some table is offered on it.
  event(on: TableEvent, who: string, what: string) {
    if (this.tables?.offered(on).length) this.push({ who, what, event: on, damage: [] });
  }

  // double — what a critical hit doubles: the dice (D&D) or the whole damage (Pathfinder 2e).
  damage(who: string, what: string, damage: string, crit = false, double: 'dice' | 'total' = 'dice') {
    const e = parseDice(damage);
    if (e) this.push({ who, what, damage: [rollDamage(e, crit, double)] });
  }

  clear() {
    this.list = [];
  }
}

export const rolls = new Rolls();

const packWords = (): RollWords => ({
  success: t('pack.success'),
  failure: t('pack.failure'),
  successes: (count) => t('pack.successes', { count }),
  critical: t('pack.critical'),
  full: t('lib.pool.success'),
  partial: t('lib.pool.partial'),
  bad: t('lib.pool.bad'),
  stress: (n) => (n < 0 ? t('lib.resistClear') : t('lib.resistStress', { n })),
  bane: (kind, n) => t(kind === 'gear' ? 'pack.baneGear' : 'pack.baneBase', { n }),
  panic: t('pack.panic'),
});

// Shift — с преимуществом, ⌥/Alt — с помехой.
export const modeOf = (e: MouseEvent): D20Mode => (e.shiftKey ? 'advantage' : e.altKey ? 'disadvantage' : 'normal');

export const rollHint = () => t('lib.rollHint', { adv: hotkeyLabel('advantage'), dis: hotkeyLabel('disadvantage') });
