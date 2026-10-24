// Журнал бросков мастера: броски из статблоков и листов персонажей (к20 и урон D&D, кубы Fate). Только в окне управления, игрокам не виден.
import { hotkeyLabel } from '../../shared/hotkeys';
import { t } from './i18n.svelte';
import { die, parseDice, rollD20, rollDamage, rollFate, rollPool, rollSave, type D20Mode, type D20Roll, type DamageRoll, type FateRoll, type PoolRoll, type SaveRoll } from '../../shared/dice';
import { getLang } from '../../shared/i18n';
import { pushPool, rollPack, type PackRollResult, type RollSpec, type RollWords } from '../../shared/syspack';

export interface RollEntry {
  id: number;
  time: number;
  // Кто бросает и что: «Гоблин», «Скимитар».
  who: string;
  what: string;
  d20?: D20Roll;
  // Кубы Fate (4dF) + навык.
  fate?: FateRoll;
  // Roll-under save (Mausritter): d20 ≤ the attribute.
  save?: SaveRoll;
  // Forged in the Dark: a pool of d6; `resist` — a resistance roll (stress taken instead of the outcome).
  pool?: PoolRoll & { resist?: boolean };
  // A roll of a system pack (shared/syspack.ts); `pushed` — it was pushed already.
  pack?: PackRollResult & { pushed?: boolean };
  // Попадание проверяется по натуральной 20/1 только у атак.
  attack?: boolean;
  damage: DamageRoll[];
}

const MAX = 50;
let next = 1;

class Rolls {
  list = $state<RollEntry[]>([]);
  open = $state(false);

  private push(e: Omit<RollEntry, 'id' | 'time'>) {
    this.list = [...this.list, { ...e, id: next++, time: Date.now() }].slice(-MAX);
    this.open = true;
  }

  // Проверка, спасбросок, навык, инициатива.
  check(who: string, what: string, bonus: number, mode: D20Mode = 'normal') {
    this.push({ who, what, d20: rollD20(bonus, mode), damage: [] });
  }

  // Атака: к20 и сразу урон (на натуральной 20 — с удвоенными кубами).
  attack(who: string, what: string, bonus: number, damage: string[], mode: D20Mode = 'normal') {
    const d20 = rollD20(bonus, mode);
    const crit = d20.natural === 20;
    const dmg = damage.map(parseDice).filter((x) => x !== null).map((x) => rollDamage(x, crit));
    this.push({ who, what, d20, attack: true, damage: dmg });
  }

  // Fate: 4dF + навык.
  fate(who: string, what: string, bonus: number) {
    this.push({ who, what, fate: rollFate(bonus), damage: [] });
  }

  // Mausritter: a save against STR, DEX or WIL.
  save(who: string, what: string, target: number, mode: D20Mode = 'normal') {
    this.push({ who, what, save: rollSave(target, mode), damage: [] });
  }

  // Forged in the Dark: an action, fortune or resistance roll of n dice.
  pool(who: string, what: string, n: number, resist = false) {
    this.push({ who, what, pool: { ...rollPool(n), ...(resist ? { resist: true } : {}) }, damage: [] });
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

  damage(who: string, what: string, damage: string, crit = false) {
    const e = parseDice(damage);
    if (e) this.push({ who, what, damage: [rollDamage(e, crit)] });
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
});

// Shift — с преимуществом, ⌥/Alt — с помехой.
export const modeOf = (e: MouseEvent): D20Mode => (e.shiftKey ? 'advantage' : e.altKey ? 'disadvantage' : 'normal');

export const rollHint = () => t('lib.rollHint', { adv: hotkeyLabel('advantage'), dis: hotkeyLabel('disadvantage') });
