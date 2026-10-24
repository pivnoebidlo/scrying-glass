// System packs (shared/syspack.ts): checking a pack from a stranger, formulas over a card's fields, the rolls.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blankStats, evalFormula, fieldMap, parseFormula as parse, packCombat, packSubtitle, parseFormula, pushPool, rollPack, validatePack, type RollWords, type SystemPack } from '../src/shared/syspack';

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

describe('built-in system packs', () => {
  const dir = path.join(__dirname, '../resources/systems');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  // The names a formula uses (row.* — a list row's columns).
  const names = (text: string): string[] => (text.match(/row\.[a-z_][a-z0-9_]*|[a-z_][a-z0-9_]*/gi) ?? []).filter((w) => !['floor', 'ceil', 'round', 'abs', 'min', 'max'].includes(w));

  it.each(files)('%s is a valid pack whose formulas name its own fields', (file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const p = validatePack(raw);
    expect(typeof p === 'string' ? p : 'ok').toBe('ok');
    const pack = p as SystemPack;
    const keys = fieldMap(pack);
    expect(pack.id).toBe(file.replace(/\.json$/, ''));
    // Nothing the file has was dropped by the check (same number of fields).
    expect(keys.size).toBe(raw.sections.reduce((n: number, s: { fields: unknown[] }) => n + s.fields.length, 0));
    const formulas: { text: string; row?: string[] }[] = [];
    if (pack.rank) formulas.push({ text: pack.rank });
    for (const f of keys.values()) {
      if (f.formula) formulas.push({ text: f.formula });
      if (typeof f.boxes === 'string') formulas.push({ text: f.boxes });
      const r = f.roll as Record<string, unknown> | undefined;
      const cols = f.columns?.map((c) => c.key);
      for (const k of ['bonus', 'target', 'count', 'sides']) if (typeof r?.[k] === 'string') formulas.push({ text: r[k] as string, row: cols });
    }
    if (pack.tracker.init.type === 'value') formulas.push({ text: pack.tracker.init.value });
    for (const { text, row } of formulas) {
      expect(parse(text), text).not.toBeNull();
      for (const n of names(text)) {
        if (n.startsWith('row.')) expect(row, text).toContain(n.slice(4));
        else expect(keys.has(n), `${text}: ${n}`).toBe(true);
      }
    }
    for (const k of [pack.tracker.hp, ...(pack.tracker.cells ?? [])]) if (k) expect(keys.has(k), k).toBe(true);
  });
});
