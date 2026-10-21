// The tavern's menu as a handout: a note (shared/notes.ts) the players can be shown. Its look follows the place:
// chalk on a dark board in a den, plain paper in a modest house, vellum and a fine hand among the rich.
import { newNote, type Note, type NoteFont, type NotePaper } from '../../../shared/notes';
import type { Tavern, Wealth } from './types';

export interface MenuLabels {
  drinks: string;
  food: string;
  rooms: string;
}

const LOOK: Record<Wealth, { paper: NotePaper; font: NoteFont; edge: Note['edge'] }> = {
  squalid: { paper: 'dark', font: 'amatic', edge: 'torn' },
  poor: { paper: 'dark', font: 'neucha', edge: 'straight' },
  modest: { paper: 'paper', font: 'kurale', edge: 'straight' },
  comfortable: { paper: 'parchment', font: 'cormorant', edge: 'straight' },
  wealthy: { paper: 'vellum', font: 'oldstandard', edge: 'straight' },
  aristocratic: { paper: 'vellum', font: 'cormorant', edge: 'straight' },
};

export function menuNote(t: Tavern, l: MenuLabels): Note {
  // Lines, not a list: centred on the sheet like a real bill of fare.
  const rows = (list: { name: string; price: string }[]) => list.map((m) => `${m.name} — ${m.price}`);
  const parts = [
    `# ${t.name}`,
    `## ${l.drinks}`,
    ...rows(t.menu.filter((m) => m.kind === 'drink')),
    '',
    `## ${l.food}`,
    ...rows(t.menu.filter((m) => m.kind === 'food')),
    ...(t.rooms.length ? ['', '---', '', `## ${l.rooms}`, ...rows(t.rooms)] : []),
  ];
  return { ...newNote(), ...LOOK[t.wealth], text: parts.join('\n'), size: 4, align: 'center' };
}
