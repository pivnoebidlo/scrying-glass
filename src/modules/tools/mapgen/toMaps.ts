// A generated layout → a map of the current adventure: the picture in its maps folder, the grid matching the cells and
// a pin on every room (hidden from the players: the note is the GM's, and it can open the room's fog), creatures as
// tokens, then the Maps tab opens on it, on its pins.
import { openTab } from '../../../renderer/lib/nav';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { roleFolderHere } from '../../../shared/adventures';
import type { MapPin, MapToken } from '../../maps/types';
import { ui as mapsUi } from '../../maps/ui/ui.svelte';
import { layoutPng, roofLayer } from './draw';
import type { MapCover } from '../../maps/types';
import { cellCentre, roomCentre, roomReveal, type Cell, type Landmark, type Layout } from './layout';

export type RoomPin = Pick<MapPin, 'title' | 'note' | 'color'> & Partial<Pick<MapPin, 'icon' | 'cards'>>;
// What else stands on the map: a pin at a cell (a trap), creatures as tokens (the fog hides them until the room opens).
export interface MapExtras {
  pins?: (RoomPin & Cell)[];
  tokens?: (Omit<MapToken, 'id' | 'x' | 'y' | 'hidden'> & Cell)[];
  // A room the players see from the start.
  open?: number;
}

// The middle cell of a landmark's house.
export const landmarkCell = (l: Layout, m: Landmark): Cell => {
  const a = l.houses![m.house]!;
  return { x: a.x + (a.w >> 1), y: a.y + (a.h >> 1) };
};

const hidden = { shown: false };
export const layoutPins = (l: Layout, rooms: RoomPin[], extra: MapExtras['pins'] = []): MapPin[] => [
  ...rooms.slice(0, l.rooms.length).map((p, i) => ({ ...p, id: crypto.randomUUID(), ...roomCentre(l, i), area: roomReveal(l, i), ...hidden })),
  ...extra.map((p) => ({ ...p, id: crypto.randomUUID(), ...cellCentre(l, p), ...hidden })),
];
const layoutTokens = (l: Layout, tokens: MapExtras['tokens'] = []): MapToken[] =>
  tokens.map((t) => ({ ...t, id: crypto.randomUUID(), ...cellCentre(l, t, t.size), hidden: false }));

// false — the adventure has no maps folder to put it in.
export async function layoutToMaps(l: Layout, title: string, rooms: RoomPin[], extras: MapExtras = {}): Promise<boolean> {
  const { tree } = store.state.vault;
  const folder = tree ? roleFolderHere(tree, store.state.adventures, 'maps') : null;
  if (!folder) return false;
  // Roofs go as covers of their own: the GM lifts them in the Maps while the players watch.
  const roofs = await roofLayer(l);
  const path = await window.api.addMapImage(folder.path, title, await layoutPng(l, roofs ? { roofs: false } : {}));
  if (!path) return false;
  const name = path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/i, '');
  const image = roofs ? await window.api.addMapImage(folder.path, name, roofs.png, true) : null;
  const covers: MapCover[] = roofs && image ? roofs.areas.map((area) => ({ id: crypto.randomUUID(), image, area, lifted: false })) : [];
  await dispatch('maps', 'generated', {
    path,
    cells: l.w,
    pins: layoutPins(l, rooms, extras.pins),
    tokens: layoutTokens(l, extras.tokens),
    ...(extras.open === undefined ? {} : { open: roomReveal(l, extras.open) }),
    ...(covers.length ? { covers } : {}),
  });
  mapsUi.selected = path;
  // The list of rooms is open; the hand tool, so that a click on the map adds no pin by accident.
  mapsUi.tab = 'pins';
  mapsUi.tool = 'pan';
  mapsUi.pin = null;
  mapsUi.pinList = true;
  openTab('maps');
  return true;
}
