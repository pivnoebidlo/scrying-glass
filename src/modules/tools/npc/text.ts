// An NPC as text: a Markdown note for the journal, and the description and notes of an NPC card.
import { npcName } from './generate';
import type { Npc } from './types';

export interface NpcLabels {
  race: (id: string) => string;
  appearance: string;
  trait: string;
  manner: string;
  desire: string;
  secret: string;
  item: string;
  fame: string;
  quote: (s: string) => string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// «Human, blacksmith.»
export const npcLine = (n: Npc, l: NpcLabels) => `${l.race(n.race)}, ${n.occupation}.`;

// What the GM keeps in mind about the NPC: one «Label: text» per line.
export function npcNotes(n: Npc, l: NpcLabels): string[] {
  return [
    `**${l.trait}:** ${cap(n.trait)}. ${cap(n.manner)}.`,
    `**${l.desire}:** ${n.desire}.`,
    `**${l.secret}:** ${n.secret}.`,
    `**${l.item}:** ${n.item}.`,
    ...(n.fame ? [`**${l.fame}:** ${n.fame}.`] : []),
  ];
}

export function npcMarkdown(n: Npc, l: NpcLabels, heading = true): string {
  return [
    ...(heading ? [`# ${npcName(n, l.quote)}`, ''] : []),
    `*${npcLine(n, l)}* ${cap(n.appearance.join('; '))}.`,
    '',
    ...npcNotes(n, l).map((x) => `- ${x}`),
    '',
  ].join('\n');
}

// An NPC card: the description — who they are and how they look (players may hear it), the notes — the rest.
export const npcCard = (n: Npc, l: NpcLabels) => ({
  name: npcName(n, l.quote),
  description: `${npcLine(n, l)} ${cap(n.appearance.join('; '))}.`,
  notes: npcNotes(n, l).join('\n'),
});
