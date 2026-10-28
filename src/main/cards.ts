// Карточки: встроенный SRD (только чтение), библиотека пользователя и карточки хранилища.
// В общее состояние приложения они не входят: его рассылают во все окна после каждого действия,
// а карточек — сотни. Окна получают краткий список и запрашивают полную карточку по ссылке.
//
// На диске:
// - библиотека: <библиотека>/cards/*.json, картинки — <библиотека>/images/;
// - хранилище: файлы *.json в папках бестиария (monsters / монстры / bestiary / …) на любой глубине —
//   у каждого приключения свои. Картинки — любые картинки хранилища, а добавленные с диска копируются
//   в папку карточки.
// - правки встроенных карточек: файлы библиотеки с полем overrides (id карточки SRD) — см. «Правки встроенных».
// Пути картинок — от корня библиотеки или хранилища, через «/».
// id карточки хранится в её файле; если его нет или он повторяется (файл скопировали руками), берётся
// производный от пути — и записывается в файл при следующем сохранении.
import { upgradeCard } from '../shared/oldcards';
import { t } from '../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { app, BrowserWindow } from 'electron';
import type { Card, CardRef, CardScope, CardSummary, LssMatch } from '../shared/cards';
import { cardAsset, defaultSide, refKey } from '../shared/cards';
import { folderRole, roleFolders, roleNames, type VaultFolder } from '../shared/vault';
import { systemOf } from '../systems';
import { collectLssSpells, fromLss, isLssExport, type LssImport, type LssSpellTable } from '../systems/dnd5e/lss';
import { freeName, writeJsonAtomic } from './files';
import { discard } from './trash';

const cards = new Map<string, Card>();
// Файл каждой своей карточки (ключ — refKey).
const files = new Map<string, string>();
let summaries: CardSummary[] | null = null;

let libraryRoot: string | null = null;
let vaultRoot: string | null = null;
let vaultTree: VaultFolder | null = null;

// Корень места хранения: от него считаются пути картинок.
// Портреты встроенных карточек хранятся в библиотеке (см. «Портреты встроенных карточек»), поэтому у SRD
// тот же корень, что у библиотеки.
export const scopeRoot = (scope: CardScope) => (scope === 'vault' ? vaultRoot : libraryRoot);

// Путь внутри корня (через «/») -> абсолютный. null — выходит за пределы корня.
function inside(root: string | null, rel: string): string | null {
  if (!root) return null;
  const abs = path.resolve(root, ...rel.split('/'));
  return abs === root || abs.startsWith(root + path.sep) ? abs : null;
}

const toRel = (root: string, abs: string) => path.relative(root, abs).split(path.sep).join('/');

// Встроенный бестиарий лежит рядом с приложением: resources/srd/<система>.json
function loadBuiltin() {
  const dir = path.join(app.getAppPath(), 'resources', 'srd');
  let list: string[] = [];
  try {
    list = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    console.error('Built-in bestiary not found:', dir);
  }
  for (const f of list) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Card[];
      for (const c of data) builtin.set(c.id, c);
    } catch (e) {
      console.error('Could not read the built-in bestiary', f, e);
    }
  }
}

// ---------- Портреты встроенных карточек ----------
// Встроенные карточки только для чтения, но портрет к ним добавить можно: портреты хранятся в библиотеке
// (<библиотека>/srd.json, картинки — в images/) и подмешиваются при чтении. Ключ — оригинал карточки, так что
// портрет общий для всех её переводов.
const builtin = new Map<string, Card>();
let srdPortraits: Record<string, string[]> = {};

// ---------- Правки встроенных карточек ----------
// Встроенные файлы не меняются. «Править» у карточки SRD сохраняет правку — карточку в библиотеке с полем
// overrides: <id карточки SRD>. Она заменяет встроенную под той же ссылкой (srd:<id>): бои, метки, жетоны и
// переводы продолжают на неё указывать. Среди карточек библиотеки правка не показывается; удалить её (в корзину) —
// «Вернуть как в SRD». Портреты и у исправленной карточки — из srd.json (общие для всех её языков).
const overrides = new Map<string, { file: string; card: Card }>();

const srdFile = () => libraryRoot && path.join(libraryRoot, 'srd.json');
const srdKey = (c: Card) => (c.origin?.relation === 'translation' ? c.origin.id : c.id);

function applySrd() {
  for (const [id, orig] of builtin) {
    const o = overrides.get(id)?.card;
    // У правки своё содержимое, но место в группе переводов и источник — встроенной карточки.
    const c: Card = o ? { ...o, id, origin: orig.origin, source: orig.source, portraits: orig.portraits } : orig;
    delete c.overrides;
    const portraits = srdPortraits[srdKey(orig)];
    cards.set(refKey({ scope: 'srd', id }), portraits?.length ? { ...c, portraits } : c);
  }
}

