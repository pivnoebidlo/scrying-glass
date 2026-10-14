// Что окно знает о карточках для расчёта сложности: уровень персонажа игрока, опыт монстра, партия приключения.
import type { AppState } from '../../../shared/types';
import { sameRef, type CardRef } from '../../../shared/cards';
import { visibleIn } from '../../../shared/adventures';
import { bestiary } from '../../bestiary/ui/cards.svelte';
import type { CardInfo, Hero } from '../difficulty';

export function cardInfo(ref: CardRef | null | undefined): CardInfo | undefined {
  const card = ref ? bestiary.all.find((x) => sameRef(x.ref, ref)) : undefined;
  if (!card) return undefined;
  return card.kind === 'character' ? { level: card.rank ?? undefined } : { xp: card.combat.xp };
}

// Персонажи игроков текущего приключения (карточки с листом в папках партии).
export const adventureHeroes = (app: AppState): Hero[] =>
  bestiary.all
    .filter((c) => c.kind === 'character' && c.ref.scope === 'vault' && c.folder !== undefined && visibleIn(app.adventures, c.folder))
    .map((c) => ({ name: c.name, level: c.rank }));
