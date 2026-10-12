// Бестиарий в окне управления: краткий список карточек из ядра, фильтры и выбранная карточка.
// Фильтры запоминаются между запусками (в окне, не в хранилище).
import type { Card, CardRef, CardScope, CardSummary } from '../../../shared/cards';
import { sameRef } from '../../../shared/cards';
import { openTab } from '../../../renderer/lib/nav';

const KEY = 'sg.bestiary';

interface Filters {
  search: string;
  // 'all' или id системы.
  system: string;
  // Язык, который показывать в первую очередь: у переведённых карточек видна только одна версия.
  // 'all' — все версии подряд.
  lang: string;
  scope: CardScope | 'all';
}

function load(): Partial<Filters> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
const fold = (s: string) => s.normalize('NFC').toLowerCase().replace(/ё/g, 'е');

// Оригинал и его переводы — одна группа.
export const groupId = (c: CardSummary) => (c.origin?.relation === 'translation' ? c.origin.id : c.ref.id);

class Bestiary {
  all = $state.raw<CardSummary[]>([]);
  // raw: ссылка уходит в ядро через IPC, а реактивный прокси туда не передать.
  selected = $state.raw<CardRef | null>(null);
  // Полная выбранная карточка (null — не выбрана или ещё грузится).
  card = $state.raw<Card | null>(null);
  filters = $state<Filters>({ search: '', system: 'all', lang: 'ru', scope: 'all', ...load() });

  // Все версии одной карточки (оригинал и переводы) в том же месте хранения.
  groups = $derived.by(() => {
    const m = new Map<string, CardSummary[]>();
    for (const c of this.all) {
      const k = `${c.ref.scope}:${groupId(c)}`;
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return m;
  });

  visible = $derived.by(() => {
    const f = this.filters;
    const q = fold(f.search.trim());
    const out: CardSummary[] = [];
    for (const group of this.groups.values()) {
      const first = group[0]!;
      if (f.system !== 'all' && first.system !== f.system) continue;
      if (f.scope !== 'all' && first.ref.scope !== f.scope) continue;
      // Ищем по всем версиям: «goblin» найдёт и «Гоблина».
      if (q && !group.some((c) => fold(c.name).includes(q))) continue;
      if (f.lang === 'all') out.push(...group);
      else out.push(group.find((c) => c.lang === f.lang) ?? group.find((c) => !c.origin) ?? first);
    }
    return out.sort((a, b) => collator.compare(a.name, b.name));
  });

  // Другие версии выбранной карточки (для переключателя языка).
  versions = $derived.by(() => {
    const cur = this.all.find((c) => sameRef(c.ref, this.selected));
    return cur ? (this.groups.get(`${cur.ref.scope}:${groupId(cur)}`) ?? [cur]) : [];
  });

  select(ref: CardRef | null) {
    this.selected = ref && { scope: ref.scope, id: ref.id };
  }

  // Открыть карточку во вкладке бестиария (например, из трекера инициативы).
  show(ref: CardRef) {
    this.select(ref);
    openTab('bestiary');
  }
}

export const bestiary = new Bestiary();

async function refresh() {
  bestiary.all = await window.api.listCards();
}

// Список грузится при первом показе бестиария, а не при запуске: этот файл попадает и в окно игроков.
let connected = false;
export function connectCards() {
  if (connected) return;
  connected = true;
  window.api.onCardsChanged(refresh);
  refresh();
}

$effect.root(() => {
  // Запоминаем фильтры.
  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(bestiary.filters));
    } catch {
      /* не страшно */
    }
  });

  // Подгружаем полную карточку при выборе.
  $effect(() => {
    const ref = bestiary.selected;
    bestiary.card = null;
    if (!ref) return;
    let stale = false;
    window.api.getCard(ref).then((c) => {
      if (!stale) bestiary.card = c;
    });
    return () => (stale = true);
  });
});