function loadSrdPortraits() {
  srdPortraits = {};
  const file = srdFile();
  try {
    if (file && fs.existsSync(file)) srdPortraits = (JSON.parse(fs.readFileSync(file, 'utf8')) as { portraits?: Record<string, string[]> }).portraits ?? {};
  } catch (e) {
    console.error('Could not read built-in card portraits', file, e);
  }
  applySrd();
}

export function setSrdPortraits(ref: CardRef, portraits: string[]) {
  const c = builtin.get(ref.id);
  const file = srdFile();
  if (ref.scope !== 'srd' || !c || !file) return;
  const key = srdKey(c);
  if (portraits.length) srdPortraits[key] = portraits;
  else delete srdPortraits[key];
  writeJsonAtomic(file, { portraits: srdPortraits });
  applySrd();
  changed();
}

// Все *.json в папке и вложенных (скрытые пропускаются).
function jsonFiles(dir: string, depth = 0): string[] {
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory() && depth < 6) out.push(...jsonFiles(abs, depth + 1));
    else if (e.isFile() && e.name.toLowerCase().endsWith('.json')) out.push(abs);
  }
  return out;
}

const validId = (id: unknown): id is string => typeof id === 'string' && /^[\w.-]{1,80}$/.test(id);
const pathId = (root: string, abs: string) =>
  `${slug(path.basename(abs, '.json')) || 'card'}-${createHash('sha1').update(toRel(root, abs)).digest('hex').slice(0, 6)}`;

// Читает карточки из файлов. Не карточки (другие JSON) и битые файлы пропускаются, но не трогаются.
function loadFiles(scope: CardScope, root: string, list: string[]) {
  for (const key of [...cards.keys()]) {
    if (key.startsWith(scope + ':')) {
      cards.delete(key);
      files.delete(key);
    }
  }
  for (const abs of list) {
    try {
      const raw = JSON.parse(fs.readFileSync(abs, 'utf8')) as Card;
      if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || raw.stats === undefined) continue;
      const c = upgradeCard(raw);
      let id = validId(c.id) ? c.id : pathId(root, abs);
      if (cards.has(refKey({ scope, id }))) id = pathId(root, abs);
      const key = refKey({ scope, id });
      cards.set(key, { ...c, id, portraits: c.portraits ?? [], tags: c.tags ?? [], notes: c.notes ?? '' });
      files.set(key, abs);
    } catch (e) {
      console.error('Could not read a card', abs, e);
    }
  }
}

function loadLibrary() {
  if (!libraryRoot) return;
  loadFiles('library', libraryRoot, jsonFiles(path.join(libraryRoot, 'cards')));
  // Правки встроенных — не карточки библиотеки, а замена встроенных.
  overrides.clear();
  for (const [key, c] of [...cards]) {
    if (!key.startsWith('library:') || !c.overrides || !builtin.has(c.overrides)) continue;
    overrides.set(c.overrides, { file: files.get(key)!, card: c });
    cards.delete(key);
    files.delete(key);
  }
  applySrd();
}

export const isEditedSrd = (ref: CardRef) => ref.scope === 'srd' && overrides.has(ref.id);

// Сохранить правку встроенной карточки (в свой файл библиотеки или новый). Портреты — в srd.json.
function saveSrdEdit(card: Card): CardRef {
  const orig = builtin.get(card.id);
  if (!orig || !libraryRoot) throw new Error(t('core.builtinNotFound'));
  const ref: CardRef = { scope: 'srd', id: card.id };
  const prev = overrides.get(card.id);
  let file = prev?.file;
  if (!file) {
    const dir = path.join(libraryRoot, 'cards');
    fs.mkdirSync(dir, { recursive: true });
    file = path.join(dir, fileName(dir, card.name));
  }
  const { portraits, origin: _origin, source: _source, ...rest } = card;
  writeJsonAtomic(file, { ...rest, id: prev?.card.id ?? newId('library', card.name), overrides: card.id, portraits: [], format: 1 });
  const key = srdKey(orig);
  if (portraits.length) srdPortraits[key] = portraits;
  else delete srdPortraits[key];
  const pf = srdFile();
  if (pf) writeJsonAtomic(pf, { portraits: srdPortraits });
  loadLibrary();
  changed();
  return ref;
}

// «Вернуть как в SRD»: файл правки — в корзину (оттуда правку можно вернуть). false — правки нет.
export function revertSrd(ref: CardRef): boolean {
  const o = ref.scope === 'srd' ? overrides.get(ref.id) : undefined;
  if (!o || !libraryRoot) return false;
  discard(libraryRoot, [toRel(libraryRoot, o.file)], { title: t('core.srdEditTrash', { name: o.card.name }), kind: 'card' });
  loadLibrary();
  changed();
  return true;
}

