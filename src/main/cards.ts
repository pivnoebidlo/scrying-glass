// Карточки: встроенный SRD (только чтение), библиотека пользователя и карточки текущего хранилища.
// В общее состояние приложения они не входят: его рассылают во все окна после каждого действия,
// а карточек — сотни. Окна получают краткий список и запрашивают полную карточку по ссылке.
//
// На диске: <библиотека>/cards/<id>.json и <хранилище>/.scrying-glass/cards/<id>.json.
// Картинки карточек: в библиотеке — <библиотека>/images/, в хранилище — любые картинки хранилища,
// а добавленные с диска копируются в <хранилище>/.scrying-glass/images/. Пути — от корня библиотеки
// или хранилища, через «/».
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { app, BrowserWindow } from 'electron';
import type { Card, CardRef, CardScope, CardSummary } from '../shared/cards';
import { refKey } from '../shared/cards';
import { systemOf } from '../systems';
import { freeName, writeJsonAtomic } from './files';

const cards = new Map<string, Card>();
let summaries: CardSummary[] | null = null;

let libraryRoot: string | null = null;
let vaultRoot: string | null = null;
let vaultData = '';

// Корень места хранения: от него считаются пути картинок.
export const scopeRoot = (scope: CardScope) => (scope === 'library' ? libraryRoot : scope === 'vault' ? vaultRoot : null);

function cardsDir(scope: CardScope): string | null {
  if (scope === 'library') return libraryRoot && path.join(libraryRoot, 'cards');
  if (scope === 'vault') return vaultRoot && path.join(vaultRoot, vaultData, 'cards');
  return null;
}

function imagesDir(scope: CardScope): { abs: string; rel: string } | null {
  if (scope === 'library' && libraryRoot) return { abs: path.join(libraryRoot, 'images'), rel: 'images' };
  if (scope === 'vault' && vaultRoot) return { abs: path.join(vaultRoot, vaultData, 'images'), rel: `${vaultData}/images` };
  return null;
}

// Встроенный бестиарий лежит рядом с приложением: resources/srd/<система>.json
function loadBuiltin() {
  const dir = path.join(app.getAppPath(), 'resources', 'srd');
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    console.error('Встроенный бестиарий не найден:', dir);
  }
  for (const f of files) {
    try {
      const list = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Card[];
      for (const c of list) cards.set(refKey({ scope: 'srd', id: c.id }), c);
    } catch (e) {
      console.error('Не прочитался встроенный бестиарий', f, e);
    }
  }
}

// Папка с карточками: один файл — одна карточка. Битые файлы пропускаются, но не трогаются.
// id карточки — имя файла: так копия файла под другим именем не столкнётся с оригиналом.
function loadScope(scope: CardScope) {
  for (const key of [...cards.keys()]) if (key.startsWith(scope + ':')) cards.delete(key);
  const dir = cardsDir(scope);
  if (!dir) return;
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('.'));
  } catch {
    return; // папки ещё нет — карточек тоже
  }
  for (const f of files) {
    try {
      const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Card;
      if (!c || typeof c !== 'object' || c.stats === undefined) continue;
      const id = f.slice(0, -'.json'.length);
      cards.set(refKey({ scope, id }), { ...c, id, portraits: c.portraits ?? [], tags: c.tags ?? [], notes: c.notes ?? '' });
    } catch (e) {
      console.error('Не прочитана карточка', path.join(dir, f), e);
    }
  }
}

function changed() {
  summaries = null;
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send('cards:changed');
}

export function initCards(library: string) {
  loadBuiltin();
  setLibrary(library);
}

export function setLibrary(root: string) {
  libraryRoot = root;
  loadScope('library');
  changed();
}

export const libraryPath = () => libraryRoot;

