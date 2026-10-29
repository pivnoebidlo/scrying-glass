// A card is one tile in «Characters», at its main portrait: its other portraits are hidden while the main one
// is in the same folder (they are still in Files and in the card).
import { bestiary } from '../../bestiary/ui/cards.svelte';
import type { Group } from '../library';

export function cardTiles(groups: Group[]): Group[] {
  return groups.map((g) => {
    const here = new Set(g.items.map((f) => f.path));
    const extra = (path: string) => {
      const card = bestiary.cardFor(path);
      return !!card && card.images[0] !== path && here.has(card.images[0]!);
    };
    return { ...g, items: g.items.filter((f) => !extra(f.path)) };
  });
}