// Папки, куда приложение только что записало карточки: в дереве хранилища они появятся только после
// пересканирования (новая папка «monsters»), а карточки должны быть видны сразу.
const written = new Set<string>();

// Папки хранилища, где живут карточки (пути внутри хранилища): бестиарий — монстры, characters — NPC рядом
// со своими портретами, party — персонажи игроков.
const roleFolderPaths = (role: 'bestiary' | 'characters' | 'party') =>
  vaultTree ? roleFolders(vaultTree, role, '').map((r) => r.folder.path) : [];

function cardFolders(): string[] {
  const known = [...roleFolderPaths('bestiary'), ...roleFolderPaths('characters'), ...roleFolderPaths('party')];
  const extra = [...written].filter((p) => !known.some((k) => p === k || p.startsWith(k + '/')));
  return [...known, ...extra];
}

const bestiaryFolders = () => roleFolderPaths('bestiary');

function loadVault() {
  const list = vaultRoot ? cardFolders().flatMap((p) => jsonFiles(inside(vaultRoot, p)!)) : [];
  loadFiles('vault', vaultRoot ?? '', list);
}

// Systems came or went (packs installed, deleted): the cards' lines are made by them — made again.
export const systemsChanged = () => changed();

function changed() {
  summaries = null;
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send('cards:changed');
}

export function initCards(library: string) {
  loadBuiltin();
  setLibrary(library);
}

// Карточки библиотеки, изменённые снаружи (в редакторе, синхронизацией): перечитываем с задержкой,
// чтобы пачка изменений обработалась один раз.
let libraryWatcher: fs.FSWatcher | null = null;
function watchLibrary(root: string) {
  libraryWatcher?.close();
  libraryWatcher = null;
  const dir = path.join(root, 'cards');
  let timer: NodeJS.Timeout | null = null;
  try {
    fs.mkdirSync(dir, { recursive: true });
    libraryWatcher = fs.watch(dir, { recursive: true }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (libraryRoot !== root) return;
        loadLibrary();
        changed();
      }, 300);
    });
    libraryWatcher.on('error', () => {
      /* папку могли удалить; карточки перечитаются при следующем сохранении */
    });
  } catch {
    libraryWatcher = null;
  }
}

export function setLibrary(root: string) {
  libraryRoot = root;
  watchLibrary(root);
  loadLibrary();
  loadSrdPortraits();
  changed();
}

export const libraryPath = () => libraryRoot;

// Открыто другое хранилище (null — закрыто) или в нём изменились файлы.
export function setCardsVault(root: string | null, tree: VaultFolder | null) {
  if (root !== vaultRoot) written.clear();
  vaultRoot = root;
  vaultTree = tree;
  loadVault();
  changed();
}

function summarize(ref: CardRef, c: Card): CardSummary {
  const sys = systemOf(c.system);
  let subtitle = '';
  let rank: number | null = null;
  let combat: CardSummary['combat'] = { hp: null, ac: null, initiative: 0 };
  try {
    subtitle = sys.subtitle(c.stats, c.lang);
    rank = sys.rank(c.stats);
    combat = sys.combat(c.stats);
  } catch {
    /* карточка заполнена не до конца — покажем без подробностей */
  }
  const file = files.get(refKey(ref));
  return {
    ref,
    kind: c.kind,
    system: c.system,
    lang: c.lang,
    name: c.name,
    ...(c.origin ? { origin: c.origin } : {}),
    ...(ref.scope === 'vault' && file && vaultRoot ? { folder: cardFolder(file), file: toRel(vaultRoot, file) } : {}),
    side: c.side ?? defaultSide(c.kind),
    tags: c.tags,
    portrait: c.portraits[0] ?? null,
    images: c.portraits.map((p) => cardAsset(ref.scope, p)),
    subtitle,
    rank,
    combat,
    ...(ref.scope === 'srd' && overrides.has(ref.id) ? { edited: true } : {}),
  };
}

// Папка бестиария, в которой лежит файл карточки хранилища (путь внутри хранилища).
function cardFolder(file: string): string {
  const rel = toRel(vaultRoot!, file);
  return cardFolders().find((p) => rel.startsWith(p + '/')) ?? toRel(vaultRoot!, path.dirname(file));
}

export function listCards(): CardSummary[] {
  if (!summaries) {
    summaries = [];
    for (const [key, c] of cards) {
      const i = key.indexOf(':');
      summaries.push(summarize({ scope: key.slice(0, i) as CardScope, id: key.slice(i + 1) }, c));
    }
  }
  return summaries;
}

export const getCard = (ref: CardRef): Card | null => cards.get(refKey(ref)) ?? null;

