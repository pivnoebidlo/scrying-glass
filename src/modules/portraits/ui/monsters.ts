// Монстры приключения для вкладки «Персонажи»: карточки монстров из папок бестиария текущего приключения
// и общих, сгруппированные по месту. Ключ группы начинается с «monsters:», чтобы не путать с папками портретов.
import type { CardSummary } from '../../../shared/cards';
import { placeOrder, placeTitle, visibleIn, type AdventuresState } from '../../../shared/adventures';
import { dirname } from '../../../shared/vault';
import { groupId } from '../../bestiary/ui/cards.svelte';

export interface MonsterGroup {
  key: string;
  title: string;
  order: number;
  items: CardSummary[];
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

// Переводы одного монстра — одна плитка: версия на языке lang, иначе оригинал.
export function monsterGroups(all: CardSummary[], adv: AdventuresState, vaultName: string, lang = 'ru'): MonsterGroup[] {
  const own = all.filter((c) => c.ref.scope === 'vault' && c.kind === 'monster' && c.folder !== undefined && visibleIn(adv, c.folder));
  const byGroup = new Map<string, CardSummary[]>();
  for (const c of own) byGroup.set(groupId(c), [...(byGroup.get(groupId(c)) ?? []), c]);
  const picked = [...byGroup.values()].map((g) => g.find((c) => c.lang === lang) ?? g.find((c) => !c.origin) ?? g[0]!);

  const groups = new Map<string, MonsterGroup>();
  for (const c of picked) {
    if (c.folder === undefined) continue;
    const key = 'monsters:' + c.folder;
    const dir = dirname(c.folder);
    if (!groups.has(key)) groups.set(key, { key, title: `${placeTitle(adv, dir, vaultName)} · монстры`, order: placeOrder(adv, dir), items: [] });
    groups.get(key)!.items.push(c);
  }
  for (const g of groups.values()) g.items.sort((a, b) => collator.compare(a.name, b.name));
  return [...groups.values()].sort((a, b) => a.order - b.order || collator.compare(a.title, b.title));
}
