// Что открыто в «Инструментах»: инструмент и записка в редакторе (путь в хранилище).
import { openTab } from '../../../renderer/lib/nav';
import { isSketchPath } from '../../../shared/sketch';

// The core's tools; a system plugin adds its own (SystemUi.tools in systems/ui.ts) — any id.
export type ToolId = 'notes' | 'sketches' | 'names' | 'npc' | 'tavern' | 'settlement' | 'schedule' | 'telegram' | 'timer' | 'mouse' | 'mausTables' | 'factions' | 'crew' | 'systems' | 'rollTables' | 'build' | 'mausShop' | (string & {});

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

// Открыть записку в редакторе (из «Раздатки», правой панели или списка записок); a canvas — in its own.
export function editNote(path: string) {
  ui.tool = isSketchPath(path) ? 'sketches' : 'notes';
  ui.note = path;
  ui.folded = null;
  openTab('tools');
}
