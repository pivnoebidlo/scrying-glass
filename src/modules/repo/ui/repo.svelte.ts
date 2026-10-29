// Adventure sources in the control window: the catalogs of every source turned on, covers, what is being done right
// now (packing, uploading, downloading — with progress), the catalog window, the publish dialog and the download
// flow. The work is the core's (main/repo.ts); here — the window's side and the words for its errors.
import { t } from '../../../renderer/lib/i18n.svelte';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { isEnabled, systems } from '../../../systems';
import type { CardRef } from '../../../shared/cards';
import { PLUGINS } from '../../../systems/plugins';
import { OFFICIAL_AUTHOR, OFFICIAL_SOURCE, sourceOf, type RepoCatalog, type RepoEntry, type RepoInfo, type RepoProgress, type BlockedEntry, type Report, type ReportedEntry, type ReportReason, type SourceInfo } from '../../../shared/repo';

// An entry of a catalog with the source it is in.
export type Found = RepoEntry & { source: string };
// The kinds of things in the Community (the «What» of the window).
export type What = 'everything' | 'adventures' | 'supplements' | 'systems' | 'bestiaries';

export const repo = $state({
  info: null as RepoInfo | null,
  // By source id: its catalog, or why there is none.
  catalogs: {} as Record<string, { catalog: RepoCatalog | null; error: string; loading: boolean }>,
  // Complaints, by source id — only of the repositories the GM is the admin of.
  reports: {} as Record<string, ReportedEntry[]>,
  // Blocked entries, by source id — same.
  blocked: {} as Record<string, BlockedEntry[]>,
  // The complaint dialog: about which entry.
  reporting: null as Found | null,
  // The catalog window is open; the filter it opens with.
  browsing: false,
  startShow: 'all' as 'all' | 'updates',
  startWhat: 'everything' as What,
  // Opened from a section of the settings: closing goes back there.
  backTo: null as string | null,
  // New versions of what this vault downloaded, found on launch and not announced yet.
  updates: [] as { key: string; entry: Found }[],
  covers: {} as Record<string, string | null>,
  // What is going on and how far (null — nothing).
  busy: null as { what: string; progress: RepoProgress | null } | null,
  // The publish dialog: for which adventure; for which system pack (its id).
  publish: null as string | null,
  publishSystem: null as string | null,
  // The bestiary publish dialog is open; a folder — for that bestiary (the Adventures tab).
  publishBestiary: false as boolean | string,
  // A download waits for a name: the adventure of that name is already there.
  naming: null as { file: string; name: string; suggestion: string; entry: Found } | null,
  // The reminder to save the author's key is put off until then (ms; KeyReminder.svelte).
  // The recovery words window: show the key's words, or type words to get the key back.
  words: null as 'show' | 'restore' | null,
  keyLater: Number(localStorage.getItem('sg.repo.keyLater') ?? 0) || 0,
  // The last result to show (done or failed).
  notice: '',
});

let listening = false;
export async function loadInfo() {
  if (!listening) {
    listening = true;
    window.api.onRepoProgress((p) => repo.busy && (repo.busy.progress = p));
  }
  repo.info = await window.api.repoInfo();
}

