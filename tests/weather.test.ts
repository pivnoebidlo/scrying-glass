import { describe, expect, it } from 'vitest';
import { tr, type Lang } from '../src/shared/i18n';
import { effectsOf, generateWeather, SEASONS, TERRAINS } from '../src/modules/tools/weather/generate';
import { daySummary, weatherMarkdown } from '../src/modules/tools/weather/text';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('генератор погоды', () => {
  for (const lang of ['en', 'ru'] as Lang[]) {
    it(`${lang}: у каждой местности и сезона — текст без пропущенных строк словаря`, () => {
      const t = (k: Parameters<typeof tr>[1], p?: Record<string, string | number>) => tr(lang, k, p);
      for (const terrain of TERRAINS) {
        for (const season of SEASONS) {
          for (let i = 1; i < 6; i++) {
            const days = generateWeather({ terrain, season, days: 7 }, seeded(i * 31 + terrain.length));
            expect(days).toHaveLength(7);
            // Every day with an event too: all event lines exist.
            const withEvents = days.map((d, j) => ({ ...d, event: j % 4 }));
            const md = weatherMarkdown(withEvents, terrain, lang, true, t, 'W');
            expect(md, md).not.toMatch(/weather\./);
          }
        }
      }
    });
  }

  it('климат: жара в пустыне летом, мороз в арктике зимой, в подземье ни дождя, ни ветра', () => {
    const desert = generateWeather({ terrain: 'desert', season: 'summer', days: 14 }, seeded(3));
    expect(desert.some((d) => effectsOf(d).includes('extremeHeat'))).toBe(true);
    const arctic = generateWeather({ terrain: 'arctic', season: 'winter', days: 14 }, seeded(4));
    expect(arctic.every((d) => d.temp < 0)).toBe(true);
    expect(arctic.some((d) => effectsOf(d).includes('extremeCold'))).toBe(true);
    expect(arctic.filter((d) => d.precip !== 'none').every((d) => d.kind === 'snow')).toBe(true);
    const under = generateWeather({ terrain: 'underground', season: 'winter', days: 7 }, seeded(5));
    expect(under.every((d) => d.precip === 'none' && d.wind === 'calm' && Math.abs(d.temp - 12) <= 2)).toBe(true);
  });

  it('температура: °C по-русски, °F (°C) по-английски', () => {
    const d = { temp: -5, sky: 'clear' as const, precip: 'none' as const, kind: 'snow' as const, storm: false, wind: 'calm' as const, event: null };
    expect(daySummary(d, 'forest', 'ru', (k, p) => tr('ru', k, p))).toBe('Ясно, безветрие. −5 °C, мороз.');
    expect(daySummary(d, 'forest', 'en', (k, p) => tr('en', k, p))).toBe('Clear, no wind. 23 °F (-5 °C), freezing.');
  });
});
