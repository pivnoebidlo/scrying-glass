// Progress clocks (as in Blades in the Dark): a circle in segments that fill as a danger nears or work goes on.
// Each adventure has its own ('' — the whole vault); the player screen shows the ones marked `shown`.
import type { Corner } from '../fate/types';

// danger — a threat ticking up (red), progress — the party's work (the accent), neutral — anything else.
export type ClockTone = 'danger' | 'progress' | 'neutral';
export const CLOCK_TONES: ClockTone[] = ['danger', 'progress', 'neutral'];
export const CLOCK_SIZES = [4, 6, 8, 12] as const;
export const MAX_SEGMENTS = 12;

export interface Clock {
  id: string;
  title: string;
  segments: number;
  filled: number;
  tone: ClockTone;
  shown: boolean;
}

export interface ClocksState {
  byAdventure: Record<string, Clock[]>;
  // Where they stand on the player screen and how big.
  place: Corner;
  size: 'small' | 'medium' | 'large';
}
