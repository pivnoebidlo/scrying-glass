import { describe, expect, it } from 'vitest';
import { isOff, switched, toolPart } from '../src/shared/parts';

describe('parts of the app', () => {
  it('switches a part without repeats', () => {
    expect(switched([], 'maps', false)).toEqual(['maps']);
    expect(switched(['maps'], 'maps', false)).toEqual(['maps']);
    expect(switched(['maps', toolPart('npc')], 'maps', true)).toEqual(['tool:npc']);
    expect(isOff(['tool:npc'], toolPart('npc'))).toBe(true);
  });
});
