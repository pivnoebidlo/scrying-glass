import { describe, expect, it } from 'vitest';
import { KONAMI, konamiStep } from '../src/renderer/lib/eggs/konami';

const run = (codes: string[]) => codes.reduce((at, c) => (at === KONAMI.length ? at : konamiStep(at, c)), 0);

describe('Konami code', () => {
  it('completes on the exact sequence', () => expect(run(KONAMI)).toBe(KONAMI.length));
  it('allows extra ups before', () => expect(run(['ArrowUp', 'ArrowUp', ...KONAMI])).toBe(KONAMI.length));
  it('resets on a wrong key', () => expect(run([...KONAMI.slice(0, 5), 'KeyX', ...KONAMI.slice(5)])).toBeLessThan(KONAMI.length));
  it('restarts after a mistake', () => expect(run(['ArrowUp', 'ArrowDown', ...KONAMI])).toBe(KONAMI.length));
});
