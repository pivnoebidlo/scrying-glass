<!-- Раздел настроек «Резервные копии»: снимки данных приложения (делаются сами), восстановление из снимка. -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import { ArchiveRestore, Camera, FileArchive, FolderOpen, Upload } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { BackupInfo } from '../../../shared/api';
  import type { ModuleProps } from '../../../renderer/lib/contrib';

  let { app }: ModuleProps<'backup'> = $props();

  let list = $state.raw<BackupInfo[]>([]);
  let status = $state('');
  let open = $state<string | null>(null);
  let parts = $state({ vault: true, library: true });

  const load = async () => (list = await window.api.listBackups());
  let sizes = $state<{ library: number; media: number } | null>(null);
  let dir = $state<{ path: string; isDefault: boolean } | null>(null);
  onMount(async () => {
    load();
    dir = await window.api.backupsDir();
    sizes = await window.api.backupSizes();
  });

  async function chooseDir(reset = false) {
    dir = await window.api.chooseBackupsDir(reset);
    await load();
  }

  let media = $state(false);
  let busy = $state('');
  async function saveFile() {
    busy = t('backup.saving');
    try {
      const f = await window.api.saveFullBackup(media);
      if (f) flash(t('backup.saved'));
    } catch (e) {
      flash(t('backup.failed', { error: String(e) }));
    } finally {
      busy = '';
    }
  }
  async function restoreFile() {
    busy = t('backup.restoring');
    try {
      const r = await window.api.restoreFullBackup();
      if (r) flash(t('backup.restoredVault', { files: r.files, vault: r.vault }));
      await load();
    } catch (e) {
      flash(t('backup.failed', { error: String(e) }));
    } finally {
      busy = '';
    }
  }

  const vaultRoot = $derived(app.vault.root);
  const reason = (r: BackupInfo['reason']) => t(`backup.reason.${r}`);
  const size = (b: number) => (b < 1024 * 1024 ? t('backup.kb', { n: Math.max(1, Math.round(b / 1024)) }) : t('backup.mb', { n: (b / 1024 / 1024).toFixed(1) }));
  const when = (t: number) => new Date(t).toLocaleString(locale.lang, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  function flash(text: string) {
    status = text;
    setTimeout(() => (status = ''), 4000);
  }

  async function create() {
    const s = await window.api.createBackup();
    await load();
    flash(s ? t('backup.snapshotDone') : t('backup.nothingToSave'));
  }

  async function restore(b: BackupInfo) {
    const n = await window.api.restoreBackup(b.id, { vault: parts.vault && b.vault === vaultRoot, library: parts.library });
    open = null;
    await load();
    if (n) flash(t('backup.restoredN', { count: n }));
  }
</script>

<div class="setting">
  <div class="info">
    <div class="name">{t('backup.dirTitle')}</div>
    <div class="desc">
      {t('backup.dirDesc')}
      <div class="path" title={dir?.path}>{dir ? dir.path : '…'}{dir?.isDefault ? t('backup.default') : ''}</div>
    </div>
  </div>
  <div class="dir-actions">
    <button class="btn" onclick={() => chooseDir()}>{t('backup.change')}</button>
    {#if dir && !dir.isDefault}<button class="btn" onclick={() => chooseDir(true)}>{t('backup.toDefault')}</button>{/if}
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('backup.snapshotsTitle')}</div>
    <div class="desc">
      <Lead text={t('backup.snapshotsDesc')} />
    </div>
  </div>
</div>

<div class="actions">
  <button class="btn" onclick={create}><Camera size={14} /> {t('backup.snapshotNow')}</button>
  <button class="btn" onclick={() => window.api.revealBackups()}><FolderOpen size={14} /> {t('backup.openSnapshots')}</button>
  {#if status}<span class="status">{status}</span>{/if}
</div>

<div class="setting">
  <div class="info">
    <div class="name">{t('backup.fullTitle')}</div>
    <div class="desc">
      <Lead text={t('backup.fullDesc')} />
    </div>
  </div>
</div>
<label class="media">
  <input type="checkbox" bind:checked={media} />
  {t('backup.withMedia')}{sizes ? t('backup.sizes', { media: size(sizes.media), library: size(sizes.library) }) : ''}
</label>
<div class="actions">
  <button class="btn" disabled={!!busy} onclick={saveFile}><FileArchive size={14} /> {t('backup.saveCopy')}</button>
  <button class="btn" disabled={!!busy} onclick={restoreFile}><Upload size={14} /> {t('backup.restoreFile')}</button>
  {#if busy}<span class="status">{busy}</span>{/if}
</div>

<h4>{t('backup.snapshots')}</h4>
{#if list.length}
  <ul class="list">
    {#each list as b (b.id)}
      {@const here = b.vault === vaultRoot}
      <li class:other={!here}>
        <div class="row">
          <span class="when">{when(b.created)}</span>
          <span class="faint">{reason(b.reason)} · {t('backup.filesN', { count: b.files })} · {size(b.bytes)}{here ? '' : ` · ${b.vaultName || t('backup.noVault')}`}</span>
          <div class="spacer"></div>
          <button class="btn small" onclick={() => (open = open === b.id ? null : b.id)}><ArchiveRestore size={13} /> {t('backup.restore')}</button>
        </div>
        {#if open === b.id}
          <div class="restore">
            <label><input type="checkbox" bind:checked={parts.vault} disabled={!here} /> {t('backup.vaultData')}{here ? '' : t('backup.otherVault')}</label>
            <label><input type="checkbox" bind:checked={parts.library} /> {t('backup.library')}</label>
            <button class="btn primary small" disabled={!(parts.vault && here) && !parts.library} onclick={() => restore(b)}>{t('backup.doRestore')}</button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{:else}
  <p class="faint">{t('backup.none')}</p>
{/if}

<style>
  .path {
    margin-top: 4px;
    overflow: hidden;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dir-actions {
    display: flex;
    gap: 6px;
  }
  h4 {
    margin: 18px 0 6px;
    font-size: 13px;
  }
  .media {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 8px;
    font-size: 13px;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0 14px;
  }
  .status {
    color: var(--accent);
    font-size: 12px;
  }
  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    padding: 6px 0;
    border-top: 1px solid var(--border);
  }
  li.other .when {
    color: var(--text-muted);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }
  .when {
    font-weight: 500;
  }
  .spacer {
    flex: 1;
  }
  .small {
    padding: 2px 8px;
    font-size: 12px;
  }
  .restore {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 6px;
    padding: 8px 10px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    font-size: 13px;
  }
  .restore label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
</style>
