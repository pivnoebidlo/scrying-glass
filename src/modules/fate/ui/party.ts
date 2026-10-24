// Персонажи партии текущего приключения (карточки Fate в папках партии) — для жетонов судьбы. Восстановление —
// из карточки. Список карточек — $state.raw, его можно передавать через IPC как есть.
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { visibleIn, inCurrentFamily } from '../../../shared/adventures';
import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';

// Возвращает, сколько персонажей в списке после добавления (новых и обновлённых).
export async function addParty(): Promise<number> {
  await connectCards();
  const adv = store.state.adventures;
  const cards = bestiary.all.filter(
    (c) => c.kind === 'character' && c.ref.scope === 'vault' && c.folder !== undefined && visibleIn(adv, c.folder) && inCurrentFamily(adv, c.system)
  );
  const list = [];
  for (const c of cards) {
    const card = await window.api.getCard(c.ref);
    // The pack's «refresh» field (none — 3, as the rules start a character).
    const r = (card?.stats as { refresh?: unknown } | undefined)?.refresh;
    const refresh = typeof r === 'number' ? r : 3;
    list.push({ name: c.name, portrait: c.images[0] ?? null, card: c.ref, refresh });
  }
  if (list.length) await dispatch('fate', 'addHolders', { list });
  return list.length;
}
