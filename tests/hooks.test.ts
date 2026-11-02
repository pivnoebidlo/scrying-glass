import { describe, expect, it } from 'vitest';
import { en } from '../src/modules/tools/hooks/content/en';
import { ru } from '../src/modules/tools/hooks/content/ru';
import { approachText, generateHook, generateHookPart, rerollHook } from '../src/modules/tools/hooks/generate';
import { hookMarkdown } from '../src/modules/tools/hooks/text';
import { HOOK_PARTS, THEMES } from '../src/modules/tools/hooks/types';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const helpers = { patron: () => ({ name: 'Mira Stone', occupation: 'a miller', trait: 'never forgets a face' }) };
const labels = { theme: 'Mystery', patron: 'Patron', task: 'Task', deadline: 'Deadline', stakes: 'At stake', place: 'Where', foe: 'Foe', twist: 'Twist', reward: 'Reward' };

describe('завязки приключений', () => {
  it('у обоих языков одинаковые списки', () => {
    for (const k of ['approaches', 'deadlines', 'stakes', 'places', 'foes', 'twists', 'rewards'] as const) expect(ru[k].length, k).toBe(en[k].length);
    for (const theme of THEMES) expect(ru.tasks[theme].length, theme).toBe(en.tasks[theme].length);
    for (const c of [en, ru]) for (const a of c.approaches) expect(a).toMatch(/^\{patron\} /);
  });

  it('тема задаёт задание; случайная — любая из тем', () => {
    const r = seeded(7);
    for (const theme of THEMES) for (let i = 0; i < 20; i++) expect(en.tasks[theme]).toContain(generateHook(theme, en, helpers, r).task);
    const seen = new Set(Array.from({ length: 60 }, () => generateHook('random', en, helpers, r).theme));
    expect(seen.size).toBe(THEMES.length);
  });

  it('заказчик в обращении; переброс меняет только незакреплённое', () => {
    const h = { ...generateHook('rescue', en, helpers, seeded(3)), approach: '{patron} finds the heroes at the inn' };
    expect(approachText(h)).toBe('Mira Stone, a miller, finds the heroes at the inn');
    const pinned = HOOK_PARTS.filter((p) => p !== 'twist');
    const next = rerollHook(h, pinned, en, helpers, seeded(9));
    expect({ ...next, twist: h.twist }).toEqual(h);
    expect(Object.keys(generateHookPart('task', h, en, helpers))).toEqual(['task', 'deadline', 'stakes']);
    const md = hookMarkdown(h, labels, 'Hook');
    expect(md).toMatch(/^# Hook\n/);
    expect(md).toContain('> Mira Stone, a miller, finds the heroes at the inn.');
    expect(md).toContain('## Twist');
  });
});
