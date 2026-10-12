export type Fit = 'contain' | 'cover';

// Картинка на весь экран игроков: локация, раздатка, иллюстрация.
export interface SceneState {
  // Путь картинки в хранилище или null, если фона нет.
  background: string | null;
  // contain — вписать целиком (поля заполняются размытой копией), cover — заполнить экран с обрезкой.
  fit: Fit;
  // Притенять фон, когда поверх него показаны портреты.
  dim: boolean;
}
