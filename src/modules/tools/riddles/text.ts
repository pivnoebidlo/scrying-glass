// A puzzle as Markdown (the journal and the clipboard) and as a handout note for the players; labels come from the
// page in the interface language.
import { newNote, type Note } from '../../../shared/notes';
import { mosaicTable } from './mosaic';
import type { Puzzle } from './types';

export interface PuzzleLabels {
  kind: string;
  level: string;
  place: string;
  hints: string;
  answer: string;
  failure: string;
  reward: string;
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const end = (s: string) => (/[.!?…:»”]$/.test(s) ? s : `${s}.`);
// The lines are a list (clues, inscriptions) or verse (a riddle, a cipher).
const listed = (p: Puzzle) => p.kind === 'order' || p.kind === 'caskets';

export function puzzleMarkdown(p: Puzzle, l: PuzzleLabels, title?: string): string {
  const out = title ? [`# ${title}`, ''] : [];
  out.push(`*${l.kind} · ${l.level}*`, '', `**${l.place}:** ${cap(p.place)}`, '');
  if (p.intro) out.push(`> ${p.intro}`, '>');
  if (listed(p)) out.push(...p.lines.map((x) => `> - ${end(x)}`));
  else out.push(...p.lines.map((x) => `> ${x}`));
  if (p.grid) out.push('', mosaicTable(p.grid));
  out.push('', `## ${l.hints}`, '', ...p.hints.map((h, i) => `${i + 1}. ${h}`), '');
  out.push(`## ${l.answer}`, '', end(cap(p.answer)), '');
  if (p.grid) out.push(mosaicTable(p.grid, true), '');
  out.push(`- **${l.failure}:** ${p.failure}`, `- **${l.reward}:** ${p.reward}`);
  return out.join('\n');
}

// What the players get: the scene and the lines, never the answer (a tile puzzle — a canvas: mosaicSketch). A cipher is set larger, on its own.
export function puzzleNote(p: Puzzle): Note {
  const body = listed(p) ? p.lines.map(end) : p.lines;
  const text = p.kind === 'cipher' ? [p.intro, '', `## ${p.lines[0]}`] : [...(p.intro ? [p.intro, ''] : []), ...body];
  return { ...newNote(), paper: 'parchment', font: 'cormorant', edge: 'straight', text: text.join('\n'), size: p.kind === 'order' || p.kind === 'caskets' ? 5.5 : 6.5, align: p.kind === 'riddle' ? 'center' : 'left' };
}
