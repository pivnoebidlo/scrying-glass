// Быстрое добавление в бой и в заготовку: подсказки по карточкам и вся партия приключения разом.
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import type { CardSummary } from '../../../shared/cards';
import { sameRef } from '../../../shared/cards';
import { visibleIn } from '../../../shared/adventures';
import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
import { addToInitiative } from '../../bestiary/ui/combat';
import { caption, imageGroups } from '../../portraits/library';

const MAX = 12;

// Подсказки по имени: точное совпадение, потом начало имени, потом середина; при равных — сначала карточки
// приключения (и общие): монстры, NPC, партия; потом библиотека и SRD на языке фильтра бестиария.
export function suggest(query: string): CardSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const adv = store.state.adventures;
  const lang = bestiary.filters.lang === 'all' ? 'ru' : bestiary.filters.lang;
  const rank = (c: CardSummary) => {
    const n = c.name.toLowerCase();
    const match = n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : -1;
    if (match < 0) return -1;
    const own = c.ref.scope === 'vault' && c.folder !== undefined && visibleIn(adv, c.folder);
    if (!own && (c.ref.scope === 'vault' || c.lang !== lang)) return -1;
    return match * 3 + (own ? 0 : c.ref.scope === 'library' ? 1 : 2);
  };
  return bestiary.all
    .map((c) => ({ c, r: rank(c) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.c.name.localeCompare(b.c.name, 'ru'))
    .slice(0, MAX)
    .map((x) => x.c);
}

// Вся партия текущего приключения, кого ещё нет в бою (или в заготовке): карточки персонажей игроков
// и портреты из папок партии без карточки. Возвращает, сколько добавлено.
export async function addParty(encounter?: string): Promise<number> {
  await connectCards();
  const app = store.state;
  const list = () => {
    const s = store.state.initiative;
    return encounter ? (s.encounters.find((e) => e.id === encounter)?.combatants ?? []) : s.combatants;
  };
  let added = 0;
  const cards = bestiary.all.filter(
    (c) => c.kind === 'character' && c.ref.scope === 'vault' && c.folder !== undefined && visibleIn(app.adventures, c.folder)
  );
  for (const c of cards) {
    if (list().some((x) => sameRef(x.card, c.ref))) continue;
    await addToInitiative(c, { encounter, side: 'party' });
    added++;
  }
  const tree = app.vault.tree;
  const portraits = tree ? imageGroups(tree, app.vault.name, 'party', app.adventures).flatMap((g) => g.items.map((f) => f.path)) : [];
  for (const path of portraits) {
    if (bestiary.cardFor(path) || list().some((x) => x.portrait === path)) continue;
    await dispatch('initiative', 'add', { c: { name: caption(app.portraits, path), portrait: path, side: 'party' }, encounter });
    added++;
  }
  return added;
}
