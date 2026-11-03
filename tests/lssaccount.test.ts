import { describe, expect, it } from 'vitest';
import { fromLss, isLssExport, lssAsExport, lssCharacters, lssIdOf } from '../src/systems/dnd5e/lss';

const ID = '66d09c410a6ad15ce75ee469';
const sheet = (name: string, cls: string, level: number) =>
  JSON.stringify({ jsonType: 'character', name: { value: name }, info: { charClass: { value: cls }, level: { value: level } } });

describe('characters of the LSS account', () => {
  it('finds the id in a link or takes a bare one', () => {
    expect(lssIdOf(`https://longstoryshort.app/characters/digital/${ID}/`)).toBe(ID);
    expect(lssIdOf(`  ${ID.toUpperCase()} `)).toBe(ID);
    expect(lssIdOf('https://longstoryshort.app/characters/list/')).toBeNull();
    expect(lssIdOf(`${ID}ff`)).toBeNull();
  });

  it('turns an API answer into an export, the id comes from _id', () => {
    const answer = { _id: ID, edition: '2014', data: sheet('Амадеус', 'Жрец', 3), spells: { mode: 'cards', prepared: [] } };
    const exp = lssAsExport(answer);
    expect(isLssExport(exp)).toBe(true);
    expect(fromLss(exp as Parameters<typeof fromLss>[0]).lssId).toBe(ID);
    expect(lssAsExport({ nothing: true })).toBeNull();
  });

  it('reads the rows of the list', () => {
    const rows = lssCharacters([{ _id: ID, data: sheet('Амадеус', 'Жрец', 3) }, { _id: 'x', data: '{bad' }, null]);
    expect(rows.map(({ raw: _, ...r }) => r)).toEqual([{ id: ID, name: 'Амадеус', subtitle: 'Жрец 3' }]);
  });
});
