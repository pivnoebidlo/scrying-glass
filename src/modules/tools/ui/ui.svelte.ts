// Что открыто в «Инструментах»: инструмент, записка в редакторе (путь в хранилище), таблица (id из tables/store).
import { openTab } from '../../../renderer/lib/nav';

export type ToolId = 'notes' | 'tables' | 'names' | 'npc' | 'tavern' | 'weather' | 'events' | 'treasure' | 'settlement' | 'telegram' | 'difficulty' | 'timer' | 'pointbuy';

export const ui = $state({
  tool: 'notes' as ToolId,
  note: null as string | null,
  table: null as string | null,
  // Свёрнутый список под инструментом (записки, таблицы): повторный щелчок по открытому инструменту.
  folded: null as ToolId | null,
});

// Щелчок по инструменту в боковой панели: открыть его страницу (список развернётся), а если она уже открыта —
// свернуть или развернуть список под ним.
export function pickTool(tool: ToolId) {
  const here = ui.tool === tool && !ui.note && !ui.table;
  ui.folded = here && ui.folded !== tool ? tool : null;
  ui.tool = tool;
  ui.note = null;
  ui.table = null;
}

// Открыть записку в редакторе (из «Раздатки», правой панели или списка записок).
export function editNote(path: string) {
  ui.tool = 'notes';
  ui.note = path;
  ui.folded = null;
  openTab('tools');
}
