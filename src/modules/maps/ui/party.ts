// The party of the current adventure as map tokens: player character cards and portraits of the party folders.
import type { AppState } from '../../../shared/types';
import { visibleIn } from '../../../shared/adventures';
import { cardAsset } from '../../../shared/cards';
import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
import { caption, imageGroups } from '../../portraits/library';
import type { MapToken } from '../types';

export type PartyToken = Pick<MapToken, 'size' | 'name' | 'portrait' | 'side' | 'hidden'>;

export async function partyTokens(app: Pick<AppState, 'adventures' | 'vault' | 'portraits'>): Promise<PartyToken[]> {
  await connectCards();
  const list: PartyToken[] = [];
  for (const c of bestiary.all) {
    if (c.kind !== 'character' || c.ref.scope !== 'vault' || c.folder === undefined || !visibleIn(app.adventures, c.folder)) continue;
    list.push({ size: 1, name: c.name, portrait: c.portrait ? cardAsset(c.ref.scope, c.portrait) : null, side: 'party', hidden: false });
  }
  const tree = app.vault.tree;
  for (const g of tree ? imageGroups(tree, app.vault.name, 'party', app.adventures) : []) {
    for (const f of g.items) {
      if (!bestiary.cardFor(f.path)) list.push({ size: 1, name: caption(app.portraits, f.path), portrait: f.path, side: 'party', hidden: false });
    }
  }
  return list;
}
