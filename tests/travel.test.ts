import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runForm, validateGenerators, type GeneratorFile } from '../src/shared/generators';

const file = validateGenerators(JSON.parse(fs.readFileSync('content/dnd5e-srd/generators/travel.json', 'utf8'))) as GeneratorFile;
const form = file.forms![0]!;
const VESSEL_SAILING = 6;
const PACE = { slow: 0, normal: 1, fast: 2 };
const TERRAIN = { forest: 3, grassland: 4, mountain: 6 };
const base = { distance: 60, by: 0, pace: PACE.normal, terrain: TERRAIN.grassland, road: 0, difficult: 0, hours: 8 };
const run = (v: Partial<typeof base>, system = 'dnd5e-2024') => runForm(form, { ...base, ...v }, system, 'en');
const big = (v: Partial<typeof base>, system?: string) => run(v, system).results.filter((x) => x.kind === 'big').map((x) => x.text);
const warned = (v: Partial<typeof base>) => run(v).results.some((x) => x.kind === 'warn');
const says = (v: Partial<typeof base>) => run(v).results.map((x) => x.text).join(' | ');

describe('путь', () => {
  it('обычный темп: 24 мили за день, 60 миль — 2 дня и 4 часа', () => {
    expect(big({})).toEqual(['2 days 4 hours', '3 miles an hour, 24 miles a day · Normal']);
    expect(says({})).not.toContain('hour 9');
  });

  it('местность 2024 ограничивает темп, хорошая дорога поднимает его на ступень', () => {
    expect(big({ pace: PACE.fast, terrain: TERRAIN.mountain })[1]).toContain('18 miles a day · Slow');
    expect(warned({ pace: PACE.fast, terrain: TERRAIN.mountain })).toBe(true);
    expect(big({ pace: PACE.fast, terrain: TERRAIN.mountain, road: 1 })[1]).toContain('· Normal');
    expect(warned({ pace: PACE.fast, terrain: TERRAIN.mountain, road: 1 })).toBe(true);
    expect(big({ pace: PACE.fast, terrain: TERRAIN.forest, road: 1 })[1]).toContain('30 miles a day · Fast');
    expect(warned({ pace: PACE.fast, terrain: TERRAIN.forest, road: 1 })).toBe(false);
  });

  it('2014: трудная местность — вдвое медленнее, местность темп не ограничивает', () => {
    expect(big({ pace: PACE.fast, terrain: TERRAIN.mountain, difficult: 1 }, 'dnd5e-2014')[1]).toBe('2 miles an hour, 15 miles a day · Fast');
    expect(run({}, 'dnd5e-2014').inputs.map((i) => i.key)).not.toContain('terrain');
    expect(run({}).inputs.map((i) => i.key)).not.toContain('difficult');
  });

  it('долгий день: лишние часы по часовой скорости и спасброски СЛ 11, 12…', () => {
    expect(big({ hours: 10 })[1]).toContain('30 miles a day');
    expect(says({ hours: 10 })).toContain('hour 9: DC 11; hour 10: DC 12');
  });

  it('корабль: своя скорость, до 24 часов, без спасбросков', () => {
    expect(big({ by: VESSEL_SAILING, distance: 100, hours: 24 })).toEqual(['2 days 2 hours', '2 miles an hour, 48 miles a day']);
    expect(says({ by: VESSEL_SAILING, hours: 24 })).not.toContain('hour 9');
    expect(run({ by: VESSEL_SAILING }).inputs.map((i) => i.key)).toEqual(['distance', 'by', 'hours']);
  });

  it('последний день не длиннее дня: медленный темп, 17 миль — 8 часов', () => {
    expect(big({ pace: PACE.slow, distance: 17 })[0]).toBe('8 hours');
  });

  it('форма: мусор не проходит, слова идут за языком', () => {
    expect(validateGenerators({ scryingGlass: 'generators', version: 1, system: 'x', tables: {}, generators: [], forms: [{ id: 'a', title: 'A', inputs: [], results: [{ text: 'x', when: '((' }] }] })).toBe('forms');
    expect(runForm(form, base, 'dnd5e-2024', 'ru').results[0]!.text).toBe('2 дня 4 часа');
  });
});
