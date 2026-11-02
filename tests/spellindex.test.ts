import { describe, expect, it } from 'vitest';
import { knownSpells, setSpellIndex, spellName, spellPattern } from '../src/systems/dnd5e/spellindex';

describe('указатель заклинаний', () => {
  it('другие названия (LSS) ведут на запись по английскому; известное название важнее', () => {
    setSpellIndex(['Огненные руки', 'Burning Hands', 'Щит', 'Shield'], {
      'Огненные ладони': 'Burning Hands',
      Щит: 'Burning Hands',
      'Тёмное зрение': 'Darkvision',
    });
    expect(spellName('огненные ладони')).toBe('Burning Hands');
    expect(spellName('Огненные руки')).toBe('Огненные руки');
    expect(spellName('Щит')).toBe('Щит');
    // An alias of a spell the compendium does not have is dropped.
    expect(spellName('Тёмное зрение')).toBeUndefined();
    expect(knownSpells()).not.toContain('Огненные ладони');
    const found = [...'Щит, Огненные ладони, Свет'.matchAll(spellPattern()!)].map((m) => m[0]);
    expect(found).toEqual(['Щит', 'Огненные ладони']);
  });
});
