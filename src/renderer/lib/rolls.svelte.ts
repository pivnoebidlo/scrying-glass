// Журнал бросков мастера: броски из статблоков и листов персонажей. Только в окне управления, игрокам не виден.
import { parseDice, rollD20, rollDamage, type D20Mode, type D20Roll, type DamageRoll } from '../../shared/dice';

export interface RollEntry {
  id: number;
  time: number;
  // Кто бросает и что: «Гоблин», «Скимитар».
  who: string;
  what: string;
  d20?: D20Roll;
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

  damage(who: string, what: string, damage: string, crit = false) {
    const e = parseDice(damage);
    if (e) this.push({ who, what, damage: [rollDamage(e, crit)] });
  }

  clear() {
    this.list = [];
  }
}

export const rolls = new Rolls();

// Shift — с преимуществом, ⌥/Alt — с помехой.
export const modeOf = (e: MouseEvent): D20Mode => (e.shiftKey ? 'advantage' : e.altKey ? 'disadvantage' : 'normal');

export const ROLL_HINT = 'Shift — с преимуществом, ⌥ — с помехой';
