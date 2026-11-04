import { describe, expect, it } from 'vitest';
import { BYPASSES, COMPLICATIONS, MAKERS, MECHANISMS, REMAINS, TRIGGERS } from '../src/systems/dnd5e/tools/trap/content';
import { generateTrap, generateTrapPart, mechanismsFor, SEVERITIES, TRAP_DAMAGE, TRAP_KINDS, TRAP_PARTS, TRAP_PLACES, trapDice } from '../src/systems/dnd5e/tools/trap/generate';
import { mechanismOf, trapLabels, trapMarkdown, trapName, trapTexts } from '../src/systems/dnd5e/tools/trap/text';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('ловушки', () => {
  it('все строки на двух языках; у каждого вида и места есть из чего выбрать', () => {
    const pairs = [...MECHANISMS.flatMap((m) => [m.name, m.effect, m.clue, m.disarm]), ...BYPASSES, ...COMPLICATIONS, ...MAKERS, ...REMAINS, ...Object.values(TRIGGERS).flatMap((k) => Object.values(k).flat())];
    for (const p of pairs) expect(p[0] && p[1], p.join('|')).toBeTruthy();
    for (const kind of TRAP_KINDS) for (const place of TRAP_PLACES) {
      expect(mechanismsFor(kind, place).length, `${kind} ${place}`).toBeGreaterThan(1);
      expect(TRIGGERS[kind][place].length, `${kind} ${place}`).toBeGreaterThan(3);
    }
  });

  it('механизм описан согласованно: без спасброска — атака с уроном, половина — только при уроне', () => {
    for (const m of MECHANISMS) {
      if (!m.save) expect(m.damage, m.name[0]).toBeTruthy();
      if (m.success) expect(m.save && m.damage, m.name[0]).toBeTruthy();
      if (m.save && m.damage) expect(m.success, m.name[0]).toBeTruthy();
    }
  });

  it('числа — из таблиц SRD по опасности и уровню', () => {
    const r = seeded(11);
    const ranges = { setback: [10, 11, 3, 5], dangerous: [12, 15, 6, 8], deadly: [16, 20, 9, 12] } as const;
    for (const severity of SEVERITIES) for (let i = 0; i < 40; i++) {
      const x = generateTrap({ tier: 2, severity, kind: 'random', place: 'random' }, r);
      const [lo, hi, a, b] = ranges[severity];
      for (const dc of [x.saveDc, x.detectDc, x.disarmDc]) expect(dc >= lo && dc <= hi, `${severity} ${dc}`).toBe(true);
      expect(x.attack >= a && x.attack <= b).toBe(true);
    }
    expect(trapDice({ severity: 'setback', tier: 1 })).toBe('1d10');
    expect(trapDice({ severity: 'deadly', tier: 4 })).toBe('24d10');
    expect(TRAP_DAMAGE.dangerous[2]).toBe('4d10');
  });

  it('выбранные вид и место соблюдаются, случайные — разные', () => {
    const r = seeded(5);
    for (const kind of TRAP_KINDS) for (const place of TRAP_PLACES) for (let i = 0; i < 20; i++) {
      const x = generateTrap({ tier: 1, severity: 'dangerous', kind, place }, r);
      expect([x.kind, x.place]).toEqual([kind, place]);
      expect(MECHANISMS[x.mechanism]!.kind).toBe(kind);
      expect(MECHANISMS[x.mechanism]!.places).toContain(place);
    }
    const all = Array.from({ length: 80 }, () => generateTrap({ tier: 1, severity: 'dangerous', kind: 'random', place: 'random' }, r));
    expect(new Set(all.map((x) => `${x.kind} ${x.place}`)).size).toBe(TRAP_KINDS.length * TRAP_PLACES.length);
  });

  it('переброс меняет только свою часть и даёт другое', () => {
    const r = seeded(9);
    const x = generateTrap({ tier: 3, severity: 'deadly', kind: 'magical', place: 'door' }, r);
    for (const part of TRAP_PARTS) {
      const change = generateTrapPart(part, x, r);
      const next = { ...x, ...change };
      expect(next.kind).toBe(x.kind);
      expect(next.place).toBe(x.place);
      expect(next).not.toEqual(x);
      expect(MECHANISMS[next.mechanism]!.places).toContain('door');
    }
    expect(Object.keys(generateTrapPart('trigger', x, r))).toEqual(['trigger']);
  });

  it('текст на языке интерфейса; в журнал кубы идут с броском', () => {
    const x = generateTrap({ tier: 1, severity: 'dangerous', kind: 'mechanical', place: 'corridor' }, seeded(3));
    expect(trapName(x, 'ru')).toMatch(/[А-Яа-я]/);
    expect(trapName(x, 'en')).not.toMatch(/[А-Яа-я]/);
    expect(trapTexts(x, 'ru').trigger).toMatch(/[А-Яа-я]/);
    const l = trapLabels('en');
    const md = trapMarkdown(x, 'en', l, 'Sub', { heading: true, rollable: true });
    expect(md).toMatch(/^# /);
    expect(md).toContain('*Sub*');
    const rolled = mechanismOf(x)?.damage;
    if (rolled) expect(md).toContain('{2d10}');
    expect(trapMarkdown(x, 'en', l, 'Sub', { heading: false, rollable: false })).not.toContain('{');
  });

  it('строка правила: спасбросок с половиной, без урона, атака', () => {
    const r = seeded(13);
    const l = trapLabels('en');
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const x = generateTrap({ tier: 1, severity: 'setback', kind: 'random', place: 'random' }, r);
      const m = mechanismOf(x)!;
      const line = l.rule(x, '1d10');
      seen.add(m.save ? (m.damage ? m.success! : 'nodamage') : 'attack');
      if (!m.save) expect(line).toMatch(/^\+\d+ to hit: 1d10 \w+ damage$/);
      else if (!m.damage) expect(line).toMatch(/^[A-Z]{3} save DC \d+$/);
      else expect(line).toMatch(m.success === 'half' ? /half on a success$/ : /none on a success$/);
      expect(l.detectCheck(x)).toMatch(/ DC \d+$/);
      expect(l.disarmCheck(x)).toMatch(/ DC \d+$/);
    }
    expect(seen.size).toBe(4);
    expect(trapLabels('en', false).rule(generateTrap({ tier: 1, severity: 'setback', kind: 'random', place: 'random' }, r), '1d10')).toBe('');
  });
});