// ---------- Запись ----------

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function slug(name: string): string {
  return [...name.toLowerCase()]
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// «Вождь огров» -> «vozhd-ogrov-3f9a»: читаемо и со случайным хвостом, чтобы не столкнуться.
function newId(scope: CardScope, name: string): string {
  for (;;) {
    const id = `${slug(name) || 'card'}-${randomBytes(2).toString('hex')}`;
    if (!cards.has(refKey({ scope, id }))) return id;
  }
}

// Имя файла новой карточки — её название: «Тыквенный ужас.json».
const fileName = (dir: string, name: string) =>
  freeName(dir, `${name.replace(/[/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || t('core.name.card')}.json`);

// Папка для новой карточки: в библиотеке — cards/, в хранилище — выбранная папка бестиария.
function targetDir(scope: CardScope, folder?: string): string | null {
  if (scope === 'library') return libraryRoot && path.join(libraryRoot, 'cards');
  if (scope === 'vault') return folder !== undefined ? inside(vaultRoot, folder) : null;
  return null;
}

// Запомнить папку записанного файла хранилища (см. written).
function remember(scope: CardScope, file: string) {
  if (scope === 'vault' && vaultRoot) written.add(toRel(vaultRoot, path.dirname(file)));
}

function reload(scope: CardScope) {
  if (scope === 'library') loadLibrary();
  else if (scope === 'vault') loadVault();
}

// Картинку хранилища переименовали: поправить портреты своих карточек хранилища, где она есть.
export function renameVaultImage(from: string, to: string) {
  let touched = false;
  for (const [key, file] of files) {
    const card = cards.get(key);
    if (!key.startsWith('vault:') || !card?.portraits.includes(from)) continue;
    writeJsonAtomic(file, { ...card, portraits: card.portraits.map((p) => (p === from ? to : p)), format: 1 });
    touched = true;
  }
  if (touched) {
    reload('vault');
    changed();
  }
}

// Сохраняет карточку. Уже существующая (id есть в этом месте) пишется в свой файл, новая — в папку folder
// (для хранилища; папка создаётся, если её нет). Возвращает ссылку на карточку.
export function saveCard(scope: CardScope, card: Card, folder?: string): CardRef {
  if (scope === 'srd') return saveSrdEdit(card);
  const existing = card.id ? files.get(refKey({ scope, id: card.id })) : undefined;
  const id = existing ? card.id : newId(scope, card.name);
  let file = existing;
  if (!file) {
    const dir = targetDir(scope, folder);
    if (!dir) throw new Error(t('core.noCardFolder'));
    fs.mkdirSync(dir, { recursive: true });
    file = path.join(dir, fileName(dir, card.name));
  }
  writeJsonAtomic(file, { ...card, id, format: 1 });
  remember(scope, file);
  reload(scope);
  changed();
  return { scope, id };
}

// Удаляет файл карточки. images — её картинки, которые удалить вместе с ней (см. ownImages).
// toTrash — в корзину приложения одним элементом (их можно вернуть; если корзина выключена — насовсем); false —
// насовсем (после переноса карточки).
export function deleteCard(ref: CardRef, images: string[] = [], toTrash = true) {
  const file = files.get(refKey(ref));
  const root = scopeRoot(ref.scope);
  if (!file || !root) return;
  if (toTrash) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    discard(root, [rel, ...images], { title: cards.get(refKey(ref))?.name ?? path.basename(file, '.json'), kind: 'card' });
  } else {
    fs.rmSync(file, { force: true });
    for (const rel of images) removeImage(ref.scope, rel);
  }
  reload(ref.scope);
  changed();
}

// Перечитать карточки хранилища и библиотеки (например, после возврата из корзины).
export function reloadCards() {
  reload('library');
  reload('vault');
  changed();
}

// Картинка «принадлежит карточкам»: лежит в images/ библиотеки или в папке бестиария хранилища,
// и ею не пользуется ни одна карточка, кроме except. Только такие приложение удаляет само.
// anyCardFolder — годится и папка персонажей (для картинок, которые приложение только что туда скопировало;
// портреты в characters — обычно файлы пользователя, вместе с карточкой они не удаляются).
function disposable(scope: CardScope, rel: string, except?: CardRef, anyCardFolder = false): boolean {
  const folders = anyCardFolder ? cardFolders() : bestiaryFolders();
  const inLibrary = scope !== 'vault';
  const inPlace = inLibrary ? rel.startsWith('images/') : folders.some((f) => rel.startsWith(f + '/'));
  if (!inPlace) return false;
  // Картинками библиотеки пользуются и её карточки, и встроенные (их портреты).
  const skip = except && refKey(except);
  const same = (key: string) => (inLibrary ? key.startsWith('library:') || key.startsWith('srd:') : key.startsWith('vault:'));
  for (const [key, c] of cards) {
    if (key !== skip && same(key) && c.portraits.includes(rel)) return false;
  }
  return true;
}

