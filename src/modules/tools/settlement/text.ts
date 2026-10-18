// A settlement as Markdown (for the journal and the clipboard); labels come from the page in the interface language.
import { troubleText } from './generate';
import type { Settlement } from './types';

export interface SettlementLabels {
  size: string;
  population: string;
  peoples: string;
  // «mostly humans, also dwarves and elves».
  peoplesLine: string;
  ruled: string;
  defense: string;
  knownFor: string;
  places: string;
  people: string;
  trouble: string;
  tavern: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const personLine = (p: Settlement['people'][number]) => `**${p.name}** — ${p.occupation}; ${p.trait}.`;

export function settlementMarkdown(s: Settlement, l: SettlementLabels, heading = true): string {
  const out = heading ? [`# ${s.name}`, ''] : [];
  out.push(`*${l.size}, ${l.population}.*`, '', `> ${s.impression}`, '');
  out.push(`- **${l.peoples}:** ${l.peoplesLine}`);
  out.push(`- **${l.ruled}:** ${s.government}`, `- **${l.defense}:** ${s.defense}`, `- **${l.knownFor}:** ${s.knownFor.join('; ')}`, '');
  out.push(`## ${l.places}`, '', `- ${cap(l.tavern)}`, ...s.places.map((p) => `- ${cap(p)}`), '');
  out.push(`## ${l.people}`, '', ...s.people.map((p) => `- ${personLine(p)}`), '');
  out.push(`## ${l.trouble}`, '', troubleText(s));
  return out.join('\n');
}
