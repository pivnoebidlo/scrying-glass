// System packs (shared/syspack.ts): checking a pack from a stranger, formulas over a card's fields, the rolls.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blankStats, evalFormula, fieldMap, formulaProblems, slotGroups, packCombat, packSubtitle, parseFormula, pushPool, rollPack, validatePack, type RollWords, type SystemPack } from '../src/shared/syspack';

const words: RollWords = { success: 'Success', failure: 'Failure', successes: (n) => `${n} successes`, critical: 'Critical' };
// Dice that fall as told, in order.
const fixed = (...faces: number[]) => {
  let i = 0;
  return () => faces[i++ % faces.length]!;
};

const raw = {
  scryingGlass: 'system',
  version: 1,
  id: 'test-sys',
  title: { en: 'Test', ru: 'Тест' },
  subtitle: '{role} · {tier}',
  sections: [
    {
      id: 'main',
      title: 'Main',
      fields: [
        { key: 'role', type: 'text', title: 'Role' },
        { key: 'tier', type: 'select', title: 'Tier', options: ['Minion', { en: 'Boss', ru: 'Босс' }] },
        { key: 'str', type: 'number', title: 'STR', min: 1, roll: { type: 'd20', bonus: 'floor((str - 10) / 2)' } },
        { key: 'mod', type: 'formula', title: 'Mod', formula: 'floor((str - 10) / 2)' },
        { key: 'agility', type: 'dots', title: 'Agility', max: 5, roll: { type: 'pool', sides: 6, count: 'agility + gear', success: 6, push: true } },
        { key: 'gear', type: 'number', title: 'Gear' },
        { key: 'stress', type: 'track', title: 'Stress', boxes: 'agility' },
        { key: 'hp', type: 'number', title: 'HP' },
        { key: 'skills', type: 'list', title: 'Skills', columns: [{ key: 'name', type: 'text', title: 'Skill' }, { key: 'level', type: 'number', title: 'Level' }], roll: { type: 'under', sides: 100, target: 'row.level', levels: [{ title: 'Hard', divide: 2 }, { title: 'Extreme', divide: 5 }] } },
      ],
    },
    { id: 'gm', title: 'GM', kinds: ['monster'], fields: [{ key: 'notes', type: 'textarea', title: 'Notes', bogus: 1 }] },
  ],
  tracker: { init: { type: 'roll', dice: '1d20', bonus: 'mod' }, hp: 'hp', cells: ['stress', 'gear', 'nope'], conditions: { list: ['Broken'], free: true } },
  evil: 'function(){}',
};