function removeImage(scope: CardScope, rel: string) {
  const abs = imageFile(scope, rel);
  if (abs && fs.existsSync(abs)) fs.rmSync(abs);
}

// Картинки карточки, которые можно удалить вместе с ней.
export const ownImages = (ref: CardRef): string[] =>
  (getCard(ref)?.portraits ?? []).filter((p) => disposable(ref.scope, p, ref));

// Убирает картинки, скопированные для черновика, который не сохранили (или из которого их убрали),
// если ими никто не пользуется.
// ownedOnly — только из библиотеки и папок бестиария (картинка могла быть файлом пользователя в characters).
export function discardImages(scope: CardScope, rels: string[], ownedOnly = false) {
  for (const rel of rels) if (disposable(scope, rel, undefined, !ownedOnly)) removeImage(scope, rel);
}

// Папка, куда класть картинки карточки: в библиотеке — images/, в хранилище — папка карточки.
function imagesDir(scope: CardScope, folder?: string): { abs: string; rel: string } | null {
  if (scope === 'library' && libraryRoot) return { abs: path.join(libraryRoot, 'images'), rel: 'images' };
  const abs = scope === 'vault' && folder !== undefined ? inside(vaultRoot, folder) : null;
  return abs ? { abs, rel: folder! } : null;
}

// Добавляет картинку к карточке: копирует файл в папку картинок. Возвращает путь от корня места хранения.
// Картинка хранилища для карточки хранилища не копируется — достаточно её пути.
// data — картинка из буфера обмена (имя и содержимое).
export function importCardImage(
  scope: CardScope,
  src: { file?: string; vaultPath?: string; data?: { name: string; data: Buffer } },
  folder?: string
): string | null {
  if (scope === 'vault' && src.vaultPath) return src.vaultPath;
  const dir = imagesDir(scope, folder);
  if (!dir) return null;
  if (src.data) {
    fs.mkdirSync(dir.abs, { recursive: true });
    const name = freeName(dir.abs, src.data.name);
    fs.writeFileSync(path.join(dir.abs, name), src.data.data, { flag: 'wx' });
    return dir.rel ? `${dir.rel}/${name}` : name;
  }
  const from = src.file ?? (src.vaultPath ? inside(vaultRoot, src.vaultPath) : null);
  if (!from || !fs.existsSync(from)) return null;
  fs.mkdirSync(dir.abs, { recursive: true });
  const name = freeName(dir.abs, path.basename(from));
  fs.copyFileSync(from, path.join(dir.abs, name), fs.constants.COPYFILE_EXCL);
  return dir.rel ? `${dir.rel}/${name}` : name;
}

// Файл библиотеки по пути от её корня (для протокола sg-asset://l/…). null — вне библиотеки.
export const resolveInLibrary = (rel: string) => {
  const abs = inside(libraryRoot, rel);
  return abs === libraryRoot ? null : abs;
};

const imageFile = (scope: CardScope, rel: string) => inside(scopeRoot(scope), rel);

// Папка карточки хранилища (для картинок с диска при правке существующей карточки).
export const folderOf = (ref: CardRef): string | undefined => {
  const file = files.get(refKey(ref));
  return ref.scope === 'vault' && file && vaultRoot ? toRel(vaultRoot, path.dirname(file)) : undefined;
};

// Черновик копии карточки для другого места (не сохраняется, пока его не сохранят в редакторе).
// Картинки, которых там не будет видно, копируются. Источник (авторство SRD) сохраняется: его требует лицензия.
// copied — картинки, скопированные для черновика: если его не сохранят, их надо убрать (discardImages).
export function copyDraft(ref: CardRef, to: CardScope, folder?: string): { card: Card; copied: string[] } | null {
  const c = getCard(ref);
  if (!c || to === 'srd') return null;
  const copied: string[] = [];
  const portraits =
    scopeRoot(ref.scope) === scopeRoot(to)
      ? [...c.portraits]
      : c.portraits
          .map((p) => {
            const file = imageFile(ref.scope, p);
            const out = file ? importCardImage(to, ref.scope === 'vault' ? { vaultPath: p } : { file }, folder) : null;
            if (out && out !== p) copied.push(out);
            return out;
          })
          .filter((p): p is string => !!p);
  return { card: { ...structuredClone(c), id: '', origin: { id: c.id, relation: 'variant' }, portraits }, copied };
}

