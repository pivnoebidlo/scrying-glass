// The Konami code (↑ ↑ ↓ ↓ ← → ← → B A), keys by their place — any layout will do.
export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

/** The next progress through the code after the key `code`; `KONAMI.length` — the code is complete. */
export function konamiStep(at: number, code: string): number {
  if (code === KONAMI[at]) return at + 1;
  // A wrong key may still start the code again (↑ ↑ ↑ ↓ … is fine).
  return code === KONAMI[0] ? (at >= 2 && KONAMI[at - 1] === 'ArrowUp' ? at : 1) : 0;
}
