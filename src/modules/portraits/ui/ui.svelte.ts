// Состояние интерфейса портретов в окне управления (не сохраняется в кампанию).
import type { Portrait, PortraitsState } from '../types';
import { isFromFolder } from '../types';

// 'all' — все портреты, 'manual' — добавленные вручную, иначе id подключённой папки.
export const ui = $state({ group: 'all', search: '' });

export interface Section {
  key: string;
  title: string;
  hint: string;
  items: Portrait[];
}

// Секции библиотеки: подключённые папки + «вручную».
export function sections(ms: PortraitsState): Section[] {
  const out: Section[] = ms.groups.map((g) => ({
    key: g.id,
    title: g.name,
    hint: g.path,
    items: ms.library.filter((p) => isFromFolder(p) && p.groupId === g.id),
  }));
  const manual = ms.library.filter((p) => !isFromFolder(p));
  if (manual.length) out.push({ key: 'manual', title: 'Добавлены вручную', hint: '', items: manual });
  return out;
}
