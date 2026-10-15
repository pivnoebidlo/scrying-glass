// Журнал мастера: заметки — Markdown-файлы в папках журнала (shared/journal.ts), их читает и пишет ядро
// (main/journal.ts). В состоянии — только закреплённая заметка каждого приключения: она видна в правой панели.
import { defineModule } from '../../shared/module';

export interface JournalState {
  // Приключение ('' — всё хранилище) -> путь закреплённой заметки. Пропавший файл просто не показывается.
  pinned: Record<string, string>;
}

const initialState: JournalState = { pinned: {} };

// Путь после переноса: сам файл или что-то внутри перенесённой папки.
const moved = (p: string, from: string, to: string) => (p === from ? to : p.startsWith(from + '/') ? to + p.slice(from.length) : p);

export default defineModule({
  id: 'journal',
  persist: true,
  initialState,

  actions: {
    // Закрепить заметку в правой панели (null — открепить).
    pin(s, { adventure, path }: { adventure: string | null; path: string | null }) {
      const pinned = { ...s.pinned };
      if (path) pinned[adventure ?? ''] = path;
      else delete pinned[adventure ?? ''];
      return { ...s, pinned };
    },

    // Заметку или папку переименовали или перенесли (ядро, journal:rename / journal:move).
    move(s, { from, to }: { from: string; to: string }) {
      const pinned = Object.fromEntries(Object.entries(s.pinned).map(([k, p]) => [k, moved(p, from, to)]));
      return { ...s, pinned };
    },
  },
});