// Перенести карточку в другое место (из хранилища в библиотеку, между приключениями). id сохраняется,
// чтобы не терялись ссылки переводов и трекера инициативы.
export function moveCard(ref: CardRef, to: CardScope, folder?: string): CardRef | null {
  const c = getCard(ref);
  const copy = copyDraft(ref, to, folder);
  const dir = targetDir(to, folder);
  if (!c || !copy || !dir) return null;
  const draft = copy.card;
  // Скопированные картинки остались на старом месте — убираем их вместе со старым файлом.
  deleteCard(ref, ref.scope === to ? [] : ownImages(ref), false);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, fileName(dir, c.name));
  writeJsonAtomic(file, { ...draft, origin: c.origin, id: c.id, format: 1 });
  remember(to, file);
  reload(to);
  changed();
  return { scope: to, id: c.id };
}

// ---------- Перенос карточек версии 0.9 ----------
// В 0.9 карточки хранилища лежали в скрытой .scrying-glass/cards/, картинки с диска — в .scrying-glass/images/.
// Теперь они переезжают в видимую папку бестиария в корне хранилища (существующую или новую «monsters»):
// к какому приключению они относятся, приложение не знает, разложить их можно переносом.
// Возвращает true, если что-то перенесено (дерево хранилища надо перечитать).
export function migrateHiddenCards(root: string, dataDir: string, tree: VaultFolder | null): boolean {
  const oldDir = path.join(root, dataDir, 'cards');
  const list = jsonFiles(oldDir);
  if (!list.length) return false;
  const folder = tree?.folders.find((f) => folderRole(f.name) === 'bestiary')?.path ?? roleNames().bestiary[0]!;
  const dir = inside(root, folder)!;
  fs.mkdirSync(dir, { recursive: true });
  const oldImages = `${dataDir}/images/`;
  for (const file of list) {
    try {
      const c = JSON.parse(fs.readFileSync(file, 'utf8')) as Card;
      const portraits = (c.portraits ?? []).map((p) => {
        if (!p.startsWith(oldImages)) return p;
        const src = inside(root, p);
        if (!src || !fs.existsSync(src)) return p;
        const name = freeName(dir, path.basename(src));
        fs.renameSync(src, path.join(dir, name));
        return `${folder}/${name}`;
      });
      const id = validId(c.id) ? c.id : path.basename(file, '.json');
      writeJsonAtomic(path.join(dir, fileName(dir, c.name || id)), { ...c, id, portraits });
      fs.rmSync(file);
    } catch (e) {
      console.error('Could not move a card', file, e);
    }
  }
  for (const d of [oldDir, path.join(root, dataDir, 'images')]) {
    try {
      fs.rmdirSync(d); // только если опустела
    } catch {
      /* остались чужие файлы — пусть лежат */
    }
  }
  return true;
}

// ---------- Импорт и экспорт ----------
//
// Файл обмена — один JSON: карточки вместе с картинками, чтобы его можно было переслать одним вложением.
//   { "scryingGlass": "cards", "version": 1, "cards": [ … ], "images": { "<имя>": "data:image/png;base64,…" } }
// Портреты карточек в файле — имена из images. Импортировать можно и одиночный файл карточки.

const MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
};
const EXT = Object.fromEntries(Object.entries(MIME).map(([ext, mime]) => [mime, ext]));

interface Bundle {
  scryingGlass: 'cards';
  version: 1;
  cards: Card[];
  images: Record<string, string>;
}

