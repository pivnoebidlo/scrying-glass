// Журнал мастера: заметки — Markdown-файлы в папках журнала (shared/journal.ts), их читает и пишет ядро
// (main/journal.ts). В состоянии — только закреплённые заметки и PDF каждого приключения: они видны в правой панели.
import { defineModule } from '../../shared/module';

export interface JournalState {
  // Приключение ('' — всё хранилище) -> пути закреплённых заметок и PDF, по порядку закрепления. Пропавший файл
  // просто не показывается. Before 0.56 — one path.
  pinned: Record<string, string[]>;
}

const initialState: JournalState = { pinned: {} };

// Путь после переноса: сам файл или что-то внутри перенесённой папки.
const moved = (p: string, from: string, to: string) => (p === from ? to : p.startsWith(from + '/') ? to + p.slice(from.length) : p);
const key = (adventure: string | null) => adventure ?? '';
const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : typeof v === 'string' && v ? [v] : []);

export default defineModule({
  id: 'journal',
  persist: true,
  initialState,

  // Old saves: one pinned note per adventure.
  init: (s) => ({ ...initialState, ...s, pinned: Object.fromEntries(Object.entries(s.pinned ?? {}).map(([k, v]) => [k, list(v)])) }),

  actions: {
    // Закрепить заметку или PDF в правой панели (к уже закреплённым).
    pin(s, { adventure, path }: { adventure: string | null; path: string }) {
      const now = s.pinned[key(adventure)] ?? [];
      return now.includes(path) ? s : { ...s, pinned: { ...s.pinned, [key(adventure)]: [...now, path] } };
    },

    unpin(s, { adventure, path }: { adventure: string | null; path: string }) {
      const now = (s.pinned[key(adventure)] ?? []).filter((p) => p !== path);
      const pinned = { ...s.pinned, [key(adventure)]: now };
      if (!now.length) delete pinned[key(adventure)];
      return { ...s, pinned };
    },

    // Заметку или папку переименовали или перенесли (ядро, journal:rename / journal:move).
    move(s, { from, to }: { from: string; to: string }) {
      const pinned = Object.fromEntries(Object.entries(s.pinned).map(([k, ps]) => [k, ps.map((p) => moved(p, from, to))]));
      return { ...s, pinned };
    },
  },
});
