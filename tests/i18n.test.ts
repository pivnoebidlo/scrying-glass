import { describe, expect, it } from 'vitest';
import { format, resolveLang, tr } from '../src/shared/i18n';

describe('i18n', () => {
  it('auto language: the first OS language we have, otherwise English', () => {
    expect(resolveLang('auto', ['ru-RU', 'en-US'])).toBe('ru');
    expect(resolveLang('auto', ['de-DE', 'en-GB'])).toBe('en');
    expect(resolveLang('auto', ['de-DE', 'fr'])).toBe('en');
    expect(resolveLang('auto', [])).toBe('en');
    expect(resolveLang('ru', ['en-US'])).toBe('ru');
    expect(resolveLang(undefined, ['ru'])).toBe('ru');
  });

  it('plural forms by the rules of the language', () => {
    const m = { one: '{count} ячейка', few: '{count} ячейки', many: '{count} ячеек', other: '{count} ячейки' };
    expect([1, 2, 5, 11, 21, 22].map((count) => format('ru', m, { count }))).toEqual(['1 ячейка', '2 ячейки', '5 ячеек', '11 ячеек', '21 ячейка', '22 ячейки']);
    const e = { one: '{count} slot', other: '{count} slots' };
    expect([1, 2].map((count) => format('en', e, { count }))).toEqual(['1 slot', '2 slots']);
  });

  it('placeholders; unknown ones stay as is', () => {
    expect(format('en', 'Hi {name}, {x}', { name: 'Gilbert' })).toBe('Hi Gilbert, {x}');
  });

  it('messages by language', () => {
    expect(tr('en', 'module.journal')).toBe('Journal');
    expect(tr('ru', 'module.journal')).toBe('Журнал');
    expect(tr('ru', 'badge.inFightN', { count: 3 })).toBe('в бою ×3');
  });
});

describe('встроенные звуки', () => {
  it('подпись — на языке интерфейса, имя файла — идентификатор; каждый файл в resources/sounds подписан', async () => {
    const fs = await import('node:fs');
    const { trackName } = await import('../src/shared/vault');
    const { setLang } = await import('../src/shared/i18n');
    setLang('en');
    expect(trackName('sound:sfx/Гром.ogg')).toBe('Thunder');
    expect(trackName('music/01_дорога.mp3')).toBe('Дорога');
    setLang('ru');
    expect(trackName('sound:ambience/Дождь.m4a')).toBe('Дождь');
    setLang('en');
    for (const dir of ['sfx', 'ambience']) {
      for (const f of fs.readdirSync(`resources/sounds/${dir}`)) {
        if (!/\.(ogg|m4a|mp3|wav)$/.test(f)) continue;
        expect(trackName(`sound:${dir}/${f.normalize('NFC')}`), f).toMatch(/^[A-Z][a-z ]+$/);
      }
    }
  });

  it('every built-in sound is in a group of its kind, the groups go in order', async () => {
    const fs = await import('node:fs');
    const { trackName } = await import('../src/shared/vault');
    const { builtinSoundOptions } = await import('../src/shared/sounds');
    const { setLang } = await import('../src/shared/i18n');
    setLang('en');
    const kinds = { sfx: ['Combat', 'Magic', 'Creatures', 'People and town', 'Eerie', 'Doors and things', 'Nature'], ambience: ['Outdoors', 'Weather', 'Places', 'Dark places'] };
    for (const [dir, groups] of Object.entries(kinds)) {
      const paths = fs.readdirSync(`resources/sounds/${dir}`).filter((f) => /\.(ogg|m4a)$/.test(f)).map((f) => `sound:${dir}/${f.normalize('NFC')}`);
      const options = builtinSoundOptions(paths, trackName);
      expect(options).toHaveLength(paths.length);
      for (const o of options) expect(groups, o.title).toContain(o.group);
      const order = [...new Set(options.map((o) => o.group))];
      expect(order).toEqual(groups.filter((g) => order.includes(g)));
    }
  });
});

describe('проверка обновлений', () => {
  it('сравнение версий', async () => {
    const { isNewer, isReleaseUrl } = await import('../src/shared/updates');
    expect(isNewer('v0.30.0', '0.29.0')).toBe(true);
    expect(isNewer('0.29.1', '0.29.0')).toBe(true);
    expect(isNewer('1.0.0', '0.99.9')).toBe(true);
    expect(isNewer('0.29.0', '0.29.0')).toBe(false);
    expect(isNewer('0.28.9', '0.29.0')).toBe(false);
    expect(isNewer('v0.30.0-beta', '0.29.0')).toBe(true);
    expect(isReleaseUrl('https://github.com/pivnoebidlo/scrying-glass/releases/tag/v0.30.0')).toBe(true);
    expect(isReleaseUrl('https://evil.example/releases')).toBe(false);
  });
});
