import { afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import crew from '../src/modules/crew/main';
import { blankCrew, develop, entanglementsFor, ENTANGLEMENTS, heatFor, repFor, repNeeded, withHeat, withRep, type CrewState } from '../src/modules/crew/types';
import { poolOutcome } from '../src/shared/dice';
import type { BuiltinBook } from '../src/shared/compendium';
import { setLang, t } from '../src/shared/i18n';
import { ctx, run } from './helpers';

const act = (s: CrewState, a: string, p?: unknown) => run(crew, s, a, p);
const S0 = crew.initialState;

describe('Forged in the Dark: the crew rules', () => {
  it('heat over 9 becomes a wanted level and rolls over; lowering heat never lowers wanted', () => {
    const c = { ...blankCrew(), heat: 7 };
    expect(withHeat(c, 4)).toMatchObject({ heat: 2, wanted: 1 });
    expect(withHeat({ ...c, wanted: 4 }, 20)).toMatchObject({ wanted: 4 });
    expect(withHeat({ ...c, wanted: 2 }, -10)).toMatchObject({ heat: 0, wanted: 2 });
  });
  it('rep fills 12 minus turf; developing: weak hold → strong, strong hold → the next tier for coin', () => {
    const c = { ...blankCrew(), turf: 2 };
    expect(repNeeded(c)).toBe(10);
    expect(withRep(c, 30).rep).toBe(10);
    expect(develop({ ...c, rep: 9 })).toBeNull();
    expect(develop({ ...c, rep: 10, hold: 'weak' })).toMatchObject({ hold: 'strong', rep: 0, tier: 0 });
    expect(develop({ ...c, rep: 10, coin: 7 })).toBeNull();
    expect(develop({ ...c, rep: 10, coin: 9 })).toMatchObject({ tier: 1, hold: 'weak', rep: 0, coin: 1, turf: 2 });
    expect(develop({ ...c, tier: 2, rep: 10, coin: 30 })).toMatchObject({ tier: 3, coin: 6 });
  });
  it('payoff rep by the target tier; heat by exposure and circumstances', () => {
    expect(repFor(1, 3)).toBe(4);
    expect(repFor(3, 1)).toBe(0);
    expect(heatFor({ exposure: 4, profile: true, killing: true })).toBe(7);
  });
  it('entanglements by the heat column and the result', () => {
    expect(entanglementsFor(2, 1)).toEqual(['gangTrouble', 'usualSuspects']);
    expect(entanglementsFor(5, 6)).toEqual(['showOfForce']);
    expect(entanglementsFor(8, 4)).toEqual(['demonicNotice', 'showOfForce']);
  });
});

describe('Forged in the Dark: the crew module', () => {
  it('belongs to its adventure; numbers stay in range', () => {
    let s = act(S0, 'update', { adventure: 'Heist', changes: { name: 'The Lampblacks', tier: 9, turf: 3, rep: 12, upgrades: [' Vault ', '', 'Quarters'] } });
    expect(s.byAdventure['Heist']).toMatchObject({ name: 'The Lampblacks', tier: 6, turf: 3, rep: 9, upgrades: ['Vault', 'Quarters'] });
    expect(s.byAdventure['']).toBeUndefined();
    s = act(s, 'heat', { adventure: 'Heist', delta: 10 });
    expect(s.byAdventure['Heist']).toMatchObject({ heat: 1, wanted: 1 });
  });
  it('payoff adds rep, coin and heat at once', () => {
    const s = act(S0, 'payoff', { adventure: null, rep: 4, coin: 6, heat: 5 });
    expect(s.byAdventure['']).toMatchObject({ rep: 4, coin: 8, heat: 5 });
  });
  it('an entanglement roll: wanted dice, the heat column', () => {
    let s = act(S0, 'update', { adventure: null, changes: { heat: 6, wanted: 0 } });
    const pool = (n: number) => ({ dice: [6, 2], zero: n === 0, ...poolOutcome([6, 2], n === 0) });
    s = crew.actions.entanglement(s, { adventure: null }, ctx(), pool);
    expect(s.byAdventure['']!.last).toMatchObject({ heat: 6, options: ['flipped', 'interrogation'] });
  });
  it('cohorts and factions', () => {
    let s = act(S0, 'addCohort', { adventure: null, kind: 'gang' });
    const id = s.byAdventure['']!.cohorts[0]!.id;
    s = act(s, 'updateCohort', { adventure: null, id, changes: { type: 'Thugs', harm: 9 } });
    expect(s.byAdventure['']!.cohorts[0]).toMatchObject({ type: 'Thugs', harm: 4 });
    s = act(s, 'addFaction', { adventure: null, name: 'The Red Hand', status: -3 });
    expect(s.byAdventure['']!.factions[0]).toMatchObject({ name: 'The Red Hand', tier: 1, status: -3 });
  });
});

describe('Forged in the Dark: entanglements are entries of the compendium', () => {
  afterAll(() => setLang('en'));
  it('every entanglement name is an alias of «Entanglements»', () => {
    for (const lang of ['en', 'ru'] as const) {
      setLang(lang);
      const book = JSON.parse(readFileSync(new URL(`../resources/compendium/fitd.${lang}.json`, import.meta.url), 'utf8')) as BuiltinBook;
      const entry = book.entries.find((e) => e.title === t('crew.repEntry'));
      expect(entry, lang).toBeDefined();
      const aliases = book.entries.find((e) => (e.en ?? e.title) === 'Entanglements')!.fields['aliases'] as string[];
      for (const id of ENTANGLEMENTS) expect(aliases, `${lang} ${id}`).toContain(t(`crew.ent.${id}`));
    }
  });
});
