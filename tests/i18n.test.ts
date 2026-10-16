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
