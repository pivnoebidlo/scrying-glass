// The tools of Tools in one list: their icon, title, page and the systems they belong to. A tool without families is
// common (any system); a system's tools show only in its adventures, unless the GM turned one on for another system in
// the settings (Tools → "Tools of other systems", remembered by the window). A system plugin brings its own tools
// (SystemUi.tools, with their pages) and claims the core's generators it shows as its own (SystemUi.claims).
import type { Component } from 'svelte';
import { Beer, Blocks, Dices, CalendarClock, Castle, Flag, Hourglass, Pickaxe, Rat, Send, Signature, Store, Swords, Table2, UserRound } from '@lucide/svelte';
import { systemUis } from '../../../systems/ui';
import { enabledSystems } from '../../../systems';
import { t } from '../../../renderer/lib/i18n.svelte';
import type { ToolId } from './ui.svelte';

export interface ToolDef {
  id: Exclude<ToolId, 'notes'>;
  icon: Component<{ size?: number }>;
  readonly title: string;
  // Families of systems the tool belongs to (none — common).
  families?: string[];
  // The page of a plugin's tool (the core's pages are in View.svelte).
  page?: Component;
}

function tool(id: ToolDef['id'], icon: ToolDef['icon'], key: string, families?: string[]): ToolDef {
  const def: ToolDef = {
    id,
    icon,
    get title() {
      return t(key as never);
    },
    ...(families && families !== SOME ? { families } : {}),
  };
  // A generator of some systems belongs to the plugins that claim it (a getter: not spread anywhere).
  if (families === SOME) Object.defineProperty(def, 'families', { get: () => claimed(id), enumerable: true });
  return def;
}

// A generator of some systems: its families are the plugins that claim it.
const SOME: string[] = [];
const claimed = (id: string) => systemUis.filter((u) => u.claims?.includes(id)).map((u) => u.family);
const MAUS = ['mausritter'];
const FITD = ['fitd'];

// In the order of the sidebar (notes come first and are drawn apart: they have their list).
const CORE: ToolDef[] = [
  tool('schedule', CalendarClock, 'tools.side.schedule'),
  tool('telegram', Send, 'tg.compose'),
  tool('timer', Hourglass, 'tools.side.timer'),
  tool('rollTables', Dices, 'tools.side.rollTables'),
  tool('systems', Blocks, 'sb.title'),
  tool('names', Signature, 'tools.side.names', SOME),
  tool('npc', UserRound, 'tools.side.npc', SOME),
  tool('tavern', Beer, 'tools.side.tavern', SOME),
  tool('settlement', Castle, 'tools.side.settlement', SOME),
  tool('mouse', Rat, 'tools.side.mouse', MAUS),
  tool('mausTables', Table2, 'tools.side.mausTables', MAUS),
  tool('factions', Flag, 'tools.side.factions', MAUS),
  tool('mausShop', Store, 'tools.side.mausShop', MAUS),
  tool('build', Pickaxe, 'tools.side.build', MAUS),
  tool('crew', Swords, 'tools.side.crew', FITD),
];

export const TOOLS: ToolDef[] = [
  ...CORE,
  ...systemUis.flatMap((u) => u.tools ?? []),
];

// Tools turned on by hand for a family: { mausritter: ['names'] }.
const KEY = 'tools.extra';
function load(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string[]>;
  } catch {
    return {};
  }
}
export const extra = $state(load());
export function setExtra(family: string, id: string, on: boolean) {
  const list = new Set(extra[family] ?? []);
  if (on) list.add(id);
  else list.delete(id);
  extra[family] = [...list];
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(extra)));
  } catch {
    /* not remembered — not a problem */
  }
}

export type Place = 'common' | 'own' | 'extra';
// Where a tool stands in a family's adventure: common, the system's own, turned on by hand — or hidden (null).
export function placeOf(def: ToolDef, family: string): Place | null {
  if (!def.families) return 'common';
  if (def.families.includes(family)) return 'own';
  // Turned on by hand — while one of its systems is on.
  const on = def.families.some((f) => enabledSystems().some((s) => s.family === f));
  return on && (extra[family] ?? []).includes(def.id) ? 'extra' : null;
}
export const shown = (id: ToolId, family: string) => id === 'notes' || TOOLS.some((d) => d.id === id && placeOf(d, family) !== null);
