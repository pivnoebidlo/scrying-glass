// Корзина приложения (main/trash.ts): что удалено, откуда и когда. Общее для ядра и окон.

// Где лежало: в хранилище или в библиотеке (общей для всех кампаний). У каждого места — своя корзина.
export type TrashPlace = 'vault' | 'library';
// file — файл, folder — папка, card — карточка (файл и её картинки), adventure — приключение (папка и его
// сцены, заготовки боёв и разметка карт).
export type TrashKind = 'file' | 'folder' | 'card' | 'adventure';

export interface TrashMeta {
  // Как показать: имя файла, название карточки или приключения.
  title: string;
  kind: TrashKind;
  // Что удалено: пути от корня места, как они были (первый — главный).
  paths: string[];
  // Когда удалено (мс).
  deleted: number;
  // Что вернуть в приложение вместе с файлами (например, сцены удалённого приключения).
  data?: unknown;
}

export interface TrashItem extends Omit<TrashMeta, 'data'> {
  id: string;
  place: TrashPlace;
  // Размер на диске (байт).
  size: number;
}

// Настройки корзины (settings.json приложения, общие для всех хранилищ). keep: false — удалять сразу, без корзины;
// days — через сколько дней удалённое уходит из корзины насовсем (0 — никогда).
export interface TrashSettings {
  keep: boolean;
  days: number;
}
export const TRASH_DEFAULTS: TrashSettings = { keep: true, days: 0 };
