<!-- Files dragged in from Finder or Explorer — and ⌘V in such a tab (files copied in Finder or Explorer, or a picture):
     dropped on a module's icon in the ribbon or on its open tab — backgrounds,
     characters, maps, handouts, music — they are copied into that role's folder of the current adventure (without an
     adventure — of the whole vault), the ones the role does not take are skipped. While dragging, the target is framed
     with where the files will go. The app's own drags (tiles, the tray) carry no files and are left alone. -->
<script lang="ts">
  import { roleFolderHere } from '../../shared/adventures';
  import { roleAccepts, type FolderRole } from '../../shared/vault';
  import { matches } from '../../shared/hotkeys';
  import { t } from '../lib/i18n.svelte';
  import { dispatch, store } from '../lib/store.svelte';
  import { workspace } from './workspace.svelte';

  const ROLE_OF: Record<string, FolderRole> = { scene: 'backgrounds', portraits: 'characters', maps: 'maps', handouts: 'handouts', music: 'music', journal: 'journal' };

  type Target = { module: string | null; rect: DOMRect | null; role: FolderRole | null; folder: string | null; icon: boolean };
  let drag = $state<Target | null>(null);
  let notice = $state('');
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

  const hasFiles = (e: DragEvent) => [...(e.dataTransfer?.types ?? [])].includes('Files');

  function targetAt(e: DragEvent): Target {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const icon = el?.closest<HTMLElement>('[data-drop-module]');
    const area = !icon && workspace.active ? el?.closest<HTMLElement>('.workspace') : null;
    const module = icon?.dataset['dropModule'] ?? (area ? workspace.active : null);
    const role = module ? (ROLE_OF[module] ?? null) : null;
    const app = store.state;
    const folder = role && app.vault.tree ? (roleFolderHere(app.vault.tree, app.adventures, role)?.path ?? null) : null;
    return { module, rect: (icon ?? area)?.getBoundingClientRect() ?? null, role, folder, icon: !!icon };
  }

  function ondragover(e: DragEvent) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    drag = targetAt(e);
    if (e.dataTransfer) e.dataTransfer.dropEffect = drag.folder ? 'copy' : 'none';
  }
  // Out of the window: relatedTarget is null.
  function ondragleave(e: DragEvent) {
    if (!e.relatedTarget) drag = null;
  }

  function show(text: string) {
    notice = text;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice = ''), 4000);
  }

  function ondrop(e: DragEvent) {
    if (!hasFiles(e)) return;
    // Otherwise the window would open the file itself.
    e.preventDefault();
    const tg = targetAt(e);
    drag = null;
    if (!tg.role) return show(t('drop.nowhere'));
    if (!tg.folder) return show(t('drop.noFolder'));
    const paths = [...(e.dataTransfer?.files ?? [])].map((f) => window.api.pathForFile(f)).filter(Boolean);
    const ok = paths.filter((p) => roleAccepts(tg.role!, p));
    const skipped = paths.length - ok.length;
    const where = tg.folder.split('/').join(' / ');
    const wrong = t(tg.role === 'music' ? 'drop.needMusic' : tg.role === 'journal' ? 'drop.needPdf' : 'drop.needImages');
    if (!ok.length) return show(t('drop.noneFit', { kind: wrong }));
    dispatch('vault', 'addFiles', { folder: tg.folder, paths: ok });
    // Dropped on an icon: the tab opens, the new files are in sight.
    if (tg.icon && tg.module) workspace.openTab(tg.module as never);
    show(t('drop.added', { count: ok.length, folder: where }) + (skipped ? ' ' + t('drop.skipped', { count: skipped, kind: wrong }) : ''));
  }

  // ⌘V in an open tab of these modules: the same folder, the files from the clipboard (the core picks those the role
  // takes) or a picture. Not while typing or with a window open over the tab.
  function onkeydown(e: KeyboardEvent) {
    if (!matches(e, 'paste')) return;
    const el = e.target as HTMLElement | null;
    if (el?.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('.modal, [aria-modal="true"]')) return;
    const role = workspace.active ? ROLE_OF[workspace.active] : undefined;
    const app = store.state;
    if (!role || !app.vault.tree) return;
    e.preventDefault();
    const folder = roleFolderHere(app.vault.tree, app.adventures, role)?.path;
    if (!folder) return show(t('drop.noFolder'));
    dispatch('vault', 'pasteImage', { folder, role });
  }

  const label = $derived(
    !drag ? '' : drag.folder ? t('drop.into', { folder: drag.folder.split('/').join(' / ') }) : drag.role ? t('drop.noFolder') : t('drop.nowhere'),
  );
</script>

<svelte:window {ondragover} {ondragleave} {ondrop} {onkeydown} />

{#if drag}
  {#if drag.rect}
    <div class="frame" class:bad={!drag.folder} style:left="{drag.rect.left}px" style:top="{drag.rect.top}px" style:width="{drag.rect.width}px" style:height="{drag.rect.height}px"></div>
  {/if}
  <div class="label" class:bad={!drag.folder}>{label}</div>
{/if}
{#if notice}<div class="notice" role="status">{notice}</div>{/if}

<style>
  .frame {
    position: fixed;
    -webkit-app-region: no-drag;
    z-index: 60;
    border: 2px dashed var(--accent);
    border-radius: var(--radius-m);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    pointer-events: none;
  }
  .label,
  .notice {
    position: fixed;
    -webkit-app-region: no-drag;
    left: 50%;
    bottom: 24px;
    z-index: 61;
    max-width: 70vw;
    padding: 8px 14px;
    transform: translateX(-50%);
    border-radius: var(--radius-m);
    background: var(--accent);
    color: var(--on-accent);
    font-size: 13px;
    pointer-events: none;
  }
  .frame.bad {
    border-color: var(--text-faint);
    background: transparent;
  }
  .label.bad {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .notice {
    background: var(--bg-secondary);
    color: var(--text-normal);
    border: 1px solid var(--border);
  }
</style>
