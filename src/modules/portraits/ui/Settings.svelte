<!-- Раздел настроек «Портреты». -->
<script lang="ts">
  import { FolderPlus, RefreshCw, Unlink } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';

  let { ms }: ModuleProps<'portraits'> = $props();

  function disconnect(id: string, name: string) {
    if (confirm(`Отключить «${name}»? Файлы на диске останутся нетронутыми.`)) {
      dispatch('portraits', 'removeGroup', { groupId: id });
    }
  }
</script>

<div class="setting">
  <div class="info">
    <div class="name">Подписи на экране игроков</div>
    <div class="desc">Показывать имя под каждым портретом.</div>
  </div>
  <input
    type="checkbox"
    checked={ms.showNames}
    onchange={(e) => dispatch('portraits', 'setShowNames', { value: e.currentTarget.checked })}
  />
</div>

<h3>Папки приключений</h3>
<p class="desc muted">
  Картинки берутся из папки <code>characters</code> (или <code>персонажи</code>) внутри папки приключения. Можно подключить
  одно приключение или папку, в которой лежат несколько. Файлы не копируются и не изменяются.
</p>

{#each ms.groups as g (g.id)}
  <div class="setting">
    <div class="info">
      <div class="name">{g.name}</div>
      <div class="desc path" title={g.path}>{g.path}</div>
    </div>
    <button class="icon-btn" title="Перечитать папку" onclick={() => dispatch('portraits', 'rescanGroup', { groupId: g.id })}>
      <RefreshCw size={15} />
    </button>
    <button class="icon-btn" title="Отключить (файлы на диске не удаляются)" onclick={() => disconnect(g.id, g.name)}>
      <Unlink size={15} />
    </button>
  </div>
{:else}
  <div class="setting"><div class="info faint">Ни одной папки не подключено.</div></div>
{/each}

<div class="setting">
  <div class="info"></div>
  <button class="btn primary" onclick={() => dispatch('portraits', 'addFolder')}>
    <FolderPlus size={14} /> Подключить папку…
  </button>
</div>

<style>
  .desc {
    font-size: 12px;
  }
  .path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
</style>
