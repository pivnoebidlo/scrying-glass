// Заметки журнала в окне управления: папки журнала текущего приключения и общие (вне приключений). Тексты читаются
// через ядро и перечитываются после каждого пересканирования хранилища (заметку сохранили здесь или поправили снаружи).
import { connectNotes, notes } from '../../../renderer/lib/note/notes.svelte';
import { store } from '../../../renderer/lib/store.svelte';
import { placeOrder, placeTitle, roleFolderHere, visibleIn } from '../../../shared/adventures';
import { searchKey } from '../../../shared/compendium';
import { isPdf, pagePreview, pageTitle, splitProps } from '../../../shared/journal';
import { allFiles, dirname, roleFolders, roleNames, type VaultFolder } from '../../../shared/vault';

export interface PageItem {
  path: string;
  title: string;
  text: string;
}

// Корень журнала: папка роли и подпись места («Праздник урожая», «Общее»).
export interface JournalRoot {
  folder: VaultFolder;
  title: string;
  order: number;
}

export const journal = $state({ pages: [] as PageItem[], loaded: false });

export function journalRoots(): JournalRoot[] {
  const app = store.state;
  const tree = app.vault.tree;
  if (!tree) return [];
  return roleFolders(tree, 'journal', app.vault.name)
    .filter((r) => visibleIn(app.adventures, r.folder.path))
    .map((r) => {
      const dir = dirname(r.folder.path);
      return { folder: r.folder, title: placeTitle(app.adventures, dir, app.vault.name), order: placeOrder(app.adventures, dir) };
    })
    .sort((a, b) => a.order - b.order);
}

let loadedFor = '';
export async function loadPages() {
  connectNotes();
  const paths = journalRoots().flatMap((r) => allFiles(r.folder, 'page').map((f) => f.path));
  const key = notes.rev + '|' + paths.join('|');
  if (key === loadedFor) return;
  loadedFor = key;
  const list = await Promise.all(paths.map(async (path) => ({ path, title: pageTitle(path), text: (await window.api.readPage(path)) ?? '' })));
  if (loadedFor !== key) return;
  journal.pages = list;
  journal.loaded = true;
}

export const pageAt = (path: string | null | undefined) => (path ? journal.pages.find((p) => p.path === path) : undefined);

// PDF files of the visible journal folders (books and adventures to read during the game).
export interface PdfItem {
  path: string;
  title: string;
}
export const journalPdfs = (): PdfItem[] => journalRoots().flatMap((r) => allFiles(r.folder, 'pdf').map((f) => ({ path: f.path, title: pageTitle(f.path) })));
export const pdfAt = (path: string | null | undefined): PdfItem | undefined => (path && isPdf(path) ? journalPdfs().find((p) => p.path === path) : undefined);

// [[Book]] or [[Book#12]] to a PDF — by its name, like a note; the adventure's first.
export function resolvePdf(name: string): PdfItem | null {
  const k = searchKey(name.trim());
  const adv = store.state.adventures;
  return journalPdfs().filter((p) => searchKey(p.title) === k).sort((a, b) => placeOrder(adv, a.path) - placeOrder(adv, b.path))[0] ?? null;
}

// [[Ссылка]] на заметку — по названию, без регистра и «ё»; заметка приключения важнее общей.
export function resolvePage(name: string): PageItem | null {
  const k = searchKey(name.trim());
  const hits = journal.pages.filter((p) => searchKey(p.title) === k);
  const adv = store.state.adventures;
  return hits.sort((a, b) => placeOrder(adv, a.path) - placeOrder(adv, b.path))[0] ?? null;
}

// Поиск: по названию и тексту; совпадение в названии — выше.
export function searchPages(query: string): PageItem[] {
  const q = searchKey(query.trim());
  if (!q) return journal.pages;
  return journal.pages
    .map((p) => {
      const t = searchKey(p.title);
      return { p, s: t === q ? 0 : t.startsWith(q) ? 1 : t.includes(q) ? 2 : searchKey(splitProps(p.text).body).includes(q) ? 3 : -1 };
    })
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s)
    .map((x) => x.p);
}

export const preview = (p: PageItem) => pagePreview(p.text);

// Папка журнала для новой заметки: в текущем приключении (null — общая, в корне хранилища); её нет — создастся
// с основным названием роли.
export function journalFolder(place: string | null): string {
  const app = store.state;
  const here = app.vault.tree ? roleFolderHere(app.vault.tree, { ...app.adventures, current: place }, 'journal') : null;
  const name = roleNames().journal[0]!;
  return here?.path ?? (place ? `${place}/${name}` : name);
}