export function exportCards(refs: CardRef[], file: string): number {
  const bundle: Bundle = { scryingGlass: 'cards', version: 1, cards: [], images: {} };
  const used = new Set<string>();
  for (const ref of refs) {
    const c = getCard(ref);
    if (!c) continue;
    const portraits: string[] = [];
    for (const p of c.portraits) {
      const abs = imageFile(ref.scope, p);
      const mime = abs && MIME[path.extname(abs).toLowerCase()];
      if (!abs || !mime || !fs.existsSync(abs)) continue;
      // Имя картинки в файле: исходное, при совпадении — с номером.
      let name = path.basename(abs);
      for (let i = 2; used.has(name); i++) name = `${path.basename(abs, path.extname(abs))} (${i})${path.extname(abs)}`;
      used.add(name);
      bundle.images[name] = `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
      portraits.push(name);
    }
    bundle.cards.push({ ...c, portraits });
  }
  writeJsonAtomic(file, bundle);
  return bundle.cards.length;
}

function readImport(file: string): Bundle {
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<Bundle> & Partial<Card>;
  if (data.scryingGlass === 'cards' && Array.isArray(data.cards)) return { ...data, cards: data.cards.map(upgradeCard), images: data.images ?? {} } as Bundle;
  // Одиночная карточка: картинок при ней нет.
  if (typeof data.name === 'string' && data.stats !== undefined) {
    return { scryingGlass: 'cards', version: 1, cards: [upgradeCard({ ...(data as Card), portraits: [] })], images: {} };
  }
  throw new Error(t('core.notCards'));
}

// Таблица заклинаний LSS (номер → название) — <библиотека>/lss-spells.json. Собирает мастер из ответов API LSS
// (см. collectLssSpells); в репозиторий приложения она не входит.
const lssSpellsFile = () => (libraryRoot ? path.join(libraryRoot, 'lss-spells.json') : null);
export function lssSpellTable(): LssSpellTable {
  const file = lssSpellsFile();
  try {
    return file ? (JSON.parse(fs.readFileSync(file, 'utf8')) as LssSpellTable) : {};
  } catch {
    return {};
  }
}
// Добавить заклинания из файлов. Сколько было, сколько стало; файлы без заклинаний — в errors.
export function importLssSpells(list: string[]): { before: number; total: number; errors: string[] } {
  const table = lssSpellTable();
  const before = Object.keys(table).length;
  const errors: string[] = [];
  for (const file of list) {
    try {
      const found = collectLssSpells(JSON.parse(fs.readFileSync(file, 'utf8')));
      if (Object.keys(found).length) Object.assign(table, found);
      else errors.push(t('core.noLssSpells', { file: path.basename(file) }));
    } catch (e) {
      errors.push(`${path.basename(file)}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const file = lssSpellsFile();
  if (file) writeJsonAtomic(file, table);
  return { before, total: Object.keys(table).length, errors };
}
export function clearLssSpells() {
  const file = lssSpellsFile();
  if (file) fs.rmSync(file, { force: true });
}

// Экспорт персонажа из Long Story Short (JSON-файл) — для предпросмотра перед обновлением карточки.
export function readLss(file: string): LssImport {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!isLssExport(raw)) throw new Error(t('core.notLss'));
  return fromLss(raw, lssSpellTable());
}

// Карточка, которую этот экспорт LSS, скорее всего, обновляет: в этом месте — с тем же id в LSS, а без него —
// персонаж с тем же именем в той же папке (id в экспорте LSS нет, его достаём только из адреса аватарки).
function lssMatch(r: LssImport, to: CardScope, dir: string): CardRef | null {
  for (const [key, c] of cards) {
    if (!key.startsWith(to + ':') || c.kind !== 'character') continue;
    if (r.lssId && c.links?.lss === r.lssId) return { scope: to, id: c.id };
  }
  for (const [key, c] of cards) {
    if (!key.startsWith(to + ':') || c.kind !== 'character' || c.name.trim().toLowerCase() !== r.name.trim().toLowerCase()) continue;
    const file = files.get(key);
    if (file && path.dirname(file) === dir) return { scope: to, id: c.id };
  }
  return null;
}

// Обновить карточку персонажа из экспорта LSS: лист, имя и система — новые (или то, что мастер выбрал из
// изменений: merged), портреты, заметки, теги, сторона — прежние. Прежняя версия файла уходит в корзину приложения
// (если она включена), её можно вернуть.
export function updateFromLss(ref: CardRef, file: string, merged?: { name: string; system: string; stats: unknown }): CardRef | null {
  const r = { ...readLss(file), ...merged };
  const key = refKey(ref);
  const old = cards.get(key);
  const out = files.get(key);
  const root = scopeRoot(ref.scope);
  if (!old || !out || !root || ref.scope === 'srd') return null;
  const lss = r.lssId ?? old.links?.lss;
  const card: Card = {
    ...old,
    format: 1,
    name: r.name,
    system: r.system,
    stats: r.stats,
    ...(lss ? { links: { ...old.links, lss }, source: { title: 'Long Story Short', url: `https://longstoryshort.app/characters/digital/${lss}/` } } : {}),
  };
  const rel = path.relative(root, out).split(path.sep).join('/');
  discard(root, [rel], { title: t('core.beforeLss', { name: old.name }), kind: 'card' });
  writeJsonAtomic(out, card);
  remember(ref.scope, out);
  reload(ref.scope);
  changed();
  return ref;
}

// Персонаж из Long Story Short — новая карточка. Аватар из LSS становится её портретом.
async function importLss(r: LssImport, to: CardScope, dir: string, imgDir: { abs: string; rel: string }) {
  const portraits: string[] = [];
  if (r.avatarUrl) {
    try {
      const res = await fetch(r.avatarUrl);
      if (res.ok) {
        fs.mkdirSync(imgDir.abs, { recursive: true });
        const name = freeName(imgDir.abs, `${r.name.replace(/[/\\:*?"<>|]+/g, ' ').trim() || t('core.name.portrait')}.jpg`);
        fs.writeFileSync(path.join(imgDir.abs, name), Buffer.from(await res.arrayBuffer()));
        portraits.push(imgDir.rel ? `${imgDir.rel}/${name}` : name);
      }
    } catch {
      /* без интернета — без портрета */
    }
  }
  const id = newId(to, r.name);
  const card: Card = {
    format: 1, id, kind: 'character', system: r.system, lang: 'ru', name: r.name, side: 'party', portraits, tags: [], notes: '',
    stats: r.stats,
    ...(r.lssId ? { links: { lss: r.lssId }, source: { title: 'Long Story Short', url: `https://longstoryshort.app/characters/digital/${r.lssId}/` } } : {}),
  };
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, fileName(dir, r.name));
  writeJsonAtomic(out, card);
  remember(to, out);
  cards.set(refKey({ scope: to, id }), card);
}