// Открыто другое хранилище (null — закрыто).
export function setCardsVault(root: string | null, dataDir: string) {
  vaultRoot = root;
  vaultData = dataDir;
  loadScope('vault');
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
  return {
    ref,
    kind: c.kind,
    system: c.system,
    lang: c.lang,
    name: c.name,
    ...(c.origin ? { origin: c.origin } : {}),
    tags: c.tags,
    portrait: c.portraits[0] ?? null,
    subtitle,
    rank,
    combat,
  };
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

// «Вождь огров» -> «vozhd-ogrov-3f9a»: читаемое имя файла и случайный хвост, чтобы не столкнуться.
function newId(scope: CardScope, name: string): string {
  const slug = [...name.toLowerCase()]
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  for (;;) {
    const id = `${slug || 'card'}-${randomBytes(2).toString('hex')}`;
    if (!cards.has(refKey({ scope, id }))) return id;
  }
}

// Сохраняет карточку в библиотеку или хранилище. Пустой id — новая карточка. Возвращает ссылку на неё.
export function saveCard(scope: CardScope, card: Card): CardRef {
  const dir = cardsDir(scope);
  if (scope === 'srd' || !dir) throw new Error('Сюда сохранять нельзя');
  const id = card.id && /^[\w.-]+$/.test(card.id) ? card.id : newId(scope, card.name);
  writeJsonAtomic(path.join(dir, `${id}.json`), { ...card, id, format: 1 });
  loadScope(scope);
  changed();
  return { scope, id };
}

// Удаляет карточку (только файл карточки: картинки остаются на месте).
export function deleteCard(ref: CardRef) {
  const dir = cardsDir(ref.scope);
  if (ref.scope === 'srd' || !dir || !/^[\w.-]+$/.test(ref.id)) return;
  fs.rmSync(path.join(dir, `${ref.id}.json`), { force: true });
  loadScope(ref.scope);
  changed();
}

// Добавляет картинку к карточке: копирует файл в папку картинок места хранения. Возвращает путь от его корня.
// Картинка хранилища для карточки хранилища не копируется — достаточно её пути.
export function importCardImage(scope: CardScope, src: { file?: string; vaultPath?: string }): string | null {
  if (scope === 'vault' && src.vaultPath) return src.vaultPath;
  const from = src.file ?? (src.vaultPath && vaultRoot ? path.join(vaultRoot, ...src.vaultPath.split('/')) : null);
  const dir = imagesDir(scope);
  if (!from || !dir || !fs.existsSync(from)) return null;
  fs.mkdirSync(dir.abs, { recursive: true });
  const name = freeName(dir.abs, path.basename(from));
  fs.copyFileSync(from, path.join(dir.abs, name), fs.constants.COPYFILE_EXCL);
  return `${dir.rel}/${name}`;
}

// Файл библиотеки по пути от её корня (для протокола sg-asset://l/…). null — вне библиотеки.
export function resolveInLibrary(rel: string): string | null {
  if (!libraryRoot) return null;
  const abs = path.resolve(libraryRoot, ...rel.split('/'));
  return abs.startsWith(libraryRoot + path.sep) ? abs : null;
}

// Абсолютный путь картинки карточки.
function imageFile(scope: CardScope, rel: string): string | null {
  const root = scopeRoot(scope);
  if (!root) return null;
  const abs = path.resolve(root, ...rel.split('/'));
  return abs.startsWith(root + path.sep) ? abs : null;
}

// Черновик копии карточки для другого места хранения (не сохраняется, пока его не сохранят в редакторе).
// Картинки, которых там не будет видно, копируются. Источник (авторство SRD) сохраняется: его требует лицензия.
export function copyDraft(ref: CardRef, to: CardScope): Card | null {
  const c = getCard(ref);
  if (!c || to === 'srd') return null;
  const portraits =
    ref.scope === to
      ? [...c.portraits]
      : c.portraits
          .map((p) => {
            const file = imageFile(ref.scope, p);
            return file ? importCardImage(to, ref.scope === 'vault' ? { vaultPath: p } : { file }) : null;
          })
          .filter((p): p is string => !!p);
  return { ...structuredClone(c), id: '', origin: { id: c.id, relation: 'variant' }, portraits };
}

// Перенести карточку в другое место хранения (например, из кампании в библиотеку).
export function moveCard(ref: CardRef, to: CardScope): CardRef | null {
  const draft = copyDraft(ref, to);
  if (!draft) return null;
  const c = getCard(ref)!;
  const saved = saveCard(to, { ...draft, origin: c.origin, id: newId(to, c.name) });
  deleteCard(ref);
  return saved;
}