describe('system packs', () => {
  it('takes a good pack and only what it knows', () => {
    const p = validatePack(raw) as SystemPack;
    expect(typeof p).toBe('object');
    expect(p).not.toHaveProperty('evil');
    expect(p.sections[1]!.fields[0]).not.toHaveProperty('bogus');
    expect(p.tracker.cells).toEqual(['stress', 'gear']);
    expect(p.tracker.init).toEqual({ type: 'roll', dice: '1d20', bonus: 'mod' });
  });

  it('keeps what the system gives (about) — the sample packs have it', () => {
    expect((validatePack({ ...raw, about: { en: 'Dice', ru: 'Кубы' } }) as SystemPack).about).toEqual({ en: 'Dice', ru: 'Кубы' });
    for (const id of ['fate-core', 'mausritter', 'fitd']) {
      const pack = validatePack(JSON.parse(fs.readFileSync(path.join('samples/systems', `${id}.json`), 'utf8'))) as SystemPack;
      expect(pack.about).toHaveProperty('ru');
    }
  });

  it('refuses broken packs', () => {
    expect(validatePack({ ...raw, scryingGlass: 'adventure' })).toBe('not-a-pack');
    expect(validatePack({ ...raw, id: 'Bad Id' })).toBe('id');
    const dup = { ...raw, sections: [raw.sections[0], { id: 'b', title: 'B', fields: [{ key: 'str', type: 'number', title: 'x' }] }] };
    expect(validatePack(dup)).toBe('duplicate:str');
    const code = { ...raw, sections: [{ id: 'a', title: 'A', fields: [{ key: 'x', type: 'formula', title: 'X', formula: 'process.exit()' }] }] };
    expect(validatePack(code)).toBe('field:x');
  });

  it('formulas: arithmetic, functions, fields of every kind, rows', () => {
    const p = validatePack(raw) as SystemPack;
    const stats = { str: 15, tier: 1, agility: 3, gear: 2, stress: 2 };
    expect(evalFormula(p, stats, 'floor((str - 10) / 2)')).toBe(2);
    expect(evalFormula(p, stats, 'mod * 2 + max(1, agility, 7) - -1')).toBe(12);
    expect(evalFormula(p, stats, 'tier')).toBe(2);
    expect(evalFormula(p, stats, 'stress')).toBe(2);
    expect(evalFormula(p, stats, 'row.level / 2', { level: 60 })).toBe(30);
    expect(evalFormula(p, stats, 'unknown + 1')).toBe(1);
    expect(parseFormula('alert(1)')).toBeNull();
    expect(parseFormula('1 +')).toBeNull();
    expect(parseFormula('this.constructor')).toBeNull();
  });

  it('finds formulas that name unknown fields or do not parse', () => {
    const p = validatePack(raw) as SystemPack;
    expect(formulaProblems(p)).toEqual([]);
    const bad = { ...p, rank: 'strength + 1', sections: [{ ...p.sections[0]!, fields: [...p.sections[0]!.fields, { key: 'broken', type: 'formula' as const, title: 'B', formula: '1 +' }] }] };
    expect(formulaProblems(bad)).toEqual([
      { where: 'rank', text: 'strength + 1', unknown: ['strength'], broken: false },
      { where: 'broken', text: '1 +', unknown: [], broken: true },
    ]);
  });

  it('cards: blank stats, the subtitle, what the tracker takes', () => {
    const p = validatePack(raw) as SystemPack;
    expect(blankStats(p, 'character')).toEqual({ str: 1, agility: 0, gear: 0, stress: 0, hp: 0, skills: [] });
    expect(blankStats(p, 'monster')).toHaveProperty('str');
    expect(packSubtitle(p, { role: 'Pilot', tier: 1 }, 'ru')).toBe('Pilot · Босс');
    expect(packSubtitle(p, { tier: 0 }, 'en')).toBe('Minion');
    expect(packCombat(p, { str: 14, agility: 4, gear: 1, hp: 9 })).toEqual({ hp: 9, ac: null, initiative: 2, stress: [{ id: 'stress', boxes: 4 }], attrs: [{ id: 'gear', value: 1 }] });
  });

  it('rolls: d20, under with levels, bands, pools with push, fate, sums, exploding dice', () => {
    const p = validatePack(raw) as SystemPack;
    const v = (stats: Record<string, unknown>, row?: Record<string, unknown>) => (f: string) => evalFormula(p, stats, f, row);
    expect(rollPack({ type: 'd20', bonus: 'mod' }, v({ str: 16 }), 'en', words, fixed(12))).toMatchObject({ total: 15, tone: 'none' });
    expect(rollPack({ type: 'd20', bonus: '0' }, v({}), 'en', words, fixed(3, 20), 'advantage')).toMatchObject({ total: 20, outcome: 'Critical' });

    const under = p.sections[0]!.fields.find((f) => f.key === 'skills')!.roll!;
    expect(rollPack(under, v({}, { level: 60 }), 'en', words, fixed(11))).toMatchObject({ outcome: 'Extreme', tone: 'good' });
    expect(rollPack(under, v({}, { level: 60 }), 'en', words, fixed(25))).toMatchObject({ outcome: 'Hard' });
    expect(rollPack(under, v({}, { level: 60 }), 'en', words, fixed(55))).toMatchObject({ outcome: 'Success' });
    expect(rollPack(under, v({}, { level: 60 }), 'en', words, fixed(70))).toMatchObject({ outcome: 'Failure', tone: 'bad' });

    const pbta = { type: 'bands' as const, dice: '2d6', bonus: '1', bands: [{ min: 10, title: 'Strong hit' }, { min: 7, title: 'Weak hit' }, { min: -99, title: 'Miss' }] };
    expect(rollPack(pbta, v({}), 'en', words, fixed(4, 4))).toMatchObject({ total: 9, outcome: 'Weak hit', tone: 'partial' });
    expect(rollPack(pbta, v({}), 'en', words, fixed(6, 6))).toMatchObject({ outcome: 'Strong hit', tone: 'good' });
    expect(rollPack(pbta, v({}), 'en', words, fixed(1, 2))).toMatchObject({ outcome: 'Miss', tone: 'bad' });

    const pool = p.sections[0]!.fields.find((f) => f.key === 'agility')!.roll!;
    const r = rollPack(pool, v({ agility: 3, gear: 1 }), 'en', words, fixed(6, 2, 3, 1));
    expect(r).toMatchObject({ total: 1, outcome: '1 successes', push: { dice: [6, 2, 3, 1] } });
    const pushed = pushPool(r.push!, words, fixed(6, 6, 4));
    expect(pushed).toMatchObject({ total: 3, dice: [[6], [6, 6, 4]] });

    const fitd = { type: 'pool' as const, sides: 6, count: '0', best: true };
    expect(rollPack(fitd, v({}), 'en', words, fixed(6, 2))).toMatchObject({ total: 2, tone: 'bad' });
    expect(rollPack({ ...fitd, count: '2' }, v({}), 'en', words, fixed(6, 6))).toMatchObject({ total: 6, outcome: 'Critical' });

    expect(rollPack({ type: 'fate', bonus: '2' }, v({}), 'en', words, fixed(3, 3, 1, 2))).toMatchObject({ total: 3, dice: [[1, 1, -1, 0]] });
    expect(rollPack({ type: 'sum', dice: '2d6+1', bonus: 'gear' }, v({ gear: 2 }), 'en', words, fixed(3, 4))).toMatchObject({ total: 10 });
    // A d6 that aces twice, against a wild d6 of 4.
    expect(rollPack({ type: 'explode', sides: '6', wild: 6 }, v({}), 'en', words, fixed(6, 6, 2, 4))).toMatchObject({ total: 14, dice: [[6, 6, 2], [4]] });
  });
});