// Импортирует файлы в библиотеку или папку хранилища: файлы обмена Scrying Glass, одиночные карточки и экспорт
// персонажей из Long Story Short. Карточки добавляются как новые (существующие не перезаписываются). Персонаж
// LSS, у которого в этом месте уже есть карточка (см. lssMatch), не импортируется, а возвращается в matches:
// окно покажет, что изменилось, и спросит — обновить её или создать новую (newLss — сразу новые, без вопроса).
export async function importCards(
  list: string[],
  to: CardScope,
  folder?: string,
  newLss = false
): Promise<{ count: number; errors: string[]; matches: LssMatch[]; refs: CardRef[] }> {
  const dir = targetDir(to, folder);
  const imgDir = imagesDir(to, folder);
  const matches: LssMatch[] = [];
  // The cards made (a bestiary of the Community remembers them to replace on an update).
  const refs: CardRef[] = [];
  if (to === 'srd' || !dir || !imgDir) return { count: 0, errors: [t('core.nowhere')], matches, refs };
  let count = 0;
  const errors: string[] = [];
  for (const file of list) {
    let bundle: Bundle;
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (isLssExport(raw)) {
        const r = fromLss(raw, lssSpellTable());
        const ref = newLss ? null : lssMatch(r, to, dir);
        if (ref) matches.push({ file, ref });
        else {
          await importLss(r, to, dir, imgDir);
          count++;
          errors.push(...r.warnings.map((w) => `${t('common.quote', { text: r.name })}: ${w}`));
        }
        continue;
      }
      bundle = readImport(file);
    } catch (e) {
      errors.push(`${path.basename(file)}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    // Картинки: каждая пишется один раз, даже если она у нескольких карточек.
    const saved = new Map<string, string>();
    const image = (name: string): string | null => {
      if (saved.has(name)) return saved.get(name)!;
      const m = /^data:([\w/+.-]+);base64,(.*)$/s.exec(bundle.images[name] ?? '');
      const ext = m && EXT[m[1]!];
      if (!m || !ext) return null;
      fs.mkdirSync(imgDir.abs, { recursive: true });
      const base = path.basename(name, path.extname(name)).replace(/[/\\:]/g, '_') || 'image';
      const name2 = freeName(imgDir.abs, base + ext);
      fs.writeFileSync(path.join(imgDir.abs, name2), Buffer.from(m[2]!, 'base64'));
      const rel = imgDir.rel ? `${imgDir.rel}/${name2}` : name2;
      saved.set(name, rel);
      return rel;
    };
    // Новые id: старые могли совпасть с уже существующими карточками.
    const ids = new Map<string, string>();
    for (const c of bundle.cards) {
      if (typeof c?.name !== 'string' || c.stats === undefined) continue;
      const id = newId(to, c.name);
      ids.set(c.id, id);
      cards.set(refKey({ scope: to, id }), c); // занять id до записи, чтобы newId не повторился
    }
    fs.mkdirSync(dir, { recursive: true });
    for (const c of bundle.cards) {
      const id = ids.get(c.id);
      if (!id) continue;
      const origin = c.origin && { ...c.origin, id: ids.get(c.origin.id) ?? c.origin.id };
      const card: Card = {
        ...c,
        format: 1,
        id,
        ...(origin ? { origin } : {}),
        portraits: (c.portraits ?? []).map(image).filter((p): p is string => !!p),
        tags: c.tags ?? [],
        notes: c.notes ?? '',
      };
      const out = path.join(dir, fileName(dir, c.name));
      writeJsonAtomic(out, card);
      remember(to, out);
      refs.push({ scope: to, id });
      count++;
    }
  }
  reload(to);
  changed();
  return { count, errors, matches, refs };
}

// Карточки места хранения целиком (для экспорта библиотеки или карточек хранилища; folder — одной папки).
export const cardsOf = (scope: CardScope, folder?: string): CardRef[] =>
  listCards()
    .filter((c) => c.ref.scope === scope && (folder === undefined || c.folder === folder))
    .map((c) => c.ref);
