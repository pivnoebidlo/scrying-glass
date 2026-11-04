// A generated layout → a map of the current adventure: the picture in its maps folder, the grid matching the cells and
// a pin on every room (hidden from the players: the note is the GM's), then the Maps tab opens on it.
import { openTab } from '../../../renderer/lib/nav';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { roleFolderHere } from '../../../shared/adventures';
import type { MapPin } from '../../maps/types';
import { ui as mapsUi } from '../../maps/ui/ui.svelte';
import { layoutPng } from './draw';
import { roomCentre, type Layout } from './layout';

export type RoomPin = Pick<MapPin, 'title' | 'note' | 'color'> & Partial<Pick<MapPin, 'icon' | 'cards'>>;

export const layoutPins = (l: Layout, rooms: RoomPin[]): MapPin[] => rooms.slice(0, l.rooms.length).map((p, i) => ({ ...p, id: crypto.randomUUID(), ...roomCentre(l, i), shown: false }));

// false — the adventure has no maps folder to put it in.
export async function layoutToMaps(l: Layout, title: string, rooms: RoomPin[]): Promise<boolean> {
  const { tree } = store.state.vault;
  const folder = tree ? roleFolderHere(tree, store.state.adventures, 'maps') : null;
  if (!folder) return false;
  const path = await window.api.addMapImage(folder.path, title, await layoutPng(l));
  if (!path) return false;
  await dispatch('maps', 'generated', { path, cells: l.w, pins: layoutPins(l, rooms) });
  mapsUi.selected = path;
  mapsUi.tab = 'fog';
  openTab('maps');
  return true;
}
