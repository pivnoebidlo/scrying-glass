import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validatePack, type SystemPack } from '../src/shared/syspack';
import { calcValue, diceOfRows, genCardOf, genText, lineWords, packFile, priceItems, priceOfItem, rangeOf, runCalculator, resultMarkdown, rollWords, runGenerator, validateGenerators, kindsOfText, priceRowsOfText, rowsOfText, simpleStep, textOfKinds, textOfPriceRows, unitOf, unitText, stepOf, textOfRows, linkCard, numberOf, numberStep, whenFormula, whenOf, type Generator, type NumberStep, type SimpleStep, type GeneratorFile, type GenLine, type GenOptions } from '../src/shared/generators';

const file = validateGenerators(JSON.parse(readFileSync('content/mausritter/generators/mausritter.json', 'utf8'))) as GeneratorFile;
// Rolls in a fixed order (then 1 forever).
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++] ?? 1;
};
const run = (id: string, roll: (sides: number) => number, opts: GenOptions = {}) => runGenerator(file, id, opts, roll);
const label = (l: GenLine) => genText(l.label, 'en', l.params);
const labels = (lines: GenLine[]) => lines.map(label);
const lucky = (seed: number) => (sides: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), (seed % sides) + 1);

describe('generators', () => {
  it('the file of the package is valid, and every generator runs in both languages', () => {
    expect(typeof file).toBe('object');
    for (const g of file.generators) {
      for (let s = 1; s <= 60; s++) {
        const r = run(g.id, lucky(s), { rooms: 8, former: true, magical: true, season: ['Spring', 'Summer', 'Autumn', 'Winter'][s % 4]!, hireling: s % 5, paid: s % 2 === 0, wil: 9 });
        expect(r.lines.length).toBeGreaterThan(0);
        const walk = (l: GenLine) => {
          for (const lang of ['en', 'ru'] as const) {
            if (l.cells.length) expect(lineWords(file, l, lang), `${g.id}: ${label(l)}`).not.toBe('');
          }
          l.sub?.forEach(walk);
        };
        r.lines.forEach(walk);
        for (const lang of ['en', 'ru'] as const) expect(resultMarkdown(file, r, lang)).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it('the tables have the same rows in both languages', () => {
    for (const id of Object.keys(file.tables['en']!)) expect(file.tables['ru']![id]!.rows.length, id).toBe(file.tables['en']![id]!.rows.length);
  });

  it('a stranger\'s file: only known steps, no code', () => {
    expect(validateGenerators({ scryingGlass: 'other' })).toBe('not-generators');
    const bad = (steps: unknown[]) => ({ scryingGlass: 'generators', version: 1, system: 'x', tables: {}, generators: [{ id: 'a', title: 'A', steps }] });
    expect(validateGenerators(bad([{ eval: 'process.exit()' }]))).toBe('steps:a');
    expect(validateGenerators(bad([{ let: 'x', formula: 'process.exit()' }]))).toBe('steps:a');
    expect(typeof validateGenerators(bad([{ let: 'x', formula: 'd(6) + 1' }]))).toBe('object');
  });

  it('endless nesting is cut by the budget and the depth', () => {
    let deep: unknown = { let: 'x', formula: '1' };
    for (let i = 0; i < 20; i++) deep = { repeat: '40', steps: [deep] };
    expect(typeof validateGenerators({ scryingGlass: 'generators', version: 1, system: 'x', tables: {}, generators: [{ id: 'a', title: 'A', steps: [deep] }] })).toBe('string');
  });

  it('ranges', () => {
    expect([rangeOf('3-5'), rangeOf('3–5'), rangeOf('5+'), rangeOf('11'), rangeOf('')]).toEqual([[3, 5], [3, 5], [5, Infinity], [11, 11], null]);
    expect(rollWords('2d6↓: 3, 5 → 3, d20: 7', 'ru')).toBe('2к6↓: 3, 5 → 3, к20: 7');
  });
});

describe('Mausritter tables as data', () => {
  it('settlement: size is the lower of 2d6; cities get two features, towns two trades; hamlets and up — a tavern', () => {
    const city = run('settlement', seq(6, 6));
    expect(city.lines[0]!.cells[0]!.row).toBe(5);
    expect(city.lines[0]!.roll).toBe('2d6↓: 6, 6 → 6');
    expect(labels(city.lines).filter((l) => l === 'Notable feature')).toHaveLength(2);
    expect(labels(city.lines).filter((l) => l === 'Industry')).toHaveLength(2);
    expect(labels(city.lines)).toContain('Tavern');
    const farm = run('settlement', seq(1, 6));
    expect(labels(farm.lines).filter((l) => l === 'Notable feature')).toHaveLength(1);
    expect(labels(farm.lines)).not.toContain('Tavern');
  });

  it('hex: the landmark column follows the hex type; landmark details by d6 and d8', () => {
    const river = run('hex', seq(5, 3));
    expect(river.lines[1]!.cells[0]!.col).toBe(3);
    expect(lineWords(file, river.lines[1]!, 'en')).toBe('Draping willow');
    const detail = (a: number, b: number) => run('hex', seq(1, 1, a, b)).lines[2]!.cells[0]!.row;
    expect(detail(1, 7)).toBe(0);
    expect(detail(2, 1)).toBe(1);
    expect(detail(6, 8)).toBe(40);
  });

  it('rooms: a lair (d6 6) with a creature on 1–5 and treasure on 1–4', () => {
    const start = [1, 1, 1, 1, 1];
    const lair = run('site', seq(...start, 6, 5, 4, 2), { rooms: 1 }).lines[5]!;
    expect(genText(lair.notes![0]!.text, 'en')).toBe('a creature and treasure');
    expect(label(lair)).toBe('Room 1');
    const empty = run('site', seq(...start, 1, 4, 2, 1), { rooms: 1 }).lines[5]!;
    expect(genText(empty.notes![0]!.text, 'en')).toBe('no creature, no treasure');
  });

  it('treasure: two d20 and one more per «yes»; a magic sword may be cursed; pips are counted', () => {
    expect(run('treasure', lucky(3), { former: true, guarded: true }).lines).toHaveLength(4);
    // d20 1 — a sword: cursed (d6 1), class d6 2, sword d10 3, curse d6 4.
    const sword = run('treasure', seq(1, 1, 2, 3, 4)).lines[0]!;
    expect(genText(sword.notes![0]!.text, 'en')).toBe('cursed');
    expect(lineWords(file, sword.sub![1]!, 'en')).toBe('Rusty nail — Critical damage: Give a Frightened Condition');
    const box = run('treasure', seq(11, 3, 20, 1));
    expect(genText(box.lines[0]!.notes![0]!.text, 'en', box.lines[0]!.params)).toBe('300 pips');
    expect(genText(box.footer, 'ru', box.params)).toContain('всего');
  });

  it('weather: bold weather is poor for travel; the table follows the season', () => {
    const r = run('weather', seq(1, 1, 3), { season: 'Winter' });
    expect(r.lines[0]!.cells[0]!.table).toBe('weatherWinter');
    expect(r.lines[0]!.notes?.[0]?.warn).toBe(true);
  });

  it('hirelings: a failed WIL save — nobody; paid — Number of them with SRD numbers and a card', () => {
    const none = run('hirelings', seq(20), { wil: 9, hireling: 0 });
    expect(none.lines).toHaveLength(1);
    expect(none.lines[0]!.notes![0]!.warn).toBe(true);
    // Torchbearer: d6 → 2; each: name, HP, STR 2d6, DEX 2d6, WIL 2d6.
    const paid = run('hirelings', seq(2, 1, 3, 1, 1, 2, 2, 3, 3), { paid: true, hireling: 0 });
    expect(paid.lines).toHaveLength(3);
    const h = paid.lines[1]!;
    expect(lineWords(file, h, 'en')).toBe('Bramble (torchbearer) — HP 3, STR 2, DEX 4, WIL 6');
    expect(h.card?.kind).toBe('npc');
    expect(h.card?.stats).toMatchObject({ armour: 0, hp: expect.any(Number), wil: expect.any(Number) });
    expect(lineWords(file, h, 'ru')).toContain('ВОЛ');
  });
});

describe('a new mouse as data', () => {
  // STR, DEX, WIL (3d6), then name first: name, three times 3d6, HP, pips, the weapon, then a sign, coat, detail.
  const name = 1;
  const mouse = (hp: number, pips: number, weapon: number, attrs: number[][], rest: number[] = []) => run('mouse', seq(name, ...attrs.flat(), hp, pips, weapon, ...rest));
  const strong = [[6, 5, 1], [6, 6, 1], [5, 5, 1]];
  const card = (r: ReturnType<typeof run>, lang: 'en' | 'ru') => genCardOf(file, r.card!, lang);

  it('attributes: 3d6, the two highest; HP and pips pick the background', () => {
    const r = mouse(3, 4, 1, [[6, 5, 1], [2, 2, 2], [6, 6, 6]]);
    expect(r.card!.stats).toMatchObject({ str: 11, dex: 4, wil: 12, hp: 3, pips: 4 });
    expect(r.lines.find((l) => label(l) === 'STR')!.roll).toBe('3d6↑: 6, 5, 1 → 11');
    expect(r.card!.text!['background']!.cells[0]!.row).toBe(15);
  });

  it('the card: heavy armour on the body, the background spell in the pack, a sheet the app reads', () => {
    // Test subject: Spell: Magic missile, Lead coat (Heavy armour); a sword (the fourth) in the main paw.
    const c = card(mouse(1, 1, 4, strong), 'en');
    expect(c.stats).toMatchObject({ armour: 1, level: 1, background: 'Test subject' });
    const slots = c.stats['inventory'] as { name: string; usage?: number }[];
    expect(slots).toHaveLength(10);
    expect(slots.slice(0, 4).map((x) => x.name)).toEqual(['Sword (d6/d8)', '', 'Lead coat (Heavy armour)', 'Lead coat (Heavy armour)']);
    expect(slots.slice(4).map((x) => x.name).filter(Boolean)).toEqual(['Torches', 'Rations', 'Spell: Magic missile']);
    expect(slots[4]!.usage).toBe(0);
    expect(c.stats['attacks']).toEqual([{ dice: 'd6/d8', name: 'sword' }]);
  });

  it('a weak mouse: 9 or less — one item of another background, 7 or less — both', () => {
    const weak = [[1, 1, 1], [1, 1, 1], [4, 4, 1]];
    // Best 8: another background (8th, Beetleherd), the coin 1 — item A.
    const one = card(mouse(1, 6, 7, weak, [8, 1]), 'en');
    expect(one.notes).toBe('Hireling: Loyal beetle');
    const both = card(mouse(1, 6, 7, [[1, 1, 1], [1, 1, 1], [3, 3, 1]], [8, 2]), 'en');
    expect(both.notes).toBe('Hireling: Loyal beetle');
    expect((both.stats['inventory'] as { name: string }[]).filter((x) => x.name).length).toBeGreaterThan((card(mouse(1, 6, 7, strong), 'en').stats['inventory'] as { name: string }[]).filter((x) => x.name).length);
  });

  it('a two-paw weapon fills both paws; a background weapon is an attack; words follow the language', () => {
    // Street tough (hp 1, pips 6): Dagger (Light, d6); a spear (the seventh).
    const r = mouse(1, 6, 7, strong);
    const ru = card(r, 'ru').stats['inventory'] as { name: string }[];
    expect([ru[0]!.name, ru[1]!.name]).toEqual(['Копьё (к10)', 'Копьё (к10)']);
    expect((card(r, 'en').stats['attacks'] as { dice: string }[]).map((a) => a.dice)).toEqual(['d10', 'd6']);
  });
});

describe('a price list as data', () => {
  const list = file.lists!.find((l) => l.id === 'shop')!;
  it('the same items in both languages, each with a price or its text', () => {
    const [en, ru] = [priceItems(file, list, 'en'), priceItems(file, list, 'ru')];
    expect(ru.map((i) => [i.section, i.price])).toEqual(en.map((i) => [i.section, i.price]));
    expect(en.filter((i) => i.price === null).map((i) => i.text)).toEqual(['x10p', '10%']);
  });

  it('a warband pays 20 times as much for equipment, not for food or help', () => {
    const en = priceItems(file, list, 'en');
    const sword = en.find((i) => i.name.startsWith('**Medium**'))!;
    const meal = en.find((i) => i.name === '**Meal**')!;
    expect([priceOfItem(list, sword, {}), priceOfItem(list, sword, { warband: true })]).toEqual([20, 400]);
    expect(priceOfItem(list, meal, { warband: true })).toBe(2);
  });
});

describe('a calculator as data', () => {
  const c = file.calculators!.find((x) => x.id === 'build')!;
  const go = (rows: Parameters<typeof runCalculator>[1], diggers: number) => runCalculator(c, rows, { diggers });

  it('materials per cube, upkeep 1% a month', () => {
    const r = go([{ kind: 'tunnel', count: 4 }, { kind: 'standard', count: 2 }, { kind: 'grand', count: 1 }], 3);
    expect(r['materials']).toBe(40 + 1000 + 2000);
    expect(r['upkeep']).toBe(31);
    expect(calcValue(c, { kind: 'grand', count: 2.5 })).toBe(4000);
  });

  it('three diggers dig a cube of soil a day, other materials take twice as long; 5p a day each', () => {
    expect(go([{ kind: 'poor', count: 5 }], 3)).toMatchObject({ days: 5, wages: 75 });
    expect(go([{ kind: 'poor', count: 5, flag: true }], 3)).toMatchObject({ days: 10, wages: 150 });
    expect(go([{ kind: 'poor', count: 5 }], 6)).toMatchObject({ days: 3, wages: 90 });
    expect(go([{ kind: 'poor', count: 1 }], 1)).toMatchObject({ days: 3, wages: 15 });
    expect(go([{ kind: 'poor', count: 2 }], 0)).toMatchObject({ days: 0, wages: 0, total: 200 });
  });
});

describe('a system of one file brings its own generators', () => {
  const pack = (kit: unknown) => ({ scryingGlass: 'system', version: 1, id: 'super-rp', title: 'SuperRoleplay', tracker: {}, sections: [{ id: 'main', title: 'Main', fields: [{ key: 'hp', title: 'HP', type: 'number' }] }], kit });

  it('a table as the author writes it', () => {
    expect(rowsOfText('1-3 | A rat\n4–5 | A chest\n\n6+ | A secret')).toEqual([['1-3', 'A rat'], ['4–5', 'A chest'], ['6+', 'A secret']]);
    expect(rowsOfText('A rat\nA | chest')).toEqual([['A rat'], ['A | chest']]);
    expect(textOfRows(rowsOfText('1-3 | A rat\n4 | Two'))).toBe('1-3 | A rat\n4 | Two');
    expect(diceOfRows([['1-3', 'a'], ['4-6', 'b']])).toBe('d6');
    expect(diceOfRows([['1', 'a'], ['2+', 'b']])).toBe('d2');
    expect(diceOfRows([['a'], ['b']])).toBe('');
    expect(diceOfRows([])).toBe('');
  });

  it('what the builder makes runs, is kept by the pack, and reads back', () => {
    const steps = [stepOf({ label: 'Find', table: 'loot', dice: 'd6', times: 2 }), stepOf({ label: 'Who', table: 'who', dice: '', times: 1 })];
    const kit = { tables: { en: { loot: { head: ['Loot'], rows: [['1-3', 'A rat'], ['4-6', 'A chest']] }, who: { head: ['Who'], rows: [['Ann'], ['Bob']] } } }, generators: [{ id: 'g', title: 'Room', steps }] };
    const p = validatePack(pack(kit)) as SystemPack;
    expect(p.kit!.generators).toHaveLength(1);
    expect(p.kit!.generators[0]!.steps.map(simpleStep)).toEqual([{ label: 'Find', table: 'loot', dice: 'd6', times: 2 }, { label: 'Who', table: 'who', dice: '', times: 1 }]);
    const f = packFile(p.id, p.kit!);
    const r = runGenerator(f, 'g', {}, seq(5, 1, 2));
    expect(r.lines.map((l) => lineWords(f, l, 'ru'))).toEqual(['A chest', 'A rat', 'Bob']);
  });

  it('a recipe of a package stays as it is; a broken one is refused', () => {
    const complex = file.generators.find((g) => g.id === 'settlement')!;
    expect(complex.steps.filter((s) => !simpleStep(s)).length).toBeGreaterThan(0);
    const kept = validatePack(pack({ tables: file.tables, generators: [complex] })) as SystemPack;
    expect(kept.kit!.generators[0]).toEqual(complex);
    expect(validatePack(pack({ tables: {}, generators: [{ id: 'a', title: 'A', steps: [{ eval: 'x' }] }] }))).toBe('kit:steps:a');
  });

  it('a price list and a calculator as the author writes them', () => {
    const rows = priceRowsOfText('Rope | 40\nGold cup | 1 000\nRepair | 10%\nA gift', 'p');
    expect(rows).toEqual([['Rope', '40 p', '40'], ['Gold cup', '1000 p', '1000'], ['Repair', '10%', ''], ['A gift', '', '']]);
    expect(textOfPriceRows(rows)).toBe('Rope | 40\nGold cup | 1000\nRepair | 10%\nA gift | ');
    expect(unitOf(unitText(' p '), 'ru')).toBe('p');
    expect(unitOf(unitText(''), 'ru')).toBe('');
    const kinds = kindsOfText('Small | 100\nHuge | 1 000\nNothing');
    expect(kinds.map((k) => k.value)).toEqual([100, 1000, 0]);
    expect(textOfKinds(kinds, 'en')).toBe('Small | 100\nHuge | 1000\nNothing | 0');
    const calc = { id: 'c', title: 'C', unit: '{n}', labels: { name: '', kind: '', count: '', flag: '', flagHint: '', value: '', add: '', remove: '' }, kinds, row: { value: 'count * value' }, inputs: [{ key: 'men', title: 'Men', default: 2 }], totals: [{ key: 'pay', title: 'Pay', formula: 'value * men' }, { key: 'total', title: 'T', formula: 'pay + 1', strong: true }] };
    const p = validatePack(pack({ tables: {}, generators: [], calculators: [calc] })) as SystemPack;
    expect(runCalculator(p.kit!.calculators![0]!, [{ kind: 'k1', count: 3 }], { men: 2 })).toMatchObject({ value: 300, pay: 600, total: 601 });
  });

  it('no kit — no field', () => {
    expect(validatePack(pack(undefined))).not.toHaveProperty('kit');
  });
});

describe('a generator made of sentences', () => {
  const tablesEn = { en: { sizes: { head: ['Size'], rows: [['Farm'], ['Hamlet'], ['Town']] }, inns: { head: ['Inn'], rows: [['The Fox'], ['The Hen']] }, gear: { head: ['Gear'], rows: [['Rope'], ['Lamp']] } } };
  const f = (generators: unknown[]) => packFile('x', { tables: tablesEn, generators: generators as Generator[] });

  it('a condition, a count and a number read back as they were written', () => {
    const x: SimpleStep = { label: 'Inn', table: 'inns', dice: '', times: 1, when: { what: 'size', op: 'ge', value: 3 } };
    expect(simpleStep(stepOf(x))).toEqual(x);
    const y: SimpleStep = { label: 'Gear', table: 'gear', dice: 'd6', times: 2, when: { what: 'city', op: 'off' } };
    expect(simpleStep(stepOf(y))).toEqual(y);
    const z: SimpleStep = { label: 'Size', table: 'sizes', dice: '', by: 'size', byRow: true, times: 1, timesBy: 'many' };
    expect(simpleStep(stepOf(z))).toEqual(z);
    expect(whenOf('ge(size, 3)')).toEqual({ what: 'size', op: 'ge', value: 3 });
    expect(whenOf('size + 1 > 2')).toBeNull();
    expect(whenFormula({ what: 'city', op: 'on' })).toBe('city');
    const n: NumberStep = { key: 'size', dice: '2d6', keep: 'low', count: 1 };
    expect(numberOf(numberStep(n))).toEqual(n);
    expect(numberOf(numberStep({ key: 'best', formula: 'max(a, b)' }))).toEqual({ key: 'best', formula: 'max(a, b)' });
  });

  it('runs: a table without numbers is counted by the number, a line goes by its condition', () => {
    const g = { id: 'town', title: 'Town', steps: [numberStep({ key: 'size', dice: '2d6', keep: 'low', count: 1 }), stepOf({ label: 'Size', table: 'sizes', dice: '', by: 'size', byRow: true, times: 1 }), stepOf({ label: 'Inn', table: 'inns', dice: '', times: 1, when: { what: 'size', op: 'ge', value: 3 } })] };
    const town = runGenerator(f([g]), 'town', {}, seq(3, 5, 2));
    expect(town.lines.map((l) => lineWords(f([g]), l, 'en'))).toEqual(['Town', 'The Hen']);
    const farm = runGenerator(f([g]), 'town', {}, seq(1, 5));
    expect(farm.lines.map((l) => lineWords(f([g]), l, 'en'))).toEqual(['Farm']);
  });

  it('a card is found by titles: numbers, a text field, things in a slots group', () => {
    const fields = [{ key: 'str', title: 'STR', type: 'number' }, { key: 'look', title: 'Gear', type: 'text' }, { key: 'bag', title: 'Bag', type: 'slots' }];
    const g: Generator = { id: 'm', title: 'Mouse', names: { s: 'STR', w: 'Luck' }, steps: [numberStep({ key: 's', dice: '2d6' }), numberStep({ key: 'w', dice: 'd6' }), stepOf({ label: 'Name', table: 'inns', dice: '', times: 1 }), stepOf({ label: 'Gear', table: 'gear', dice: '', times: 1 }), stepOf({ label: 'Packed', table: 'gear', dice: '', times: 1, into: { field: 'bag', size: 4, pack: [2, 3] } })] };
    const r = linkCard(g, fields, 'character', 'en');
    expect(r.card.stats).toEqual({ str: 's' });
    expect(r.links).toContainEqual({ from: 'STR', to: 'STR' });
    expect(r.links).toContainEqual({ from: 'Luck', to: null });
    // No name chosen yet: the line called so, an empty choice is none.
    expect(linkCard(g, fields, 'character', 'en', '').card.name).toEqual({ line: 'l3' });
    const done = { ...g, steps: r.steps, card: r.card };
    const file = f([done]);
    const res = runGenerator(file, 'm', {}, seq(2, 3, 4, 1, 2, 1));
    const card = genCardOf(file, res.card!, 'en');
    expect(card).toMatchObject({ name: 'The Fox', stats: { str: 5, look: 'Lamp' } });
    expect((card.stats['bag'] as { name: string }[]).map((x) => x.name)).toEqual(['', '', 'Rope', '']);
  });
});
