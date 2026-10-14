<!-- Раздел настроек «Резервные копии»: снимки данных приложения (делаются сами), восстановление из снимка. -->
<script lang="ts">
  import { ArchiveRestore, Camera, FolderOpen } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { BackupInfo } from '../../../shared/api';
  import type { ModuleProps } from '../../../renderer/lib/contrib';

  let { app }: ModuleProps<'backup'> = $props();

  let list = $state.raw<BackupInfo[]>([]);
  let status = $state('');
  let open = $state<string | null>(null);
  let parts = $state({ vault: true, library: true });

  const load = async () => (list = await window.api.listBackups());
  onMount(load);

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
