// Бестиарий в окне управления: краткий список карточек из ядра, фильтры и выбранная карточка.
// Фильтры запоминаются между запусками (в окне, не в хранилище).
import type { Card, CardRef, CardScope, CardSummary } from '../../../shared/cards';
import { untrack } from 'svelte';
import { langName, sameRef } from '../../../shared/cards';
import { openTab } from '../../../renderer/lib/nav';
import { systemOf } from '../../../systems';

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

// Открытая в редакторе карточка. original — что правим (null — новая или копия).
export interface Draft {
  scope: CardScope;
  card: Card;
  original: CardRef | null;
}

// Карточку без значений превращаем в аккуратный файл: пустые необязательные поля не сохраняем.
function clean(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      if (x === undefined || x === null || (x === '' && k !== 'text' && k !== 'notes' && k !== 'name')) continue;
      out[k] = clean(x);
    }
    return out;
  }
  return v;
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
const fold = (s: string) => s.normalize('NFC').toLowerCase().replace(/ё/g, 'е');

// Оригинал и его переводы — одна группа, даже если перевод лежит в другом месте (перевод SRD-монстра
// в библиотеке). id карточек разных мест не пересекаются: у встроенных приставка srd51-/srd52-,
// у своих — случайный хвост.
export const groupId = (c: CardSummary) => (c.origin?.relation === 'translation' ? c.origin.id : c.ref.id);

class Bestiary {
  all = $state.raw<CardSummary[]>([]);
  // raw: ссылка уходит в ядро через IPC, а реактивный прокси туда не передать.
  selected = $state.raw<CardRef | null>(null);
  // Полная выбранная карточка (null — не выбрана или ещё грузится).
  card = $state.raw<Card | null>(null);
  // Для какой ссылки загружена card (card = null при cardRef — карточки нет: удалили или перенесли).
  cardRef = $state.raw<CardRef | null>(null);
  filters = $state<Filters>({ search: '', system: 'all', lang: 'ru', scope: 'all', ...load() });
  // Меняется при каждом обновлении карточек в ядре: выбранную надо перечитать.
  rev = $state(0);
  draft = $state<Draft | null>(null);
  // Снимок черновика при открытии: есть ли несохранённые изменения.
  draftStart = '';