describe('Year Zero, degrees of success, valued conditions', () => {
  const yzWords: RollWords = { ...words, bane: (k, n) => `${n} ${k}`, panic: 'Panic' };
  const v = () => (f: string) => Number(f) || (f === 'str' ? 3 : f === 'skill' ? 2 : f === 'gear' ? 1 : 0);
  const spec = {
    type: 'pool' as const, sides: 6, count: 'str', success: 6, push: true, kind: 'base' as const, pushStress: true,
    groups: [{ kind: 'skill' as const, count: 'skill' }, { kind: 'gear' as const, count: 'gear' }],
  };

  it('a pack keeps what it knows of the new rolls and the tracker', () => {
    const p = validatePack({
      ...raw,
      sections: [{ id: 'm', title: 'M', fields: [
        { key: 'str', type: 'number', title: 'Str', roll: { ...spec, groups: [...spec.groups, { kind: 'artifact', count: '1', sides: 10 }, { kind: 'evil', count: '1' }], ask: true } },
        { key: 'skill', type: 'number', title: 'Skill', roll: { type: 'd20', bonus: 'skill', degrees: 'four' } },
        { key: 'gear', type: 'number', title: 'Gear' },
      ] }],
      tracker: { init: { type: 'none' }, conditions: { list: ['Frightened', 'Prone'], valued: ['Frightened'] } },
    }) as SystemPack;
    const roll = p.sections[0]!.fields[0]!.roll!;
    expect(roll).toMatchObject({ kind: 'base', pushStress: true, ask: true });
    expect(roll.type === 'pool' && roll.groups).toEqual([{ kind: 'skill', count: 'skill' }, { kind: 'gear', count: 'gear' }, { kind: 'artifact', count: '1', sides: 10 }]);
    expect(p.sections[0]!.fields[1]!.roll).toMatchObject({ degrees: 'four' });
    expect(p.tracker.conditions?.valued).toEqual(['Frightened']);
  });

  it('dice by kind: successes, banes on the attribute and the gear, a push keeps them and adds a stress die', () => {
    // base 3: 6 1 3; skill 2: 1 5; gear 1: 1
    const r = rollPack(spec, v(), 'en', yzWords, fixed(6, 1, 3, 1, 5, 1));
    expect(r).toMatchObject({ total: 1, outcome: '1 successes · 1 base · 1 gear', tone: 'good', dice: [[6, 1, 3], [1, 5], [1]] });
    // The push: 6 and the banes stay; 3, the skill 1 and 5 roll again; a stress die is added.
    const pushed = pushPool(r.push!, yzWords, fixed(6, 2, 4, 1));
    expect(pushed.dice).toEqual([[6, 1, 6], [2, 4], [1], [1]]);
    expect(pushed).toMatchObject({ total: 2, tone: 'bad' });
    expect(pushed.outcome).toContain('Panic');
  });

  it('artifact dice give more successes on high faces', () => {
    const art = { type: 'pool' as const, sides: 6, count: '0', success: 6, kind: 'base' as const, groups: [{ kind: 'artifact' as const, count: '3', sides: 12 }] };
    expect(rollPack(art, v(), 'en', yzWords, fixed(12, 9, 5)).total).toBe(4 + 2);
  });

  it('a d20 roll with degrees is ready to be judged against a DC', () => {
    expect(rollPack({ type: 'd20', bonus: '5', degrees: 'four' }, v(), 'en', words, fixed(14))).toMatchObject({ total: 19, dc: { natural: 14, degrees: 'four' } });
    expect(rollPack({ type: 'd20', bonus: '5' }, v(), 'en', words, fixed(14))).not.toHaveProperty('dc');
  });
});

