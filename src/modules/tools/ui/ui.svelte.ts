// Что открыто в «Инструментах»: инструмент и записка в редакторе (путь в хранилище).
import { openTab } from '../../../renderer/lib/nav';

export type ToolId = 'notes' | 'names' | 'npc' | 'tavern' | 'weather' | 'events' | 'treasure' | 'settlement' | 'shop' | 'relic' | 'dungeon' | 'travel' | 'schedule' | 'telegram' | 'difficulty' | 'timer' | 'pointbuy' | 'mouse' | 'mausTables' | 'factions' | 'reshape' | 'wildMagic';

export const ui = $state({
  tool: 'notes' as ToolId,
  note: null as string | null,
  // Свёрнутый список под инструментом (записки): повторный щелчок по открытому инструменту.
  folded: null as ToolId | null,
});

// Щелчок по инструменту в боковой панели: открыть его страницу (список развернётся), а если она уже открыта —
// свернуть или развернуть список под ним.
export function pickTool(tool: ToolId) {
  const here = ui.tool === tool && !ui.note;
  ui.folded = here && ui.folded !== tool ? tool : null;
  ui.tool = tool;
  ui.note = null;
}

// Открыть записку в редакторе (из «Раздатки», правой панели или списка записок).
export function editNote(path: string) {
  ui.tool = 'notes';
  ui.note = path;
  ui.folded = null;
  openTab('tools');
}
