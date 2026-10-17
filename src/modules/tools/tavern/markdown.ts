// A tavern as a Markdown note for the GM journal: the description as a read-aloud quote, people, menu, rooms, the
// evening's event, rumors as tasks to tick off when told, the request and the secret.
import { withPeople } from './generate';
import type { Person, Tavern, TavernContent } from './types';

export interface TavernLabels {
  type: string;
  wealth: string;
  // «Wealth» — the label before the wealth level.
  wealthLabel: string;
  sign: string;
  people: string;
  patrons: string;
  says: string;
  secret: string;
  menu: string;
  item: string;
  price: string;
  rooms: string;
  services: string;
  event: string;
  rumors: string;
  request: string;
  tavernSecret: string;
  race: (id: string) => string;
}

// heading — start with «# Name» (a copy); a journal note has the name as its title already.
export function tavernMarkdown(t: Tavern, c: TavernContent, l: TavernLabels, heading = true): string {
  const who = (p: Person) => `**${p.name}** — ${p.role}, ${l.race(p.race).toLowerCase()}`;
  const lines: string[] = [...(heading ? [`# ${t.name}`, ''] : []), `*${l.type}. ${l.wealthLabel}: ${l.wealth.toLowerCase()}.* ${l.sign}: ${t.sign}.`, '', `> ${t.intro}`];
  if (t.wonder) lines.push(`>`, `> ${t.wonder}`);
  lines.push('', `## ${l.people}`, '');
  const o = t.owner;
  lines.push(`- ${who(o)}. ${cap(o.trait ?? '')}. ${l.says}: ${o.catchphrase ?? ''} *${l.secret}:* ${o.secret ?? ''}.`);
  for (const s of t.staff) lines.push(`- ${who(s)}. ${cap(s.trait ?? '')}.`);
  if (t.patrons.length) {
    lines.push('', `## ${l.patrons}`, '');
    for (const p of t.patrons) lines.push(`- ${who(p)}: ${p.doing ?? ''}. *${l.secret}:* ${p.secret ?? ''}.`);
  }
  lines.push('', `## ${l.menu}`, '', `| ${l.item} | ${l.price} |`, '|---|---|', ...t.menu.map((m) => `| ${m.name} | ${m.price} |`));
  if (t.rooms.length) {
    lines.push('', `## ${l.rooms}`, '', ...t.rooms.map((r) => `- ${r.name} — ${r.price}`));
    if (t.services.length) lines.push('', `${l.services}: ${t.services.map((s) => s.toLowerCase()).join(', ')}.`);
  }
  lines.push('', `## ${l.event}`, '', withPeople(c.events[t.event] ?? '', t));
  lines.push('', `## ${l.rumors}`, '', ...t.rumors.map((r) => `- [ ] ${r}`));
  lines.push('', `## ${l.request}`, '', withPeople(c.requests[t.request] ?? '', t));
  lines.push('', `## ${l.tavernSecret}`, '', t.secret, '');
  return lines.join('\n');
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
