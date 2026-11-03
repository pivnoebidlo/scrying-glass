// Riddle and puzzle generator in the control window: the kind, the level and the current puzzle (remembered by the
// window); the content follows the interface language.
import { locale } from '../../../renderer/lib/i18n.svelte';
import { en } from './content/en';
import { ru } from './content/ru';
import { generatePuzzle } from './generate';
import type { Kind, Level, Puzzle, PuzzleContent } from './types';

const CONTENT: Record<string, PuzzleContent> = { en, ru };

const KEY = 'riddles.state';
interface Saved {
  kind: Kind | 'random';
  level: Level;
  puzzle: Puzzle | null;
  // How many hints are open, whether the answer is.
  hints: number;
  answer: boolean;
  // Switches pressed at the table.
  play: number[] | null;
}
function load(): Saved {
  const empty: Saved = { kind: 'random', level: 'medium', puzzle: null, hints: 0, answer: false, play: null };
  try {
    return { ...empty, ...(JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null) };
  } catch {
    return empty;
  }
}
export const riddles = $state(load());
export const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(riddles)));
  } catch {
    /* not remembered — not a problem */
  }
};

export function createPuzzle() {
  riddles.puzzle = generatePuzzle(riddles.kind, riddles.level, CONTENT[locale.lang] ?? en);
  riddles.hints = 0;
  riddles.answer = false;
  riddles.play = null;
  save();
}
