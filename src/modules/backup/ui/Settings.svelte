<!-- Раздел настроек «Резервные копии»: снимки данных приложения (делаются сами), восстановление из снимка. -->
<script lang="ts">
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
    busy = 'Сохраняется копия…';
    try {
      const f = await window.api.saveFullBackup(media);
      if (f) flash('Копия сохранена.');
    } catch (e) {
      flash(`Не удалось: ${String(e)}`);
    } finally {
      busy = '';
    }
  }
  async function restoreFile() {
    busy = 'Восстановление…';
    try {
      const r = await window.api.restoreFullBackup();
      if (r) flash(`Восстановлено файлов: ${r.files}, хранилище «${r.vault}» открыто.`);
      await load();
    } catch (e) {
      flash(`Не удалось: ${String(e)}`);
    } finally {
      busy = '';
    }
  }

  const vaultRoot = $derived(app.vault.root);
  const REASONS: Record<BackupInfo['reason'], string> = {
    open: 'при открытии',
    auto: 'автоматически',
    quit: 'при выходе',
    manual: 'вручную',
    'before-restore': 'перед восстановлением',
  };
  const size = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} КБ` : `${(b / 1024 / 1024).toFixed(1)} МБ`);
  const when = (t: number) => new Date(t).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  function flash(text: string) {
    status = text;
    setTimeout(() => (status = ''), 4000);
  }

  async function create() {
    const s = await window.api.createBackup();
    await load();
    flash(s ? 'Снимок сделан.' : 'Нечего сохранять.');
  }

  async function restore(b: BackupInfo) {
    const n = await window.api.restoreBackup(b.id, { vault: parts.vault && b.vault === vaultRoot, library: parts.library });
    open = null;
    await load();
    if (n) flash(`Восстановлено файлов: ${n}.`);
  }
</script>

<div class="setting">
  <div class="info">
    <div class="name">Папка резервных копий</div>
    <div class="desc">
      Здесь лежат снимки; сюда же по умолчанию предлагается сохранять полную копию. Можно выбрать папку в облаке
      (iCloud Drive, Яндекс Диск, Dropbox) — копии сами окажутся там. При смене папки снимки переезжают.
      <div class="path" title={dir?.path}>{dir ? dir.path : '…'}{dir?.isDefault ? ' (по умолчанию)' : ''}</div>
    </div>
  </div>
  <div class="dir-actions">
    <button class="btn" onclick={() => chooseDir()}>Изменить…</button>
    {#if dir && !dir.isDefault}<button class="btn" onclick={() => chooseDir(true)}>По умолчанию</button>{/if}
  </div>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Снимки данных</div>
    <div class="desc">
      Приложение само сохраняет снимки всего, что создано в нём: сцены, туман и метки карт, жетоны, заготовки боёв,
      записки, таблицы, карточки, библиотеку (без картинок) и настройки. Снимок делается при открытии хранилища, раз
      в полчаса работы (если что-то изменилось) и при выходе. Хранятся последние 20 и по одному на день за месяц;
      сделанные вручную — пока их не удалить. Картинки и музыка — ваши файлы: их берегите Time Machine или облаком.
    </div>
  </div>
</div>

<div class="actions">
  <button class="btn" onclick={create}><Camera size={14} /> Сделать снимок сейчас</button>
  <button class="btn" onclick={() => window.api.revealBackups()}><FolderOpen size={14} /> Открыть папку снимков</button>
  {#if status}<span class="status">{status}</span>{/if}
</div>

<div class="setting">
  <div class="info">
    <div class="name">Полная копия в файл</div>
    <div class="desc">
      Один файл (.sgbackup): настройки, вся библиотека (карточки с картинками, таблицы, свои расы) и данные хранилища —
      сцены, карты, заготовки, записки, таблицы, карточки. Пригодится для переноса на новый компьютер или чтобы
      положить копию в облако. Восстанавливается в это хранилище или в другую папку.
    </div>
  </div>
</div>
<label class="media">
  <input type="checkbox" bind:checked={media} />
  Вместе с картинками и музыкой хранилища{sizes ? ` (≈ ${size(sizes.media)}; без них — библиотека ≈ ${size(sizes.library)})` : ''}
</label>
<div class="actions">
  <button class="btn" disabled={!!busy} onclick={saveFile}><FileArchive size={14} /> Сохранить копию…</button>
  <button class="btn" disabled={!!busy} onclick={restoreFile}><Upload size={14} /> Восстановить из файла…</button>
  {#if busy}<span class="status">{busy}</span>{/if}
</div>

<h4>Снимки</h4>
{#if list.length}
  <ul class="list">
    {#each list as b (b.id)}
      {@const here = b.vault === vaultRoot}
      <li class:other={!here}>
        <div class="row">
          <span class="when">{when(b.created)}</span>
          <span class="faint">{REASONS[b.reason]} · {b.files} файл. · {size(b.bytes)}{here ? '' : ` · ${b.vaultName || 'без хранилища'}`}</span>
          <div class="spacer"></div>
          <button class="btn small" onclick={() => (open = open === b.id ? null : b.id)}><ArchiveRestore size={13} /> Восстановить…</button>
        </div>
        {#if open === b.id}
          <div class="restore">
            <label><input type="checkbox" bind:checked={parts.vault} disabled={!here} /> Данные хранилища{here ? '' : ' (снимок другого хранилища)'}</label>
            <label><input type="checkbox" bind:checked={parts.library} /> Библиотека</label>
            <button class="btn primary small" disabled={!(parts.vault && here) && !parts.library} onclick={() => restore(b)}>Восстановить</button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{:else}
  <p class="faint">Снимков пока нет.</p>
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
