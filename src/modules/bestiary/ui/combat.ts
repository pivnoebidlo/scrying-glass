// Добавление существа из карточки в трекер инициативы: из бестиария, вкладки персонажей и кнопки на портрете.
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { sameRef, type CardSide, type CardSummary } from '../../../shared/cards';
import { rollFormula } from './dice';

// «Гоблин», «Гоблин 2», …: нумерация продолжает тех, кто уже в бою.
function names(base: string, n: number): string[] {
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: (\\d+))?$`);
  let max = 0;
  for (const c of store.state.initiative.combatants) {
    const m = re.exec(c.name);
    if (m) max = Math.max(max, m[1] ? Number(m[1]) : 1);
  }
  if (n === 1 && max === 0) return [base];
  return Array.from({ length: n }, (_, i) => `${base} ${max + i + 1}`);
}

export interface AddOptions {
  count?: number;
  // Сторона: по умолчанию — из карточки.
  side?: CardSide;
  // Бросить хиты по формуле для каждого.
  rollHp?: boolean;
}

export async function addToInitiative(c: CardSummary, opts: AddOptions = {}) {
  const n = Math.max(1, Math.min(20, Math.round(opts.count ?? 1) || 1));
  const { hp, ac, initiative, hpFormula } = c.combat;
  // Портреты раздаются по очереди: четыре разбойника и четыре картинки — у каждого своя. Начинаем с той, что
  // ещё меньше всех занята в бою (добавлять можно и по одному).
  const used = new Map(c.images.map((p) => [p, 0]));
  for (const x of store.state.initiative.combatants) {
    if (sameRef(x.card, c.ref) && x.portrait && used.has(x.portrait)) used.set(x.portrait, used.get(x.portrait)! + 1);
  }
  const nextPortrait = () => {
    if (!c.images.length) return null;
    const p = c.images.reduce((best, x) => (used.get(x)! < used.get(best)! ? x : best));
    used.set(p, used.get(p)! + 1);
    return p;
  };
  for (const name of names(c.name, n)) {
    const portrait = nextPortrait();
    const maxHp = opts.rollHp && hpFormula ? (rollFormula(hpFormula) ?? hp) : hp;
    await dispatch('initiative', 'add', {
      c: { name, maxHp, ac, bonus: initiative, side: opts.side ?? c.side, card: c.ref, portrait },
    });
  }
}
