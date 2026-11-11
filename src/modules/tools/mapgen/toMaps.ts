// A generated layout → a map of the current adventure: the picture in its maps folder, the grid matching the cells and
// a pin on every room (hidden from the players: the note is the GM's, and it can open the room's fog), creatures as
// tokens, then the Maps tab opens on it, on its pins.
import { openTab } from '../../../renderer/lib/nav';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { roleFolderHere } from '../../../shared/adventures';
import type { MapPin, MapToken } from '../../maps/types';
import { ui as mapsUi } from '../../maps/ui/ui.svelte';
import { layoutPng, roofLayer, storeyLayers, storeyOf, underLayers } from './draw';
import { t } from '../../../renderer/lib/i18n.svelte';
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
  // Roofs and storeys go as covers of their own, from the bottom up: the GM lifts them in the Maps while the players watch.
  const roofs = await roofLayer(l);
  const storeys = await storeyLayers(l);
  const path = await window.api.addMapImage(folder.path, title, await layoutPng(l, roofs ? { roofs: false } : {}));
  if (!path) return false;
  const name = path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/i, '');
  const covers: MapCover[] = [];
  // «Name.cover.png» — the map's roofs; «Name.storey2.cover.png», «Name.storey2-roof.cover.png» — a storey and its roofs.
  const layer = async (png: Uint8Array, areas: number[][], suffix: string, title: string, below = false) => {
    const image = await window.api.addMapImage(folder.path, name + suffix, png, true);
    if (image) for (const area of areas) covers.push({ id: crypto.randomUUID(), image, area, title, lifted: false, ...(below ? { below } : {}) });
  };
  // Underground first, from the first level down: shown when the GM goes down («Name.under1.cover.png»).
  for (const u of await underLayers(l)) await layer(u.png, u.areas, `.under${u.k}`, t('mapedit.level.cover', { n: `−${u.k}` }), true);
  if (roofs) await layer(roofs.png, roofs.areas, '', t('mapedit.level.roof'));
  for (const s of storeys) {
    await layer(s.png, s.areas, `.storey${s.n + 1}`, t('mapedit.level.cover', { n: s.n + 1 }));
    const up = await roofLayer(storeyOf(l, s.n));
    if (up) await layer(up.png, up.areas, `.storey${s.n + 1}-roof`, t('mapedit.level.roof'));
  }
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
