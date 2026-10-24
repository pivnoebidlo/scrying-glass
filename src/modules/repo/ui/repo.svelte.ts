// Adventure sources in the control window: the catalogs of every source turned on, covers, what is being done right
// now (packing, uploading, downloading — with progress), the catalog window, the publish dialog and the download
// flow. The work is the core's (main/repo.ts); here — the window's side and the words for its errors.
import { t } from '../../../renderer/lib/i18n.svelte';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { systems } from '../../../systems';
import { sourceOf, type RepoCatalog, type RepoEntry, type RepoInfo, type RepoProgress, type BlockedEntry, type Report, type ReportedEntry, type ReportReason, type SourceInfo } from '../../../shared/repo';

// An entry of a catalog with the source it is in.
export type Found = RepoEntry & { source: string };

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
  // New versions of what this vault downloaded, found on launch and not announced yet.
  updates: [] as { key: string; entry: Found }[],
  covers: {} as Record<string, string | null>,
  // What is going on and how far (null — nothing).
  busy: null as { what: string; progress: RepoProgress | null } | null,
  // The publish dialog: for which adventure; for which system pack (its id).
  publish: null as string | null,
  publishSystem: null as string | null,
  // A download waits for a name: the adventure of that name is already there.
  naming: null as { file: string; name: string; suggestion: string; entry: Found } | null,
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
export function openRepo(show: 'all' | 'updates' = 'all') {
  repo.startShow = show;
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
  return [...adventures, ...packs];
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

export async function publishSystem(p: { source: string; pack: string; title: string; description: string; lang: string }) {
  const entry = await work(t('repo.publishing', { name: p.title }), () => window.api.repoPublishSystem(p));
  if (!entry) return false;
  notice(t('repo.published', { name: entry.title, version: entry.version }));
  repo.info = await window.api.repoInfo();
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
  if (!Object.keys(store.state.repo.installed).length && !Object.keys(repo.info?.systems.installed ?? {}).length) return;
  await loadCatalogs();
  const told = new Set<string>(JSON.parse(localStorage.getItem(ANNOUNCED) ?? '[]'));
  repo.updates = updatesHere().filter((u) => !told.has(stamp(u)));
}

// The notice is seen (closed or followed): these versions aren't announced again.
export function updatesSeen() {
  const told = new Set<string>(JSON.parse(localStorage.getItem(ANNOUNCED) ?? '[]'));
  for (const u of repo.updates) told.add(stamp(u));
  localStorage.setItem(ANNOUNCED, JSON.stringify([...told].slice(-500)));
  repo.updates = [];
}

export async function publish(p: { source: string; adventure: string; title: string; description: string; lang: string; music: boolean; pdf: boolean; cover?: string }) {
  const entry = await work(t('repo.publishing', { name: p.title }), () => window.api.repoPublish(p));
  if (!entry) return false;
  notice(t('repo.published', { name: entry.title, version: entry.version }));
  repo.info = await window.api.repoInfo();
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
