// Бестиарий в окне управления: краткий список карточек из ядра, фильтры и выбранная карточка.
// Фильтры запоминаются между запусками (в окне, не в хранилище).
import type { Card, CardRef, CardScope, CardSummary } from '../../../shared/cards';
import { untrack } from 'svelte';
import { imageScope, langName, sameRef } from '../../../shared/cards';
import { openTab } from '../../../renderer/lib/nav';
import { store } from '../../../renderer/lib/store.svelte';
import { visibleIn } from '../../../shared/adventures';
import { dirname, folderRole } from '../../../shared/vault';
import { systemOf } from '../../../systems';

const KEY = 'sg.bestiary';

interface Filters {
  search: string;
  // 'all' или id системы.
  system: string;
  // Язык, который показывать в первую очередь: у переведённых карточек видна только одна версия.
  // 'all' — все версии подряд.
  lang: string;
  // 'all', 'srd', 'library', 'vault' (всё хранилище) или 'vault:<папка бестиария>'.
  scope: string;
  // 'all', 'monster' или 'npc'.
  kind: string;
}

function load(): Partial<Filters> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

// Место для своей карточки: библиотека или папка бестиария в хранилище (путь внутри хранилища).
export type Place = { scope: 'library'; folder?: undefined } | { scope: 'vault'; folder: string };

export const placeOf = (c: CardSummary | undefined): Place | null =>
  c?.ref.scope === 'library'
    ? { scope: 'library' }
    : c?.ref.scope === 'vault' && c.folder !== undefined
      ? { scope: 'vault', folder: c.folder }
      : null;

export const samePlace = (a: Place | null | undefined, b: Place | null | undefined) =>
  !!a && !!b && a.scope === b.scope && a.folder === b.folder;

// Открытая в редакторе карточка. original — что правим (null — новая или копия). folder — папка бестиария
// для карточки хранилища (туда же ложатся картинки с диска).
export interface Draft {
  scope: CardScope;
  folder?: string;
  card: Card;
  original: CardRef | null;
  // Картинки, которые приложение скопировало для этого черновика: если их не сохранят, они удаляются.
  copied: string[];
}

// Запрос «где хранить?» — окно выбора места (PlacePicker) показывается, пока он есть.
export interface PlaceRequest {
  title: string;
  action: string;
  // Можно ли выбрать библиотеку.
  library: boolean;
  // Текущее место карточки (при переносе его выбрать нельзя).
  exclude?: Place | null;
  resolve(p: Place | null): void;
}

// Карточку превращаем в аккуратный файл: пустые необязательные поля не сохраняем. Обязательные строки
// (тип, мировоззрение, языки, тексты) остаются даже пустыми.
const OPTIONAL = new Set(['acNote', 'hpFormula', 'gear', 'uses', 'description']);

