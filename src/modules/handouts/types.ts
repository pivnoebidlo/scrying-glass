import type { Note } from '../../shared/notes';
import type { Sketch } from '../../shared/sketch';
import type { Entry } from '../../shared/compendium';
import { refKey, type Card, type CardRef } from '../../shared/cards';

export interface HandoutsState {
  // Путь к картинке или записке, которая сейчас у игроков.
  current: string | null;
  // Содержимое записки, если у игроков записка: окно игроков файлов не читает, ядро кладёт её сюда.
  note: Note | null;
  // The same for a canvas.
  sketch?: Sketch | null;
  // Запись справочника, если у игроков она (окно передаёт её целиком: запись может лежать в библиотеке).
  entry?: Entry | null;
  // A card's sheet, if the players have one: the core rereads it from its ref after every change of cards.
  card?: Card | null;
}

// A sheet on the players' screen is shown under this path: card:<scope>:<id>.
export const CARD_HANDOUT = 'card:';
export const cardHandout = (ref: CardRef) => CARD_HANDOUT + refKey(ref);
export function handoutRef(path: string): CardRef | null {
  if (!path.startsWith(CARD_HANDOUT)) return null;
  const rest = path.slice(CARD_HANDOUT.length);
  const at = rest.indexOf(':');
  const scope = rest.slice(0, at);
  return at > 0 && (scope === 'vault' || scope === 'library' || scope === 'srd') ? { scope, id: rest.slice(at + 1) } : null;
}
