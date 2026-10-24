// The adventure repository in the control window: the catalog, covers, what is being done right now (packing,
// uploading, downloading — with progress), the publish dialog and the download flow. The work is the core's
// (main/repo.ts); here — the window's side and the words for its errors.
import { t } from '../../../renderer/lib/i18n.svelte';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { openTab } from '../../../renderer/lib/nav';
import type { RepoCatalog, RepoEntry, RepoInfo, RepoProgress } from '../../../shared/repo';
import { ui as tools } from '../../tools/ui/ui.svelte';

export const repo = $state({
  info: null as RepoInfo | null,
  catalog: null as RepoCatalog | null,
  loading: false,
  error: '',
  covers: {} as Record<string, string | null>,
  // What is going on and how far (null — nothing).
  busy: null as { what: string; progress: RepoProgress | null } | null,
  // The publish dialog: for which adventure.
  publish: null as string | null,
  // A download waits for a name: the adventure of that name is already there.
  naming: null as { file: string; name: string; suggestion: string; entry: RepoEntry } | null,
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

// An error of the core in words: `repo:<code>` → repo.err.<code>, anything else as it is.
export function errorText(e: unknown): string {
  const m = /repo:([a-z0-9-]+)/.exec(String(e));
  if (!m) return String(e).replace(/^Error: (Error invoking remote method '[^']+': )?(Error: )?/, '');
  const key = `repo.err.${m[1]}`;
  const text = t(key as never);
  return text === key ? t('repo.err.other', { code: m[1]! }) : text;
}

export async function loadCatalog() {
  repo.loading = true;
  repo.error = '';
  try {
    if (!repo.info) await loadInfo();
    repo.catalog = await window.api.repoCatalog();
  } catch (e) {
    repo.error = errorText(e);
  } finally {
    repo.loading = false;
  }
}

// Covers are asked for once each; the answer comes later (state is not changed while a page is drawn).
const asked = new Set<string>();
export function coverOf(e: RepoEntry): string | null {
  const k = `${e.author}/${e.id}/${e.version}`;
  if (!asked.has(k)) {
    asked.add(k);
    void window.api.repoCover(e.author, e.id, e.version).then((url) => (repo.covers[k] = url));
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

// Open the repository page in Tools.
export function openRepo() {
  tools.tool = 'repo';
  tools.note = null;
  openTab('tools');
}

export async function publish(p: { adventure: string; title: string; description: string; lang: string; music: boolean; cover?: string }) {
  const entry = await work(t('repo.publishing', { name: p.title }), () => window.api.repoPublish(p));
  if (!entry) return false;
  notice(t('repo.published', { name: entry.title, version: entry.version }));
  repo.info = await window.api.repoInfo();
  void loadCatalog();
  return true;
}

export async function unpublish(e: RepoEntry) {
  if (!confirm(t('repo.unpublishAsk', { name: e.title }))) return;
  const ok = await work(t('repo.unpublishing'), async () => (await window.api.repoUnpublish(e.id), true));
  if (ok) {
    notice(t('repo.unpublished', { name: e.title }));
    void loadCatalog();
  }
}

// The vault's folder an entry was installed to (the newest if several).
export function installedFolder(e: RepoEntry): string | null {
  const marks = Object.entries(store.state.repo.installed).filter(([, m]) => m.author === e.author && m.id === e.id);
  return marks.sort(([, a], [, b]) => b.version - a.version)[0]?.[0] ?? null;
}

// Download and install. An update first offers to move the old copy to the trash (and takes its name).
export async function install(e: RepoEntry) {
  const old = installedFolder(e);
  const got = await work(t('repo.downloading', { name: e.title }), () => window.api.repoDownload(e.author, e.id));
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

export async function finishInstall(file: string, name: string, e: RepoEntry) {
  repo.naming = null;
  const r = await work(t('repo.installing'), () => window.api.repoInstall(file, name, $state.snapshot(e) as RepoEntry));
  if (r) {
    notice(t('repo.installed', { name: r.name }));
    await dispatch('adventures', 'select', { path: r.name });
  }
}

export function cancelNaming() {
  if (repo.naming) void window.api.repoDiscard(repo.naming.file);
  repo.naming = null;
}

export const mb = (n: number) => (n < 1024 * 1024 ? t('repo.kb', { n: Math.max(1, Math.round(n / 1024)) }) : t('repo.mb', { n: (n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) }));
