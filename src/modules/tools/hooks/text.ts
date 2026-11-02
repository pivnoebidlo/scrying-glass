// An adventure hook as Markdown (for the journal and the clipboard); labels come from the page in the interface
// language.
import { approachText } from './generate';
import type { Hook } from './types';

export interface HookLabels {
  theme: string;
  patron: string;
  task: string;
  deadline: string;
  stakes: string;
  place: string;
  foe: string;
  twist: string;
  reward: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const end = (s: string) => (/[.!?…]$/.test(s) ? s : `${s}.`);

export function hookMarkdown(h: Hook, l: HookLabels, title?: string): string {
  const out = title ? [`# ${title}`, ''] : [];
  out.push(`*${l.theme}*`, '', `> ${end(cap(approachText(h)))} ${end(cap(h.task))}`, '');
  out.push(`- **${l.patron}:** ${h.patron.name} — ${h.patron.occupation}; ${h.patron.trait}.`);
  out.push(`- **${l.deadline}:** ${h.deadline}`, `- **${l.stakes}:** ${h.stakes}`);
  out.push(`- **${l.place}:** ${h.place}`, `- **${l.foe}:** ${h.foe}`, `- **${l.reward}:** ${h.reward}`, '');
  out.push(`## ${l.twist}`, '', end(cap(h.twist)));
  return out.join('\n');
}