describe('format extensions for Fate and Mausritter', () => {
  const pack = validatePack({
    scryingGlass: 'system',
    version: 1,
    id: 'ext-test',
    title: 'Ext',
    sections: [
      {
        id: 'main',
        title: 'Main',
        fields: [
          { key: 'fight', type: 'number', title: 'Fight', hideZero: true, roll: { type: 'fate', bonus: 'fight', labels: [{ min: 1, title: 'Average' }, { min: 3, title: 'Good' }, { min: -99, title: 'Mediocre' }] } },
          { key: 'str', type: 'number', title: 'STR', roll: { type: 'under', sides: 20, target: 'str' } },
          { key: 'attacks', type: 'list', title: 'Attacks', columns: [{ key: 'name', type: 'text', title: 'Name' }, { key: 'dice', type: 'dice', title: 'Dice' }], roll: { type: 'sum', dice: 'row.dice' } },
          { key: 'inventory', type: 'slots', title: 'Inventory', slots: [{ title: 'Paws', count: 2 }, { title: 'Pack', count: 6 }] },
          { key: 'mild', type: 'text', title: 'Mild' },
        ],
      },
    ],
    tracker: { init: { type: 'value', value: 'fight' }, cells: ['mild', 'str'] },
  }) as SystemPack;

  it('takes the new parts', () => {
    expect(typeof pack).toBe('object');
    const f = fieldMap(pack);
    expect(f.get('fight')).toMatchObject({ hideZero: true, roll: { labels: [{ min: 3 }, { min: 1 }, { min: -99 }] } });
    expect(f.get('inventory')?.slots).toEqual([{ title: 'Paws', count: 2 }, { title: 'Pack', count: 6 }]);
    expect(f.get('attacks')?.roll).toEqual({ type: 'sum', dice: 'row.dice' });
    expect(blankStats(pack, 'character')).toMatchObject({ inventory: [] });
  });

  it('names a total, rolls under with advantage, takes dice from a row', () => {
    const v = (stats: Record<string, unknown>) => (f: string) => evalFormula(pack, stats, f);
    const fate = fieldMap(pack).get('fight')!.roll!;
    expect(rollPack(fate, v({ fight: 2 }), 'en', words, fixed(3, 2, 2, 2))).toMatchObject({ total: 3, outcome: 'Good' });
    expect(rollPack(fate, v({ fight: 0 }), 'en', words, fixed(1, 1, 2, 2))).toMatchObject({ total: -2, outcome: 'Mediocre' });
    const save = fieldMap(pack).get('str')!.roll!;
    expect(rollPack(save, v({ str: 9 }), 'en', words, fixed(15, 4), 'advantage')).toMatchObject({ total: 4, tone: 'good' });
    expect(rollPack(save, v({ str: 9 }), 'en', words, fixed(15, 4), 'disadvantage')).toMatchObject({ total: 15, tone: 'bad' });
    const hit = fieldMap(pack).get('attacks')!.roll!;
    expect(rollPack(hit, v({}), 'en', words, fixed(7), 'normal', { name: 'Needle', dice: 'd6/d8' })).toMatchObject({ total: 7, note: '1d6' });
    expect(rollPack(hit, v({}), 'en', words, fixed(3, 4), 'normal', { name: 'Claws', dice: '2d4' })).toMatchObject({ total: 7 });
  });

  it('slots: cells by group with their places; text cells stay out of the numbers', () => {
    const groups = slotGroups(fieldMap(pack).get('inventory')!, [{ name: 'Sword' }, { name: '' }, { name: 'Torch', usage: 2 }]);
    expect(groups.map((g) => g.cells.length)).toEqual([2, 6]);
    expect(groups[1]!.cells[0]).toEqual({ i: 2, slot: { name: 'Torch', usage: 2 } });
    expect(packCombat(pack, { fight: 2, str: 9, mild: 'Bruised' })).toMatchObject({ initiative: 2, attrs: [{ id: 'str', value: 9 }] });
  });
});

describe('sample system packs', () => {
  const dir = path.join(__dirname, '../samples/systems');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

  it.each(files)('%s is a valid pack whose formulas name its own fields', (file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const p = validatePack(raw);
    expect(typeof p === 'string' ? p : 'ok').toBe('ok');
    const pack = p as SystemPack;
    const keys = fieldMap(pack);
    expect(pack.id).toBe(file.replace(/\.json$/, ''));
    // Nothing the file has was dropped by the check (same number of fields).
    expect(keys.size).toBe(raw.sections.reduce((n: number, s: { fields: unknown[] }) => n + s.fields.length, 0));
    expect(formulaProblems(pack)).toEqual([]);
    for (const k of [pack.tracker.hp, ...(pack.tracker.cells ?? [])]) if (k) expect(keys.has(k), k).toBe(true);
  });
});
