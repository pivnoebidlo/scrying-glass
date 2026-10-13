import { describe, expect, it } from 'vitest';
import { applyOrder, moveId } from '../src/shared/order';

describe('порядок плиток', () => {
  const id = (x: string) => x;

  it('сначала расставленные мастером, потом новые в исходном порядке', () => {
    expect(applyOrder(['a', 'b', 'c', 'd'], id, ['c', 'a'])).toEqual(['c', 'a', 'b', 'd']);
  });

  it('пропавшие из группы id пропускаются, без сохранённого порядка — как есть', () => {
    expect(applyOrder(['a', 'b'], id, ['x', 'b'])).toEqual(['b', 'a']);
    expect(applyOrder(['a', 'b'], id, undefined)).toEqual(['a', 'b']);
  });

  it('перестановка перед и после цели', () => {
    expect(moveId(['a', 'b', 'c'], 'c', 'a', false)).toEqual(['c', 'a', 'b']);
    expect(moveId(['a', 'b', 'c'], 'a', 'c', true)).toEqual(['b', 'c', 'a']);
    expect(moveId(['a', 'b'], 'a', 'zzz', true)).toEqual(['a', 'b']);
  });
});
