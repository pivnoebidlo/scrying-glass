import type { Note } from '../../shared/notes';

export interface HandoutsState {
  // Путь к картинке или записке, которая сейчас у игроков.
  current: string | null;
  // Содержимое записки, если у игроков записка: окно игроков файлов не читает, ядро кладёт её сюда.
  note: Note | null;
}
