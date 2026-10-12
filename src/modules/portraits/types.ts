// Портрет из подключённой папки: файл читается с диска на месте.
export interface FolderPortrait {
  id: string;
  name: string;
  groupId: string;
  path: string;
}

// Портрет, добавленный вручную: копия лежит в папке кампании (assets/<file>).
export interface ManualPortrait {
  id: string;
  name: string;
  file: string;
}

export type Portrait = FolderPortrait | ManualPortrait;

// Подключённая папка приключения.
export interface PortraitGroup {
  id: string;
  name: string;
  path: string;
}

export interface PortraitsState {
  library: Portrait[];
  groups: PortraitGroup[];
  onScreen: string[];
  showNames: boolean;
}

export const isFromFolder = (p: Portrait): p is FolderPortrait => 'path' in p;
