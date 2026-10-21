// Бестиарий в окне управления: краткий список карточек из ядра, фильтры и выбранная карточка.
// Фильтры запоминаются между запусками (в окне, не в хранилище).
import { locale, t } from '../../../renderer/lib/i18n.svelte';
import type { Card, CardKind, CardRef, CardScope, CardSummary, LssPreview } from '../../../shared/cards';
import { defaultSide, imageScope, langName, sameRef } from '../../../shared/cards';
import { openTab } from '../../../renderer/lib/nav';
import { store } from '../../../renderer/lib/store.svelte';
import { currentSystem, inCurrentFamily, visibleIn } from '../../../shared/adventures';
import { dirname, folderRole } from '../../../shared/vault';
import { systemOf } from '../../../systems';

const KEY = 'sg.bestiary';

interface Filters {
  search: string;
  // 'all' (все системы семейства приключения) или id системы. Карточки других семейств не видны.
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
// Персонаж из LSS, у которого уже есть карточка: окно LssUpdate показывает, что изменилось, и ждёт решения.
// import — спросили при импорте (можно и создать новую карточку), иначе — «Обновить из LSS…» у карточки.
// update — с итогом, собранным из выбранных изменений (merged; нет — всё из файла).
export type LssMerged = { name: string; system: string; stats: unknown };
export type LssChoice = { kind: 'update'; merged?: LssMerged } | { kind: 'new' } | { kind: 'cancel' };
export interface LssRequest {
  target: CardRef;
  current: Card;
  lss: LssPreview;
  import: boolean;
  resolve(c: LssChoice): void;
}

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
  // Карточка в выдвижной панели (CardDrawer): открывается откуда угодно, не уводя со своей вкладки.
  peeked = $state.raw<CardRef | null>(null);
  // The search starts empty on every launch; other filters are remembered. lang '' — the interface language.
  filters = $state<Filters>({ system: 'all', lang: '', scope: 'all', kind: 'all', ...load(), search: '' });
  // Language of the cards shown: the chosen one, 'all' or the interface language.
  get lang() {
    return this.filters.lang || locale.lang;
  }
  // Меняется при каждом обновлении карточек в ядре: выбранную надо перечитать.
  rev = $state(0);
  draft = $state<Draft | null>(null);
  placeRequest = $state.raw<PlaceRequest | null>(null);
  lssRequest = $state.raw<LssRequest | null>(null);
  // Снимок черновика при открытии: есть ли несохранённые изменения.
  draftStart = '';
  // Файл карточки, открытой в редакторе, изменили снаружи (в другой программе): новая версия с диска
  // или 'deleted' — файл удалили. Редактор предлагает загрузить её или оставить свои правки.
  external = $state.raw<Card | 'deleted' | null>(null);
  private saving = false;

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
      // Built-in cards exist for D&D and Mausritter: in a system without them the «SRD» filter shows everything.
      const srdNone = f.scope === 'srd' && !this.all.some((c) => c.ref.scope === 'srd' && inCurrentFamily(store.state.adventures, c.system));
      const inScope = (c: CardSummary) =>
        f.scope === 'all' || srdNone || c.ref.scope === f.scope || (f.scope.startsWith('vault:') && c.ref.scope === 'vault' && c.folder === f.scope.slice(6));
      // Карточки хранилища — только текущего приключения и общие.
      const adv = store.state.adventures;
      const inAdventure = (c: CardSummary) => c.ref.scope !== 'vault' || c.folder === undefined || visibleIn(adv, c.folder);
      const system = (c: CardSummary) => inCurrentFamily(adv, c.system) && (f.system === 'all' || c.system === f.system || !inCurrentFamily(adv, f.system));
      const members = group.filter((c) => system(c) && (f.kind === 'all' || c.kind === f.kind) && inScope(c) && inAdventure(c));
      if (!members.length) continue;
      // Ищем по всем версиям: «goblin» найдёт и «Гоблина».
      if (q && !group.some((c) => fold(c.name).includes(q))) continue;
      if (this.lang === 'all') out.push(...members);
      else out.push(members.find((c) => c.lang === this.lang) ?? members.find((c) => !c.origin) ?? members[0]!);
    }
    return out.sort((a, b) => collator.compare(a.name, b.name));
  });

  // Все версии карточки (оригинал и переводы) — для переключателя языка. Оригинал первым, переводы — по языку.
  versionsOf(ref: CardRef): CardSummary[] {
    const cur = this.all.find((c) => sameRef(c.ref, ref));
    const list = cur ? (this.groups.get(groupId(cur)) ?? [cur]) : [];
    return [...list].sort((a, b) => Number(!!a.origin) - Number(!!b.origin) || langName(a.lang).localeCompare(langName(b.lang)));
  }

  select(ref: CardRef | null) {
    this.selected = ref && { scope: ref.scope, id: ref.id };
  }

  // A card by name (any of names, case-insensitive) for a [[link]]: the adventure's system first, then any.
  named(names: string | string[]): CardSummary | undefined {
    const keys = (Array.isArray(names) ? names : [names]).map((n) => n.trim().toLowerCase());
    const hits = this.all.filter((c) => keys.includes(c.name.toLowerCase()));
    return hits.find((c) => inCurrentFamily(store.state.adventures, c.system)) ?? hits[0];
  }

  // Показать карточку в выдвижной панели — из «Персонажей», «Файлов», трекера инициативы. Повторное нажатие на ту же
  // кнопку закрывает панель (в том числе если в ней переключили язык карточки).
  show(ref: CardRef) {
    const open = this.peeked;
    if (open && (sameRef(open, ref) || this.versionsOf(ref).some((c) => sameRef(c.ref, open)))) {
      this.peeked = null;
      return;
    }
    this.peeked = { scope: ref.scope, id: ref.id };
  }

  // Открыть карточку во вкладке бестиария (из выдвижной панели — «Во вкладке»).
  openInBestiary(ref: CardRef) {
    this.select(ref);
    this.peeked = null;
    openTab('bestiary');
  }

  // ---------- Редактор ----------

  // Редактор живёт во вкладке бестиария: открываем её, выдвижную панель закрываем.
  private open(d: Omit<Draft, 'copied'> & { copied?: string[] }) {
    this.draft = { ...d, copied: d.copied ?? [] };
    this.draftStart = JSON.stringify(d.card);
    this.external = null;
    this.peeked = null;
    openTab('bestiary');
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

  private askLss(req: Omit<LssRequest, 'resolve'>): Promise<LssChoice> {
    return new Promise((resolve) => {
      this.lssRequest = {
        ...req,
        resolve: (c) => {
          this.lssRequest = null;
          resolve(c);
        },
      };
    });
  }

  // «Обновить из LSS…»: выбрать свежий экспорт персонажа, посмотреть изменения и обновить карточку. Сообщение
  // о результате или null — передумали.
  async updateFromLss(ref: CardRef): Promise<string | null> {
    const current = await window.api.getCard($state.snapshot(ref));
    if (!current) return null;
    let picked;
    try {
      picked = await window.api.pickLss();
    } catch (e) {
      return t('best.readFailed', { error: e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : String(e) });
    }
    if (!picked) return null;
    const choice = await this.askLss({ target: $state.snapshot(ref), current, lss: picked.lss, import: false });
    if (choice.kind !== 'update') return null;
    await window.api.updateFromLss($state.snapshot(ref), picked.file, choice.merged);
    return t('best.updatedLss', { name: choice.merged?.name ?? picked.lss.name });
  }

  // Система новой карточки: выбранная в фильтре (если она из семейства приключения), иначе — приключения.
  private newSystem() {
    const adv = store.state.adventures;
    const f = this.filters.system;
    return f !== 'all' && inCurrentFamily(adv, f) ? f : currentSystem(adv);
  }

  // Новая карточка: система и язык — из фильтров, если они выбраны.
  // place — куда (например, открытая во «Файлах» папка); без него спросим.
  // prefill — a card started elsewhere (the NPC and mouse generators): name, description, notes, kind and language;
  // a system and its stats block when the generator filled them in.
  async create(at?: Place, prefill?: { name: string; description?: string; notes?: string; kind?: CardKind; lang?: string; system?: string; stats?: unknown }) {
    const place = at ?? (await this.choosePlace({ title: t('best.whereNew'), action: t('best.create'), library: true }));
    if (!place) return;
    const system = prefill?.system ?? this.newSystem();
    const lang = prefill?.lang ?? (this.lang !== 'all' ? this.lang : locale.lang);
    // Вид — по папке: в папке персонажей — NPC, в папке партии — персонаж игрока, иначе монстр.
    const role = place.folder !== undefined ? place.folder.split('/').map(folderRole).filter(Boolean).at(-1) : null;
    const kind = prefill?.kind ?? (role === 'characters' ? 'npc' : role === 'party' ? 'character' : 'monster');
    this.open({
      ...place,
      original: null,
      card: {
        format: 1, id: '', kind, system, lang, name: prefill?.name ?? '', side: defaultSide(kind), portraits: [], tags: [],
        ...(prefill?.description ? { description: prefill.description } : {}),
        notes: prefill?.notes ?? '', stats: prefill?.stats ?? systemOf(system).blank(kind),
      },
    });
    openTab('bestiary');
  }

  // Карточка для портрета: ложится рядом с картинкой, картинка — её портрет. В папке партии — лист персонажа
  // игрока, в остальных — карточка NPC.
  // prefill — a stat block made elsewhere (Reshape a stat block from this portrait): its system, language and block.
  createFor(portrait: string, name: string, prefill?: { system: string; lang: string; stats: unknown; description?: string; notes?: string }) {
    const system = prefill?.system ?? this.newSystem();
    const lang = prefill?.lang ?? (this.lang !== 'all' ? this.lang : locale.lang);
    const party = portrait.split('/').some((p) => folderRole(p) === 'party');
    // A stat block is an NPC's even in the party folder: a player's sheet has another shape.
    const kind = party && !prefill ? 'character' : 'npc';
    this.open({
      scope: 'vault',
      folder: dirname(portrait),
      original: null,
      card: {
        format: 1, id: '', kind, system, lang, name, side: party ? 'party' : 'ally', portraits: [portrait], tags: [], notes: prefill?.notes ?? '',
        ...(prefill?.description ? { description: prefill.description } : {}),
        stats: prefill?.stats ?? systemOf(system).blank(kind),
      },
    });
    openTab('bestiary');
  }

  // Своя карточка, у которой эта картинка — один из портретов (основной — в первую очередь).
  cardFor(portrait: string): CardSummary | undefined {
    const own = this.all.filter((c) => c.ref.scope !== 'srd' && c.images.includes(portrait));
    return own.find((c) => c.images[0] === portrait) ?? own[0];
  }

  // Встроенная карточка правится на месте: правка ляжет в библиотеку и заменит её везде (main/cards.ts).
  async edit(ref: CardRef) {
    const c = await window.api.getCard(ref);
    const place = ref.scope === 'srd' ? { scope: 'srd' as const } : placeOf(this.all.find((x) => sameRef(x.ref, ref)));
    if (c && place) this.open({ ...place, original: ref, card: structuredClone(c) });
  }

  // Убрать правку встроенной карточки (спросит ядро).
  revert(ref: CardRef) {
    return window.api.revertSrdCard(ref);
  }

  // Копия: открывается в редакторе, файл появится при сохранении.
  async copy(ref: CardRef) {
    const place = await this.choosePlace({ title: t('best.whereCopy'), action: t('best.makeCopy').replace('…', ''), library: true });
    if (!place) return;
    const c = await window.api.copyCardDraft(ref, place.scope, place.folder);
    if (c) this.open({ ...place, original: null, card: c.card, copied: c.copied });
  }

  // Перенести карточку в другое место — без копии, ссылки на неё сохраняются.
  async move(ref: CardRef) {
    const exclude = placeOf(this.all.find((x) => sameRef(x.ref, ref)));
    const place = await this.choosePlace({ title: t('best.whereMove'), action: t('best.move').replace('…', ''), library: true, exclude });
    if (!place) return;
    const saved = await window.api.moveCard(ref, place.scope, place.folder);
    if (saved && sameRef(ref, this.peeked)) this.peeked = saved;
    else if (saved) this.select(saved);
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
    this.saving = true;
    let ref: CardRef;
    try {
      ref = await window.api.saveCard(d.scope, card, d.folder);
    } finally {
      this.saving = false;
    }
    this.external = null;
    // Картинки, которые добавили и тут же убрали, не нужны.
    const unused = d.copied.filter((p) => !card.portraits.includes(p));
    if (unused.length) await window.api.discardCardImages(imageScope(d.scope), unused);
    this.draft = null;
    this.select(ref);
    return true;
  }

  // Карточки в ядре обновились: не изменился ли файл той, что открыта в редакторе.
  async checkExternal() {
    const d = this.draft;
    if (!d?.original || this.saving) return;
    // Ссылка внутри черновика — реактивный прокси, через IPC его не передать.
    const c = await window.api.getCard($state.snapshot(d.original));
    if (this.draft !== d || this.saving) return;
    if (!c) this.external = 'deleted';
    else if (JSON.stringify(c) !== this.draftStart) this.external = c;
  }

  // Загрузить версию с диска вместо своих правок.
  takeExternal() {
    const d = this.draft;
    const c = this.external;
    if (!d || !c || c === 'deleted') return;
    d.card = structuredClone(c);
    this.draftStart = JSON.stringify(c);
    this.external = null;
  }

  // Оставить свои правки: при сохранении они заменят версию с диска.
  keepMine() {
    if (this.external && this.external !== 'deleted') this.draftStart = JSON.stringify(this.external);
    this.external = null;
  }

  cancel(): boolean {
    if (this.dirty && !confirm(t('best.closeUnsaved'))) return false;
    const d = this.draft;
    if (d?.copied.length) window.api.discardCardImages(imageScope(d.scope), $state.snapshot(d.copied));
    this.draft = null;
    this.external = null;
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

  // Новое название своей карточки (с плитки — без редактора). Файл карточки не переименовывается.
  async rename(ref: CardRef, name: string) {
    const c = ref.scope === 'srd' ? null : await window.api.getCard(ref);
    if (c && name.trim()) await window.api.saveCard(ref.scope, { ...c, name: name.trim() });
  }

  // Удаление спрашивает ядро: заодно предлагает удалить картинки, которые есть только у этой карточки.
  async remove(ref: CardRef) {
    if (!(await window.api.deleteCard(ref))) return;
    if (sameRef(ref, this.selected)) this.select(null);
    if (sameRef(ref, this.peeked)) this.peeked = null;
  }

  // Импорт файлов карточек в выбранное место. Возвращает сообщение для пользователя или null.
  // place — куда класть (иначе спросим), например папка партии текущего приключения.
  async importFiles(place?: Place | null): Promise<string | null> {
    const files = await window.api.pickImportFiles();
    if (!files.length) return null;
    place ??= await this.choosePlace({ title: t('best.whereImport'), action: t('best.import'), library: true });
    if (!place) return null;
    const { count, errors, matches } = await window.api.importCards(files, place.scope, place.folder);
    // Персонажи LSS, у которых карточка уже есть: показать изменения и спросить — обновить или создать новую.
    const updated: string[] = [];
    let added = count;
    for (const m of matches) {
      const current = await window.api.getCard(m.ref);
      const lss = await window.api.readLss(m.file);
      const choice: LssChoice = current ? await this.askLss({ target: m.ref, current, lss, import: true }) : { kind: 'new' };
      if (choice.kind === 'update') {
        await window.api.updateFromLss(m.ref, m.file, choice.merged);
        updated.push(choice.merged?.name ?? lss.name);
      } else if (choice.kind === 'new') {
        const r = await window.api.importCards([m.file], place.scope, place.folder, true);
        added += r.count;
        errors.push(...r.errors);
      }
    }
    return [
      added || !updated.length ? t('best.imported', { count: added }) : '',
      updated.length ? t('best.updated', { list: updated.join(', ') }) : '',
      ...errors,
    ]
      .filter(Boolean)
      .join('\n');
  }

  // Экспорт всех карточек библиотеки или папки бестиария.
  async exportPlace(vaultName: string, title: (folder: string) => string): Promise<string | null> {
    const place = await this.choosePlace({ title: t('best.whichExport'), action: t('best.export'), library: true });
    if (!place) return null;
    const name = place.scope === 'library' ? t('best.libraryFile') : t('best.cardsOf', { name: title(place.folder) || vaultName });
    const n = await window.api.exportCards({ scope: place.scope, folder: place.folder, name });
    return n === null ? null : t('best.exported', { count: n });
  }
}

export const bestiary = new Bestiary();

async function refresh() {
  bestiary.all = await window.api.listCards();
  bestiary.rev++;
  bestiary.checkExternal();
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
});
