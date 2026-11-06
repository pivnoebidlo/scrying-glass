import { describe, expect, it } from 'vitest';
import { knownNames, setNameIndex, linkedName, namePattern } from '../src/shared/nameindex';

describe('указатель заклинаний', () => {
  it('другие названия (LSS) ведут на запись по английскому; известное название важнее', () => {
    setNameIndex(['Огненные руки', 'Burning Hands', 'Щит', 'Shield'], {
      'Огненные ладони': 'Burning Hands',
      Щит: 'Burning Hands',
      'Тёмное зрение': 'Darkvision',
    });
    expect(linkedName('огненные ладони')).toBe('Burning Hands');
    expect(linkedName('Огненные руки')).toBe('Огненные руки');
    expect(linkedName('Щит')).toBe('Щит');
    // An alias of a spell the compendium does not have is dropped.
    expect(linkedName('Тёмное зрение')).toBeUndefined();
    expect(knownNames()).not.toContain('Огненные ладони');
    const found = [...'Щит, Огненные ладони, Свет'.matchAll(namePattern()!)].map((m) => m[0]);
    expect(found).toEqual(['Щит', 'Огненные ладони']);
  });
});