// An error of the core in words: `repo:<code>` → repo.err.<code>, anything else as it is. The code is the last
// `repo:…` of the message: before it Electron names the call (`Error invoking remote method 'repo:publish'`).
export function errorText(e: unknown): string {
  const m = [...String(e).matchAll(/repo:([a-z0-9-]+)(?![A-Za-z])/g)].at(-1);
  if (!m) return String(e).replace(/^Error: (Error invoking remote method '[^']+': )?(Error: )?/, '');
  const key = `repo.err.${m[1]}`;
  const text = t(key as never);
  return text === key ? t('repo.err.other', { code: m[1]! }) : text;
}

export const sourceName = (s: SourceInfo) => (s.official ? t('repo.official') : s.name);
export const sourcesOn = () => (repo.info?.sources ?? []).filter((s) => !s.off);

async function loadSource(id: string) {
  const was = repo.catalogs[id];
  repo.catalogs[id] = { catalog: was?.catalog ?? null, error: '', loading: true };
  try {
    repo.catalogs[id] = { catalog: await window.api.repoCatalog(id), error: '', loading: false };
  } catch (e) {
    repo.catalogs[id] = { catalog: null, error: errorText(e), loading: false };
  }
  if (repo.info?.sources.find((s) => s.id === id)?.admin) {
    [repo.reports[id], repo.blocked[id]] = await Promise.all([window.api.repoAdminReports(id).catch(() => []), window.api.repoAdminBlocked(id).catch(() => [])]);
  } else {
    delete repo.reports[id];
    delete repo.blocked[id];
  }
}

export const isAdmin = (source: string) => !!repo.info?.sources.find((s) => s.id === source)?.admin;
export const reportsOf = (e: Found): Report[] => repo.reports[e.source]?.find((r) => r.author === e.author && r.id === e.id)?.reports ?? [];

// The catalogs of every source turned on (one source — only it).
export async function loadCatalogs(only?: string) {
  if (!repo.info) await loadInfo();
  await Promise.all(sourcesOn().filter((s) => !only || s.id === only).map((s) => loadSource(s.id)));
}

// Every entry of the sources turned on.
export function allFound(): Found[] {
  return sourcesOn().flatMap((s) => (repo.catalogs[s.id]?.catalog?.entries ?? []).map((e) => ({ ...e, source: s.id })));
}

// Covers are asked for once each; the answer comes later (state is not changed while a page is drawn).
const asked = new Set<string>();
export function coverOf(e: Found): string | null {
  const k = `${e.source}/${e.author}/${e.id}/${e.version}`;
  if (!asked.has(k)) {
    asked.add(k);
    void window.api.repoCover(e.source, e.author, e.id, e.version).then((url) => (repo.covers[k] = url));
  }
  return repo.covers[k] ?? null;
}

function notice(text: string) {
  repo.notice = text;
  setTimeout(() => repo.notice === text && (repo.notice = ''), 8000);
}

async function work<T>(what: string, fn: () => Promise<T>): Promise<T | undefined> {
  if (repo.busy) return undefined;
  repo.busy = { what, progress: null };
  try {
    return await fn();
  } catch (e) {
    notice(t('repo.failed', { error: errorText(e) }));
    return undefined;
  } finally {
    repo.busy = null;
  }
}

// Open the catalog window (on the updates of what was downloaded — after the launch notice).
export function openRepo(show: 'all' | 'updates' = 'all', what: What = 'everything', from: string | null = null) {
  repo.startShow = show;
  repo.startWhat = what;
  repo.backTo = from;
  repo.browsing = true;
  void loadCatalogs();
}

// What was downloaded and has a newer version in its source: the adventures of this vault (key — the folder) and
// the system packs of the library (key — the pack's id).
export function updatesHere(): { key: string; entry: Found }[] {
  const found = allFound();
  const newer = (m: { author: string; id: string; version: number; source?: string }) =>
    found.find((e) => e.source === sourceOf(m) && e.author === m.author && e.id === m.id && e.version > m.version);
  const adventures = Object.entries(store.state.repo.installed)
    .filter(([folder]) => store.state.adventures.list.includes(folder))
    .flatMap(([folder, m]) => (newer(m) ? [{ key: folder, entry: newer(m)! }] : []));
  const packs = Object.entries(repo.info?.systems.installed ?? {}).flatMap(([pack, m]) => (newer(m) ? [{ key: `system:${pack}`, entry: newer(m)! }] : []));
  const beasts = Object.entries(repo.info?.bestiaries.installed ?? {}).flatMap(([key, m]) => (newer(m) ? [{ key: `bestiary:${key}`, entry: newer(m)! }] : []));
  const content = Object.entries(repo.info?.content.installed ?? {}).flatMap(([id, m]) => (newer(m) ? [{ key: `content:${id}`, entry: newer(m)! }] : []));
  return [...adventures, ...packs, ...beasts, ...content];
}

// A system pack downloaded: which version this library has (0 — none).
export const systemVersion = (e: Found) =>
  Object.values(repo.info?.systems.installed ?? {}).find((m) => m.source === e.source && m.author === e.author && m.id === e.id)?.version ?? 0;
// The system an adventure needs and this app doesn't have: its entry in a catalog (null — known, or nowhere to get).
export function missingSystem(e: Found): Found | null {
  if (e.kind === 'system' || systems.some((s) => s.id === e.system)) return null;
  return allFound().find((x) => x.kind === 'system' && x.system === e.system) ?? null;
}
export const systemKnown = (id: string) => systems.some((s) => s.id === id);

// A downloaded bestiary: which version the library has (0 — none).
const bestiaryKey = (e: Found) => `${e.source}/${e.author}/${e.id}`;
export const bestiaryVersion = (e: Found) => repo.info?.bestiaries.installed[bestiaryKey(e)]?.version ?? 0;

// Content of a system (shared/content.ts) downloaded: its id in the library and the version (0 — none).
const contentMark = (e: Found) => Object.entries(repo.info?.content.installed ?? {}).find(([, m]) => m.source === e.source && m.author === e.author && m.id === e.id);
// Only while it lies in the library: a mark alone may be stale (the folder removed by hand).
export const contentVersion = (e: Found) => {
  const m = contentMark(e);
  return m && store.state.vault.content.some((c) => c.id === m[0]) ? m[1].version : 0;
};

export async function installContent(e: Found): Promise<boolean> {
  const { source, ...entry } = $state.snapshot(e) as Found;
  const m = await work(t('repo.downloading', { name: e.title }), () => window.api.repoInstallContent(source, entry));
  if (!m) return false;
  repo.info = await window.api.repoInfo();
  notice(t('repo.contentInstalled', { name: e.title }));
  return true;
}

export async function removeContent(id: string, title: string) {
  if (!confirm(t('repo.contentRemoveAsk', { name: title }))) return;
  if (await window.api.removeContent(id)) {
    repo.info = await window.api.repoInfo();
    notice(t('repo.contentRemoved', { name: title }));
  }
}
// The id in the library of a downloaded entry of content (to remove it from the catalog).
export const contentIdOf = (e: Found) => contentMark(e)?.[0] ?? null;

// The official content of a family that the library doesn't have (D&D: its SRD), from the catalogs loaded.
export const officialContent = (family: string) =>
  allFound().filter((e) => e.kind === 'content' && e.system === family && e.author === OFFICIAL_AUTHOR && e.source === OFFICIAL_SOURCE);

export async function installBestiary(e: Found) {
  const { source, ...entry } = $state.snapshot(e) as Found;
  const n = await work(t('repo.downloading', { name: e.title }), () => window.api.repoInstallBestiary(source, entry));
  if (!n) return;
  repo.info = await window.api.repoInfo();
  notice(t('repo.bestiaryInstalled', { name: e.title, count: n }));
}

export async function removeBestiary(e: Found) {
  if (!confirm(t('repo.bestiaryRemoveAsk', { name: e.title }))) return;
  if (await window.api.repoRemoveBestiary(bestiaryKey(e))) {
    repo.info = await window.api.repoInfo();
    notice(t('repo.bestiaryRemoved', { name: e.title }));
  }
}

export async function publishBestiary(p: { source: string; refs: CardRef[]; title: string; description: string; lang: string; cover?: string; id?: string }) {
  const entry = await work(t('repo.publishing', { name: p.title }), () => window.api.repoPublishBestiary(p));
  if (!entry) return false;
  notice(t('repo.published', { name: entry.title, version: entry.version }));
  repo.info = await window.api.repoInfo();
  remindKey();
  void loadCatalogs(p.source);
  return true;
}

export async function publishSystem(p: { source: string; pack: string; title: string; description: string; lang: string; cover?: string }) {
  const entry = await work(t('repo.publishing', { name: p.title }), () => window.api.repoPublishSystem(p));
  if (!entry) return false;
  notice(t('repo.published', { name: entry.title, version: entry.version }));
  repo.info = await window.api.repoInfo();
  remindKey();
  void loadCatalogs(p.source);
  return true;
}

export async function installSystem(e: Found) {
  const { source, ...entry } = $state.snapshot(e) as Found;
  const id = await work(t('repo.downloading', { name: e.title }), () => window.api.repoInstallSystem(source, entry));
  if (!id) return;
  repo.info = await window.api.repoInfo();
  notice(t('repo.systemInstalled', { name: e.title }));
}

// The author's key lives only on this computer until it is saved to a file: after a publish the reminder shows again
// even if it was put off; «Later» puts it off for a few days.
const KEY_LATER = 'sg.repo.keyLater';
export function remindKey(later = 0) {
  repo.keyLater = later;
  try {
    localStorage.setItem(KEY_LATER, String(later));
  } catch {
    // Only a convenience.
  }
}

// On launch (if the GM didn't turn it off): what has a new version since the last time it was told. A version is
// announced once (the window remembers which, localStorage); things other than adventures will join this list.
const CHECK = 'sg.repo.checkUpdates';
const ANNOUNCED = 'sg.repo.announced';
const stamp = (u: { entry: Found }) => `${u.entry.source}/${u.entry.author}/${u.entry.id}/${u.entry.version}`;
export const checkOnLaunch = () => localStorage.getItem(CHECK) !== 'off';
export const setCheckOnLaunch = (on: boolean) => localStorage.setItem(CHECK, on ? 'on' : 'off');

export async function checkUpdates() {
  if (!checkOnLaunch()) return;
  if (!repo.info) await loadInfo();
  const have = [store.state.repo.installed, repo.info?.systems.installed ?? {}, repo.info?.bestiaries.installed ?? {}];
  if (!have.some((m) => Object.keys(m).length)) return;
  await loadCatalogs();
  const told = new Set<string>(JSON.parse(localStorage.getItem(ANNOUNCED) ?? '[]'));
  repo.updates = updatesHere().filter((u) => !told.has(stamp(u)));
}

// Families of the system plugins turned on that have no content installed: their official content is downloaded
// once (until 0.65 D&D's SRD came with the installer — an update must not lose it; a first launch gets it too).
// Removed by the GM later — not downloaded again. Offline — tried on the next launch.
const AUTO_CONTENT = 'sg.content.auto';
export async function autoContent() {
  let done: string[] = [];
  try {
    done = JSON.parse(localStorage.getItem(AUTO_CONTENT) ?? '[]') as string[];
  } catch {
    // A convenience only.
  }
  const families = [...new Set(PLUGINS.flatMap((p) => p.systems).filter((s) => isEnabled(s.id)).map((s) => s.family))].filter(
    (f) => !done.includes(f) && !store.state.vault.content.some((c) => c.family === f),
  );
  if (!families.length) return;
  await loadCatalogs(OFFICIAL_SOURCE);
  for (const f of families) {
    const list = officialContent(f);
    if (!list.length) continue;
    let got = false;
    for (const e of list) got = (await installContent(e)) || got;
    if (got) done.push(f);
  }
  try {
    localStorage.setItem(AUTO_CONTENT, JSON.stringify(done));
  } catch {
    // A convenience only.
  }
}

// The notice is seen (closed or followed): these versions aren't announced again.
export function updatesSeen() {
  const told = new Set<string>(JSON.parse(localStorage.getItem(ANNOUNCED) ?? '[]'));
  for (const u of repo.updates) told.add(stamp(u));
  localStorage.setItem(ANNOUNCED, JSON.stringify([...told].slice(-500)));
  repo.updates = [];
}

export async function publish(p: { source: string; adventure: string; title: string; description: string; lang: string; music: boolean; pdf: boolean; cover?: string; id?: string | null }) {
  const entry = await work(t('repo.publishing', { name: p.title }), () => window.api.repoPublish(p));
  if (!entry) return false;
  notice(t('repo.published', { name: entry.title, version: entry.version }));
  repo.info = await window.api.repoInfo();
  remindKey();
  void loadCatalogs(p.source);
  return true;
}

export async function unpublish(e: Found) {
  if (!confirm(t('repo.unpublishAsk', { name: e.title }))) return;
  const ok = await work(t('repo.unpublishing'), async () => (await window.api.repoUnpublish(e.source, e.id), true));
  if (ok) {
    notice(t('repo.unpublished', { name: e.title }));
    void loadCatalogs(e.source);
  }
}

export async function report(e: Found, reason: ReportReason, text: string) {
  repo.reporting = null;
  const ok = await work(t('repo.reporting'), async () => (await window.api.repoReport(e.source, e.author, e.id, reason, text), true));
  if (ok) notice(t('repo.reported'));
}

// The admin takes an entry down (blocked — the author can't publish it again).
export async function adminRemove(e: Found, block: boolean) {
  if (!confirm(t(block ? 'repo.admin.blockAsk' : 'repo.admin.removeAsk', { name: e.title }))) return;
  const ok = await work(t('repo.unpublishing'), async () => (await window.api.repoAdminRemove(e.source, e.author, e.id, block), true));
  if (ok) {
    notice(t('repo.unpublished', { name: e.title }));
    void loadCatalogs(e.source);
  }
}

export async function dismiss(e: Found) {
  const ok = await work(t('repo.admin.dismissing'), async () => (await window.api.repoAdminDismiss(e.source, e.author, e.id), true));
  if (ok) void loadCatalogs(e.source);
}

// A blocked entry with its source.
export type Blocked = BlockedEntry & { source: string };

export async function unblock(b: Blocked) {
  if (!confirm(t('repo.admin.unblockAsk', { name: b.title }))) return;
  const ok = await work(t('repo.admin.unblocking'), async () => (await window.api.repoAdminUnblock(b.source, b.author, b.id), true));
  if (ok) {
    notice(t('repo.admin.unblocked', { name: b.title }));
    void loadCatalogs(b.source);
  }
}

// The vault's folder an entry was installed to (the newest if several).
export function installedFolder(e: Found): string | null {
  const marks = Object.entries(store.state.repo.installed).filter(([, m]) => m.author === e.author && m.id === e.id && sourceOf(m) === e.source);
  return marks.sort(([, a], [, b]) => b.version - a.version)[0]?.[0] ?? null;
}

// Download and install. An update first offers to move the old copy to the trash (and takes its name).
export async function install(e: Found) {
  if (e.kind === 'system') return installSystem(e);
  if (e.kind === 'content') return installContent(e);
  if (e.kind === 'bestiary') return installBestiary(e);
  const old = installedFolder(e);
  const got = await work(t('repo.downloading', { name: e.title }), () => window.api.repoDownload(e.source, e.author, e.id));
  if (!got) return;
  let name = got.name;
  let exists = got.exists;
  if (old && store.state.adventures.list.includes(old) && (await window.api.deleteAdventure(old))) {
    name = old;
    exists = false;
  }
  if (exists && name === got.name) {
    repo.naming = { file: got.file, name: got.name, suggestion: got.suggestion, entry: e };
    return;
  }
  await finishInstall(got.file, name, e);
}

export async function finishInstall(file: string, name: string, e: Found) {
  repo.naming = null;
  const { source, ...entry } = $state.snapshot(e) as Found;
  const r = await work(t('repo.installing'), () => window.api.repoInstall(file, name, entry, source));
  if (r) {
    const need = systemKnown(e.system) ? null : e.system;
    notice(need ? t('repo.installedNeeds', { name: r.name, system: missingSystem(e)?.title ?? need }) : t('repo.installed', { name: r.name }));
    await dispatch('adventures', 'select', { path: r.name });
  }
}

export function cancelNaming() {
  if (repo.naming) void window.api.repoDiscard(repo.naming.file);
  repo.naming = null;
}

export const mb = (n: number) => (n < 1024 * 1024 ? t('repo.kb', { n: Math.max(1, Math.round(n / 1024)) }) : t('repo.mb', { n: (n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) }));
