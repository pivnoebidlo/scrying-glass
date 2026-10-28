// The menu of a card in a list (a right click, «⋯»): the same actions as the buttons of the card's view.
import { ArrowRightLeft, Copy, Pencil, Swords, Trash2, Upload } from '@lucide/svelte';
import type { MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
import { t } from '../../../renderer/lib/i18n.svelte';
import type { CardSummary } from '../../../shared/cards';
import { bestiary } from './cards.svelte';
import { addToInitiative } from './combat';

export function cardMenu(c: CardSummary): MenuItem[] {
  const ref = $state.snapshot(c.ref);
  const own = ref.scope !== 'srd';
  return [
    { label: t('best.edit'), icon: Pencil, action: () => void bestiary.edit(ref) },
    { label: t('best.makeCopy'), icon: Copy, action: () => void bestiary.copy(ref) },
    ...(own ? [{ label: t('best.move'), icon: ArrowRightLeft, action: () => void bestiary.move(ref) }] : []),
    { label: t('best.toInitiative'), icon: Swords, action: () => void addToInitiative(c) },
    { label: t('best.exportShort'), icon: Upload, action: () => void window.api.exportCards({ refs: [ref], name: c.name }) },
    ...(own ? [{ label: t('best.delete'), icon: Trash2, danger: true, action: () => void bestiary.remove(ref) }] : []),
  ];
}
