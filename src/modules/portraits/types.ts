// Портреты — картинки хранилища или библиотеки карточек. Портрет определяется путём: внутри хранилища
// или «library:…» (см. shared/vault.ts).
import type { NoteFont } from '../../shared/notes';

export interface PortraitsState {
  // Пути картинок, которые сейчас на экране игроков, в порядке появления.
  onScreen: string[];
  // Подписи прежних версий, заданные вручную (новые не заводятся: подпись — название карточки или имя файла).
  names: Record<string, string>;
  showNames: boolean;
  // Portraits whose name the players don't know: their caption on the player screen is «???».
  unknown: string[];
  // Как выглядит подпись у игроков.
  plate: NamePlate;
}

// Подложка под именем: тень (просто текст), лента, свиток, табличка. color — цвет ткани ленты, чернил свитка,
// таблички или самого текста (у тени); font — шрифт записок или '' (Georgia).
export interface NamePlate {
  style: PlateStyle;
  color: string;
  font: NoteFont | '';
}

// Titles — portraits.plate.<style> in the dictionary.
export const PLATE_STYLES = { shadow: true, ribbon: true, scroll: true, plaque: true } as const;
export type PlateStyle = keyof typeof PLATE_STYLES;


// Цвет по умолчанию для стиля (когда его выбирают впервые).
export const PLATE_DEFAULT_COLOR: Record<PlateStyle, string> = { shadow: '#ffffff', ribbon: '#8e1a16', scroll: '#3b2412', plaque: '#2b2118' };

export const PLATE_COLORS = ['#ffffff', '#f2ead8', '#c9a24a', '#8e1a16', '#4e2a6b', '#26407a', '#2f5d3a', '#3b2412', '#2b2118', '#17120e'];

export const DEFAULT_PLATE: NamePlate = { style: 'shadow', color: '#ffffff', font: '' };
