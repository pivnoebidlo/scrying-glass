import * as fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EVENTS, COMPLICATIONS, RUMOR_INTROS } from '../src/systems/dnd5e/tools/events/events';
import { DANGERS, fits, generateEvents, splitLinks } from '../src/systems/dnd5e/tools/events/generate';
import { RUMORS, checkText, eventText } from '../src/systems/dnd5e/tools/events/text';
import { TERRAINS } from '../src/systems/dnd5e/tools/weather/generate';
import { dict } from '../src/systems/dnd5e/stats';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// Names of the SRD cards of both editions, by language.
const cardNames = (() => {
  const out: Record<string, Set<string>> = { en: new Set(), ru: new Set() };
  for (const ed of ['2014', '2024']) {
    const d = JSON.parse(fs.readFileSync(`resources/srd/dnd5e-${ed}.json`, 'utf8'));
    for (const c of d.cards ?? d) out[c.lang]?.add(c.name);
  }
  return out;
})();

describe('случайные события', () => {
  it('у каждой местности, времени и опасности есть события', () => {
    for (const terrain of TERRAINS) {
      for (const time of ['day', 'night'] as const) {
        for (const danger of DANGERS) {
          const n = EVENTS.filter((e) => fits(e, { terrain, time, danger })).length;
          expect(n, `${terrain} ${time} ${danger}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it('ссылки ведут на карточки SRD своего языка, проверки — на известные навыки', () => {
    const skills = dict('en').skills;
    for (const e of EVENTS) {
      for (const lang of ['en', 'ru'] as const) {
        for (const p of splitLinks(e[lang])) if ('link' in p) expect(cardNames[lang]!.has(p.link), `${lang}: ${p.link}`).toBe(true);
      }
      expect(splitLinks(e.en).filter((p) => 'link' in p).length, e.en).toBe(splitLinks(e.ru).filter((p) => 'link' in p).length);
      if (e.check) expect(e.check[0].startsWith('save:') || e.check[0] in skills, e.check[0]).toBe(true);
    }
    expect(RUMOR_INTROS.en.length).toBe(RUMOR_INTROS.ru.length);
    expect(COMPLICATIONS.en.length).toBe(COMPLICATIONS.ru.length);
  });

  it('бросок: столько событий, сколько просили, без повторов; слухи — из генератора таверн; текст и проверка', () => {
    const list = generateEvents(EVENTS, RUMORS.en.length, RUMOR_INTROS.en.length, COMPLICATIONS.en.length, { terrain: 'forest', time: 'night', danger: 'dangerous', count: 6 }, seeded(9));
    expect(list).toHaveLength(6);
    const idx = list.filter((g) => g.kind !== 'rumor').map((g) => g.index);
    expect(new Set(idx).size).toBe(idx.length);
    for (const g of list) {
      for (const lang of ['en', 'ru'] as const) expect(eventText(g, lang)).not.toMatch(/\{rumor\}|^$/);
      if (g.kind !== 'rumor') expect(fits(EVENTS[g.index]!, { terrain: 'forest', time: 'night', danger: 'dangerous' })).toBe(true);
    }
    const bridge = EVENTS.findIndex((e) => e.check?.[0] === 'athletics');
    expect(checkText({ kind: 'obstacle', index: bridge }, 'ru', (w, dc) => `${w}, СЛ ${dc}`, (a) => a)).toMatch(/^Атлетика, СЛ \d+$/);
    const hag = EVENTS.findIndex((e) => e.check?.[0] === 'save:wis');
    expect(checkText({ kind: 'encounter', index: hag }, 'en', (w, dc) => `${w}, DC ${dc}`, (a) => `${a} save`)).toBe('WIS save, DC 13');
  });
});
