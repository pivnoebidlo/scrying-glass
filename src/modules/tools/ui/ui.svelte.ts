// Что открыто в «Инструментах»: инструмент и записка в редакторе (путь в хранилище).
import { openTab } from '../../../renderer/lib/nav';

export type ToolId = 'notes';

export const ui = $state({
  tool: 'notes' as ToolId,
  note: null as string | null,
});

// Открыть записку в редакторе (из «Раздатки», правой панели или списка записок).
export function editNote(path: string) {
  ui.tool = 'notes';
  ui.note = path;
  openTab('tools');
}