  // Все версии одной карточки: оригинал и переводы.
  groups = $derived.by(() => {
    const m = new Map<string, CardSummary[]>();
    for (const c of this.all) {
      const k = groupId(c);
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return m;
  });

  // Языки, на которых есть карточки (для фильтра).
  langs = $derived([...new Set(this.all.map((c) => c.lang))].sort((a, b) => (a === 'ru' ? -1 : b === 'ru' ? 1 : a.localeCompare(b))));

  visible = $derived.by(() => {
    const f = this.filters;
    const q = fold(f.search.trim());
    const out: CardSummary[] = [];
    for (const group of this.groups.values()) {
      const members = group.filter(
        (c) => (f.system === 'all' || c.system === f.system) && (f.scope === 'all' || c.ref.scope === f.scope)
      );
      if (!members.length) continue;
      // Ищем по всем версиям: «goblin» найдёт и «Гоблина».
      if (q && !group.some((c) => fold(c.name).includes(q))) continue;
      if (f.lang === 'all') out.push(...members);
      else out.push(members.find((c) => c.lang === f.lang) ?? members.find((c) => !c.origin) ?? members[0]!);
    }
    return out.sort((a, b) => collator.compare(a.name, b.name));
  });

  // Другие версии выбранной карточки (для переключателя языка).
  versions = $derived.by(() => {
    const cur = this.all.find((c) => sameRef(c.ref, this.selected));
    // Оригинал первым, переводы — по названию языка.
    const list = cur ? (this.groups.get(groupId(cur)) ?? [cur]) : [];
    return [...list].sort((a, b) => Number(!!a.origin) - Number(!!b.origin) || langName(a.lang).localeCompare(langName(b.lang)));
  });

  select(ref: CardRef | null) {
    this.selected = ref && { scope: ref.scope, id: ref.id };
  }

  // Открыть карточку во вкладке бестиария (например, из трекера инициативы).
  show(ref: CardRef) {
    this.select(ref);
    openTab('bestiary');
  }

  // ---------- Редактор ----------

  private open(d: Draft) {
    this.draft = d;
    this.draftStart = JSON.stringify(d.card);
  }

  get dirty() {
    return !!this.draft && JSON.stringify(this.draft.card) !== this.draftStart;
  }

  // Новая карточка: система и язык — из фильтров, если они выбраны.
  create(scope: CardScope) {
    const system = this.filters.system !== 'all' ? this.filters.system : 'dnd5e-2024';
    const lang = this.filters.lang !== 'all' ? this.filters.lang : 'ru';
    this.open({
      scope,
      original: null,
      card: { format: 1, id: '', kind: 'monster', system, lang, name: '', portraits: [], tags: [], notes: '', stats: systemOf(system).blank() },
    });
  }

  async edit(ref: CardRef) {
    const c = await window.api.getCard(ref);
    if (c && ref.scope !== 'srd') this.open({ scope: ref.scope, original: ref, card: structuredClone(c) });
  }

  // Копия в библиотеку или кампанию: открывается в редакторе, файл появится при сохранении.
  async copy(ref: CardRef, to: CardScope) {
    const c = await window.api.copyCardDraft(ref, to);
    if (c) this.open({ scope: to, original: null, card: c });
  }

  // Перевод на другой язык: копия текущей версии, связанная с оригиналом группы. Перевод встроенной
  // карточки ложится в библиотеку, своей — туда же, где оригинал.
  async translate(ref: CardRef, lang: string) {
    const cur = this.all.find((c) => sameRef(c.ref, ref));
    const to: CardScope = ref.scope === 'srd' ? 'library' : ref.scope;
    const c = cur && (await window.api.copyCardDraft(ref, to));
    if (!c) return;
    this.open({ scope: to, original: null, card: { ...c, lang, origin: { id: groupId(cur), relation: 'translation' } } });
  }

  async save(): Promise<boolean> {
    const d = this.draft;
    if (!d || !d.card.name.trim()) return false;
    const card = clean($state.snapshot(d.card)) as Card;
    const ref = await window.api.saveCard(d.scope, card);
    this.draft = null;
    this.select(ref);
    return true;
  }

  cancel(): boolean {
    if (this.dirty && !confirm('Закрыть редактор без сохранения?')) return false;
    this.draft = null;
    return true;
  }

  async remove(ref: CardRef, name: string) {
    if (!confirm(`Удалить карточку «${name}»? Картинки останутся на месте.`)) return;
    await window.api.deleteCard(ref);
    if (sameRef(ref, this.selected)) this.select(null);
  }

  async move(ref: CardRef, to: CardScope) {
    const saved = await window.api.moveCard(ref, to);
    if (saved) this.select(saved);
  }
}

export const bestiary = new Bestiary();

async function refresh() {
  bestiary.all = await window.api.listCards();
  bestiary.rev++;
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

  // Подгружаем полную карточку при выборе и перечитываем после изменений в ядре. Пока грузится другая
  // карточка, старая не показывается; та же самая (после сохранения) остаётся на экране до обновления.
  $effect(() => {
    const ref = bestiary.selected;
    void bestiary.rev;
    if (!ref || !sameRef(ref, untrack(() => bestiary.cardRef))) {
      bestiary.card = null;
      bestiary.cardRef = null;
    }
    if (!ref) return;
    let stale = false;
    window.api.getCard(ref).then((c) => {
      if (stale) return;
      bestiary.card = c;
      bestiary.cardRef = ref;
    });
    return () => (stale = true);
  });
});
