import { describe, expect, it } from 'vitest';
import initiative from '../src/modules/initiative/main';
import { ordered } from '../src/modules/initiative/order';
import type { Combatant, InitiativeState } from '../src/modules/initiative/types';
import { run } from './helpers';

const S0 = initiative.initialState;
const act = (s: InitiativeState, a: string, p?: unknown) => run(initiative, s, a, p);

function fight(list: Partial<Combatant>[]): InitiativeState {
  return list.reduce((s, c) => act(s, 'add', { c }), S0);
}
const names = (s: InitiativeState) => ordered(s.combatants).map((c) => c.name);
const turnName = (s: InitiativeState) => s.combatants.find((c) => c.id === s.turn)?.name;

describe('инициатива', () => {
  it('порядок: инициатива, бонус, партия раньше противника, без броска — в конце', () => {
    const s = fight([
      { name: 'Гоблин', init: 15, bonus: 2 },
      { name: 'Паладин', init: 15, bonus: 2, side: 'party' },
      { name: 'Волк', init: 15, bonus: 3 },
      { name: 'Крыса', init: null },
      { name: 'Огр', init: 20 },
    ]);
    expect(names(s)).toEqual(['Огр', 'Волк', 'Паладин', 'Гоблин', 'Крыса']);
  });

  it('ходы по кругу, новый раунд, побеждённые пропускаются', () => {
    let s = fight([
      { name: 'А', init: 20, side: 'party' },
      { name: 'Б', init: 15, maxHp: 10 },
      { name: 'В', init: 10 },
    ]);
    s = act(s, 'start');
    expect([turnName(s), s.round]).toEqual(['А', 1]);
    const b = s.combatants.find((c) => c.name === 'Б')!;
    s = act(s, 'changeHp', { id: b.id, amount: -50 });
    expect(s.combatants.find((c) => c.name === 'Б')!.hp).toBe(0);
    s = act(s, 'next');
    expect(turnName(s)).toBe('В');
    s = act(s, 'next');
    expect([turnName(s), s.round]).toEqual(['А', 2]);
    s = act(s, 'prev');
    expect([turnName(s), s.round]).toEqual(['В', 1]);
  });

  it('хиты не выходят за 0 и максимум', () => {
    let s = fight([{ name: 'Гоблин', maxHp: 7 }]);
    const id = s.combatants[0]!.id;
    s = act(s, 'changeHp', { id, amount: -3 });
    s = act(s, 'changeHp', { id, amount: 100 });
    expect(s.combatants[0]!.hp).toBe(7);
  });

  it('удалили того, чей ход, — ход у следующего', () => {
    let s = act(fight([{ name: 'А', init: 20 }, { name: 'Б', init: 10 }]), 'start');
    s = act(s, 'remove', { id: s.turn });
    expect(turnName(s)).toBe('Б');
  });

  it('заготовка: участники копируются в бой с новыми id и полными хитами, заготовка остаётся', () => {
    let s = act(S0, 'createEncounter', { id: 'e1', name: 'Крысы', adventure: null });
    s = act(s, 'add', { c: { name: 'Крыса', maxHp: 4, hp: 1 }, encounter: 'e1' });
    expect(s.combatants).toHaveLength(0);
    s = act(s, 'startEncounter', { id: 'e1' });
    const enc = s.encounters[0]!.combatants[0]!;
    const inFight = s.combatants[0]!;
    expect(inFight.name).toBe('Крыса');
    expect(inFight.hp).toBe(4);
    expect(inFight.id).not.toBe(enc.id);
    expect(s.encounters[0]!.combatants).toHaveLength(1);
  });

  it('старое сохранение без положения полосы получает его по умолчанию', () => {
    const old = { ...S0, display: { size: 2, names: false, wounds: true } } as unknown as InitiativeState;
    const s = initiative.init!(old, {} as never);
    expect(s.display).toEqual({ size: 2, names: false, wounds: true, position: 'top' });
  });
});

describe('prepared fights from the right panel', () => {
  function prepared(): InitiativeState {
    let s = act(S0, 'add', { c: { name: 'Paladin', side: 'party' } });
    s = act(s, 'createEncounter', { id: 'rats', name: 'Rats', adventure: null });
    s = act(s, 'add', { c: { name: 'Rat' }, encounter: 'rats' });
    s = act(s, 'add', { c: { name: 'Paladin', side: 'party' }, encounter: 'rats' });
    s = act(s, 'createEncounter', { id: 'gob', name: 'Goblins', adventure: null });
    s = act(s, 'add', { c: { name: 'Goblin' }, encounter: 'gob' });
    s = act(s, 'add', { c: { name: 'Rogue', side: 'party' }, encounter: 'gob' });
    return s;
  }

  it('another fight replaces the running one; heroes are not doubled', () => {
    let s = act(prepared(), 'startEncounter', { id: 'rats', replace: true });
    expect(names(s).sort()).toEqual(['Paladin', 'Rat']);
    s = act(s, 'start');
    s = act(s, 'startEncounter', { id: 'gob', replace: true });
    expect(names(s).sort()).toEqual(['Goblin', 'Paladin', 'Rogue']);
    expect(s.turn).toBeNull();
  });

  it('turning the only fight off clears it, heroes too', () => {
    let s = act(prepared(), 'startEncounter', { id: 'gob', replace: true });
    s = act(s, 'stopEncounter', { id: 'gob' });
    expect(s.combatants).toEqual([]);
    expect(s.round).toBe(0);
  });

  it('with two fights running, one turned off leaves the other', () => {
    let s = act(prepared(), 'startEncounter', { id: 'rats' });
    s = act(s, 'startEncounter', { id: 'gob' });
    s = act(s, 'stopEncounter', { id: 'rats' });
    expect(names(s).sort()).toEqual(['Goblin', 'Paladin', 'Rogue']);
  });
});

describe('clearing the fight', () => {
  it('everyone leaves, heroes too', () => {
    let s = fight([{ name: 'Paladin', side: 'party', init: 12 }, { name: 'Rat', init: 5 }]);
    s = act(s, 'start');
    s = act(s, 'clearFight');
    expect(s.combatants).toEqual([]);
    expect([s.turn, s.round]).toEqual([null, 0]);
  });
});
