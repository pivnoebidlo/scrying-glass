// A dungeon as text in one language: its name, the parts of a room, and the whole as Markdown (creatures and magic
// items as [[links]]).
import { OWNERS } from '../relic/content';
import { ATMOSPHERES, BUILDERS, ENTRANCES, FATES, FEATURES, HOOKS, MONSTERS, PLACES, PUZZLES, ROOMS, TRAPS, TWISTS } from './content';
import type { Dungeon, Room } from './generate';

export type DungeonLang = 'en' | 'ru';
const at = (lang: DungeonLang) => (lang === 'ru' ? 1 : 0);

export const dungeonName = (d: Dungeon, lang: DungeonLang) => `${PLACES[d.type][d.place]?.[at(lang)] ?? ''} ${OWNERS[d.owner]?.[at(lang)] ?? ''}`;
export const overview = (d: Dungeon, lang: DungeonLang) => ({
  builder: BUILDERS[d.builder]?.[at(lang)] ?? '',
  fate: FATES[d.fate]?.[at(lang)] ?? '',
  entrance: ENTRANCES[d.entrance]?.[at(lang)] ?? '',
  atmosphere: ATMOSPHERES[d.atmosphere]?.[at(lang)] ?? '',
  hook: HOOKS[d.hook]?.[at(lang)] ?? '',
});
export const roomText = (x: Room, lang: DungeonLang) => `${ROOMS[x.room]?.[at(lang)] ?? ''} ${FEATURES[x.feature]?.[at(lang)] ?? ''}`;
export const monsterName = (x: Room, lang: DungeonLang) => (x.monster ? (MONSTERS[x.monster.index]?.[at(lang)] ?? '') : '');
export const puzzleText = (x: Room, lang: DungeonLang) => (x.puzzle === undefined ? '' : (PUZZLES[x.puzzle]?.[at(lang)] ?? ''));
export const trapText = (x: Room, lang: DungeonLang) => (x.trap ? (TRAPS[x.trap.index]?.[at(lang)] ?? '') : '');
export const twistText = (x: Room, lang: DungeonLang) => (x.twist === undefined ? '' : (TWISTS[x.twist]?.[at(lang)] ?? ''));
// The trap's damage type in the language (English — a word, Russian — «колющего урона»).
export const trapDamage = (x: Room, lang: DungeonLang) => (x.trap ? (TRAPS[x.trap.index]?.[lang === 'ru' ? 4 : 3] ?? '') : '');
export const trapSave = (x: Room) => (x.trap ? (TRAPS[x.trap.index]?.[2] ?? 'dex') : 'dex');

export interface DungeonLabels {
  role: (role: string) => string;
  room: (n: number) => string;
  builder: string;
  entrance: string;
  hook: string;
  creatures: string;
  puzzle: string;
  trap: string;
  // The rule line of a trap («DEX save DC 13, 4d10 piercing damage») or '' (not D&D).
  trapRule: (x: Room) => string;
  hoard: string;
  // The hoard's lines (coins, valuables, items) — made by the page with the treasure generator's text.
  hoardLines: string[];
  twist: string;
}

export function dungeonMarkdown(d: Dungeon, lang: DungeonLang, l: DungeonLabels, heading = true): string {
  const o = overview(d, lang);
  const out = heading ? [`# ${dungeonName(d, lang)}`, ''] : [];
  out.push(`> ${o.atmosphere}`, '', `- **${l.builder}:** ${o.builder}. ${o.fate}`, `- **${l.entrance}:** ${o.entrance}`, `- **${l.hook}:** ${o.hook}`, '');
  d.rooms.forEach((x, i) => {
    out.push(`## ${l.room(i + 1)} — ${l.role(x.role)}`, '', roomText(x, lang));
    if (x.monster) out.push('', `**${l.creatures}:** [[${monsterName(x, lang)}]]${x.monster.count > 1 ? ` ×${x.monster.count}` : ''}`);
    if (x.puzzle !== undefined) out.push('', `**${l.puzzle}:** ${puzzleText(x, lang)}`);
    if (x.trap) {
      const rule = l.trapRule(x);
      out.push('', `**${l.trap}:** ${trapText(x, lang)}${rule ? ` *${rule}*` : ''}`);
    }
    if (x.role === 'reward') {
      out.push('', `**${l.hoard}:**`, ...l.hoardLines.map((h) => `- ${h}`));
      if (x.twist !== undefined) out.push('', `**${l.twist}:** ${twistText(x, lang)}`);
    }
    out.push('');
  });
  return out.join('\n').trim();
}
