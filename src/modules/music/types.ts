export type Repeat = 'all' | 'one' | 'off';

export interface AmbientLoop {
  path: string;
  volume: number; // 0..1
}

// Музыка и атмосфера. Здесь только «что должно играть»: сам звук и позиция в треке живут в окне управления.
export interface MusicState {
  // Папка, из которой собрана очередь (null — очереди нет).
  playlist: string | null;
  // Пути треков в порядке проигрывания (перемешанном, если включено shuffle).
  queue: string[];
  index: number;
  playing: boolean;
  // Растёт при каждом запуске трека с начала, в том числе того же самого (повтор одного трека).
  seq: number;
  volume: number; // 0..1
  repeat: Repeat;
  shuffle: boolean;
  // Длительность перехода между треками, секунды. 0 — без перехода.
  crossfade: number;

  ambience: AmbientLoop[];
  ambiencePlaying: boolean;
  ambienceVolume: number; // общий множитель 0..1
}
