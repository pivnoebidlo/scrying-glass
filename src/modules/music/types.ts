export type Repeat = 'all' | 'one' | 'off';

// What played before a fight, to come back to after it.
export interface BeforeFight {
  playlist: string | null;
  queue: string[];
  index: number;
  playing: boolean;
}

export interface AmbientLoop {
  path: string;
  volume: number; // 0..1
}

// Музыка и атмосфера. Здесь только «что должно играть»: сам звук и позиция в треке живут в окне управления.
export interface MusicState {
  // Папка, из которой собрана очередь, или путь трека, если играет один трек (playTrack); null — очереди нет.
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

  // Music of a fight by adventure ('' — the whole vault): a folder or one track. It plays from the first round of a
  // fight in the initiative tracker to its end; then what played before comes back, from where it was.
  battle: Record<string, string>;
  // What played before the fight; null — no fight music is on now (or the GM chose other music during the fight).
  beforeFight: BeforeFight | null;
  // The seq of the track that goes on from where it stopped (the window remembers where); -1 — none.
  resume: number;

  ambience: AmbientLoop[];
  ambiencePlaying: boolean;
  ambienceVolume: number; // общий множитель 0..1
}
