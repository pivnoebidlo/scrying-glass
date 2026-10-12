// Карточки: встроенный SRD (только чтение), библиотека пользователя и карточки текущего хранилища.
// В общее состояние приложения они не входят: его рассылают во все окна после каждого действия,
// а карточек — сотни. Окна получают краткий список и запрашивают полную карточку по ссылке.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { app, BrowserWindow } from 'electron';
import type { Card, CardRef, CardScope, CardSummary } from '../shared/cards';
import { refKey } from '../shared/cards';
import { systemOf } from '../systems';

const cards = new Map<string, Card>();
let summaries: CardSummary[] | null = null;

let libraryDir: string | null = null;
let vaultDir: string | null = null;

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
function loadDir(scope: CardScope, dir: string | null) {
  for (const key of [...cards.keys()]) if (key.startsWith(scope + ':')) cards.delete(key);
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
      if (c && typeof c.id === 'string' && c.stats !== undefined) cards.set(refKey({ scope, id: c.id }), c);
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
  libraryDir = path.join(library, 'cards');
  loadDir('library', libraryDir);
}

// Открыто другое хранилище (null — закрыто).
export function setCardsVault(root: string | null, dataDir: string) {
  vaultDir = root ? path.join(root, dataDir, 'cards') : null;
  loadDir('vault', vaultDir);
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
    tags: c.tags ?? [],
    portrait: c.portraits?.[0] ?? null,
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
