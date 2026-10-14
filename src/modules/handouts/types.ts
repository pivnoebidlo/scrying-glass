import type { Note } from '../../shared/notes';
import type { Entry } from '../../shared/compendium';

export interface HandoutsState {
  // Путь к картинке или записке, которая сейчас у игроков.
  current: string | null;
  // Содержимое записки, если у игроков записка: окно игроков файлов не читает, ядро кладёт её сюда.
  note: Note | null;
  // Запись справочника, если у игроков она (окно передаёт её целиком: запись может лежать в библиотеке).
  entry?: Entry | null;
}