function clean(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      if (x === undefined || x === null || (x === '' && OPTIONAL.has(k))) continue;
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
  filters = $state<Filters>({ search: '', system: 'all', lang: 'ru', scope: 'all', kind: 'all', ...load() });
  // Меняется при каждом обновлении карточек в ядре: выбранную надо перечитать.
  rev = $state(0);
  draft = $state<Draft | null>(null);
  placeRequest = $state.raw<PlaceRequest | null>(null);
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
      const inScope = (c: CardSummary) =>
        f.scope === 'all' || c.ref.scope === f.scope || (f.scope.startsWith('vault:') && c.ref.scope === 'vault' && c.folder === f.scope.slice(6));
      // Карточки хранилища — только текущего приключения и общие.
      const adv = store.state.adventures;
      const inAdventure = (c: CardSummary) => c.ref.scope !== 'vault' || c.folder === undefined || visibleIn(adv, c.folder);
      const members = group.filter(
        (c) => (f.system === 'all' || c.system === f.system) && (f.kind === 'all' || c.kind === f.kind) && inScope(c) && inAdventure(c)
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

  private open(d: Omit<Draft, 'copied'> & { copied?: string[] }) {
    this.draft = { ...d, copied: d.copied ?? [] };
    this.draftStart = JSON.stringify(d.card);
  }

  get dirty() {
    return !!this.draft && JSON.stringify(this.draft.card) !== this.draftStart;
  }

  // Спросить, где хранить карточку. null — передумали.
  choosePlace(opts: Omit<PlaceRequest, 'resolve'>): Promise<Place | null> {
    return new Promise((resolve) => {
      this.placeRequest = {
        ...opts,
        resolve: (p) => {
          this.placeRequest = null;
          resolve(p);
        },
      };
    });
  }

  // Новая карточка: система и язык — из фильтров, если они выбраны.
  async create() {
    const place = await this.choosePlace({ title: 'Где хранить новую карточку?', action: 'Создать', library: true });
    if (!place) return;
    const system = this.filters.system !== 'all' ? this.filters.system : 'dnd5e-2024';
    const lang = this.filters.lang !== 'all' ? this.filters.lang : 'ru';
    this.open({
      ...place,
      original: null,
      card: { format: 1, id: '', kind: 'monster', system, lang, name: '', portraits: [], tags: [], notes: '', stats: systemOf(system).blank() },
    });
    openTab('bestiary');
  }

  // Карточка для портрета: ложится рядом с картинкой, картинка — её портрет. В папке партии — лист персонажа
  // игрока, в остальных — карточка NPC.
  createFor(portrait: string, name: string) {
    const system = this.filters.system !== 'all' ? this.filters.system : 'dnd5e-2024';
    const lang = this.filters.lang !== 'all' ? this.filters.lang : 'ru';
    const party = portrait.split('/').some((p) => folderRole(p) === 'party');
    const kind = party ? 'character' : 'npc';
    this.open({
      scope: 'vault',
      folder: dirname(portrait),
      original: null,
      card: {
        format: 1, id: '', kind, system, lang, name, side: party ? 'party' : 'ally', portraits: [portrait], tags: [], notes: '',
        stats: systemOf(system).blank(kind),
      },
    });
    openTab('bestiary');
  }

  // Своя карточка, у которой эта картинка — один из портретов (основной — в первую очередь).
  cardFor(portrait: string): CardSummary | undefined {
    const own = this.all.filter((c) => c.ref.scope !== 'srd' && c.images.includes(portrait));
    return own.find((c) => c.images[0] === portrait) ?? own[0];
  }

  async edit(ref: CardRef) {
    const c = await window.api.getCard(ref);
    const place = placeOf(this.all.find((x) => sameRef(x.ref, ref)));
    if (c && place) this.open({ ...place, original: ref, card: structuredClone(c) });
  }

  // Копия: открывается в редакторе, файл появится при сохранении.
  async copy(ref: CardRef) {
    const place = await this.choosePlace({ title: 'Куда положить копию?', action: 'Сделать копию', library: true });
    if (!place) return;
    const c = await window.api.copyCardDraft(ref, place.scope, place.folder);
    if (c) this.open({ ...place, original: null, card: c.card, copied: c.copied });
  }

  // Перенести карточку в другое место — без копии, ссылки на неё сохраняются.
  async move(ref: CardRef) {
    const exclude = placeOf(this.all.find((x) => sameRef(x.ref, ref)));
    const place = await this.choosePlace({ title: 'Куда перенести карточку?', action: 'Перенести', library: true, exclude });
    if (!place) return;
    const saved = await window.api.moveCard(ref, place.scope, place.folder);
    if (saved) this.select(saved);
  }

  // Перевод на другой язык: копия текущей версии, связанная с оригиналом группы. Перевод встроенной
  // карточки ложится в библиотеку, своей — туда же, где оригинал.
  async translate(ref: CardRef, lang: string) {
    const cur = this.all.find((c) => sameRef(c.ref, ref));
    if (!cur) return;
    const place: Place = placeOf(cur) ?? { scope: 'library' };
    const c = await window.api.copyCardDraft(ref, place.scope, place.folder);
    if (!c) return;
    this.open({ ...place, original: null, card: { ...c.card, lang, origin: { id: groupId(cur), relation: 'translation' } }, copied: c.copied });
  }

  async save(): Promise<boolean> {
    const d = this.draft;
    if (!d || !d.card.name.trim()) return false;
    const card = clean($state.snapshot(d.card)) as Card;
    const ref = await window.api.saveCard(d.scope, card, d.folder);
    // Картинки, которые добавили и тут же убрали, не нужны.
    const unused = d.copied.filter((p) => !card.portraits.includes(p));
    if (unused.length) await window.api.discardCardImages(d.scope, unused);
    this.draft = null;
    this.select(ref);
    return true;
  }

  cancel(): boolean {
    if (this.dirty && !confirm('Закрыть редактор без сохранения?')) return false;
    const d = this.draft;
    if (d?.copied.length) window.api.discardCardImages(d.scope, $state.snapshot(d.copied));
    this.draft = null;
    return true;
  }

  // ---------- Портреты прямо на странице карточки ----------

  private async writePortraits(ref: CardRef, portraits: string[]) {
    if (ref.scope === 'srd') return window.api.setSrdPortraits(ref, portraits);
    const c = await window.api.getCard(ref);
    if (c) await window.api.saveCard(ref.scope, { ...c, portraits });
  }

  // Добавить портрет из хранилища (vaultPath), из буфера обмена или с диска. Для встроенных карточек картинка
  // копируется в библиотеку.
  async addPortrait(ref: CardRef, vaultPath?: string, fromClipboard = false) {
    const summary = this.all.find((c) => sameRef(c.ref, ref));
    const res = await window.api.addCardImage(imageScope(ref.scope), vaultPath, placeOf(summary)?.folder, fromClipboard);
    const c = res && (await window.api.getCard(ref));
    if (c && !c.portraits.includes(res.path)) await this.writePortraits(ref, [...c.portraits, res.path]);
  }

  // Убрать портрет. Файл удаляется, только если его копировало приложение и он больше никому не нужен.
  async removePortrait(ref: CardRef, p: string) {
    const c = await window.api.getCard(ref);
    if (!c) return;
    await this.writePortraits(ref, c.portraits.filter((x) => x !== p));
    await window.api.discardCardImages(imageScope(ref.scope), [p], true);
  }

  async makeMainPortrait(ref: CardRef, p: string) {
    const c = await window.api.getCard(ref);
    if (c) await this.writePortraits(ref, [p, ...c.portraits.filter((x) => x !== p)]);
  }

  // Удаление спрашивает ядро: заодно предлагает удалить картинки, которые есть только у этой карточки.
  async remove(ref: CardRef) {
    if ((await window.api.deleteCard(ref)) && sameRef(ref, this.selected)) this.select(null);
  }

  // Импорт файлов карточек в выбранное место. Возвращает сообщение для пользователя или null.
  // place — куда класть (иначе спросим), например папка партии текущего приключения.
  async importFiles(place?: Place | null): Promise<string | null> {
    const files = await window.api.pickImportFiles();
    if (!files.length) return null;
    place ??= await this.choosePlace({ title: 'Куда импортировать карточки?', action: 'Импортировать', library: true });
    if (!place) return null;
    const { count, errors, updated } = await window.api.importCards(files, place.scope, place.folder);
    return [
      count || !updated.length ? `Импортировано карточек: ${count}` : '',
      updated.length ? `Обновлены: ${updated.join(', ')}` : '',
      ...errors,
    ]
      .filter(Boolean)
      .join('\n');
  }

  // Экспорт всех карточек библиотеки или папки бестиария.
  async exportPlace(vaultName: string, title: (folder: string) => string): Promise<string | null> {
    const place = await this.choosePlace({ title: 'Какие карточки экспортировать?', action: 'Экспортировать', library: true });
    if (!place) return null;
    const name = place.scope === 'library' ? 'Библиотека карточек' : `Карточки — ${title(place.folder) || vaultName}`;
    const n = await window.api.exportCards({ scope: place.scope, folder: place.folder, name });
    return n === null ? null : `Экспортировано карточек: ${n}`;
  }
}

export const bestiary = new Bestiary();

async function refresh() {
  bestiary.all = await window.api.listCards();
  bestiary.rev++;
}

// Список грузится при первом показе бестиария, а не при запуске: этот файл попадает и в окно игроков.
let loaded: Promise<void> | null = null;
export function connectCards(): Promise<void> {
  if (!loaded) {
    window.api.onCardsChanged(refresh);
    loaded = refresh();
  }
  return loaded;
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
