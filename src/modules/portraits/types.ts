// Портреты — картинки хранилища или библиотеки карточек. Портрет определяется путём: внутри хранилища
// или «library:…» (см. shared/vault.ts).
import type { NoteFont } from '../../shared/notes';

export interface PortraitsState {
  // Пути картинок, которые сейчас на экране игроков, в порядке появления.
  onScreen: string[];
  // Подписи прежних версий, заданные вручную (новые не заводятся: подпись — название карточки или имя файла).
  names: Record<string, string>;
  showNames: boolean;
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

export const PLATE_STYLES = { shadow: 'Тень', ribbon: 'Лента', scroll: 'Свиток', plaque: 'Табличка' } as const;
export type PlateStyle = keyof typeof PLATE_STYLES;

// Что значит цвет у каждого стиля — подпись в настройках.
export const PLATE_COLOR_TITLE: Record<PlateStyle, string> = { shadow: 'Цвет текста', ribbon: 'Цвет ленты', scroll: 'Цвет чернил', plaque: 'Цвет таблички' };

// Цвет по умолчанию для стиля (когда его выбирают впервые).
export const PLATE_DEFAULT_COLOR: Record<PlateStyle, string> = { shadow: '#ffffff', ribbon: '#8e1a16', scroll: '#3b2412', plaque: '#2b2118' };

export const PLATE_COLORS = ['#ffffff', '#f2ead8', '#c9a24a', '#8e1a16', '#4e2a6b', '#26407a', '#2f5d3a', '#3b2412', '#2b2118', '#17120e'];

export const DEFAULT_PLATE: NamePlate = { style: 'shadow', color: '#ffffff', font: '' };
