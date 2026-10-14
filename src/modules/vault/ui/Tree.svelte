<!-- Боковая панель: дерево папок хранилища. -->
<script lang="ts">
  import { Library, Trash2 } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import TreeNode from './TreeNode.svelte';
  import { ui } from './ui.svelte';
  import { adventureHidden } from '../../../shared/adventures';
  import { loadTrash, trashCount } from './trash.svelte';

  let { ms, app }: ModuleProps<'vault'> = $props();

  // Приключения отключённых в настройках систем не показываются.
  const folders = $derived(ms.tree ? ms.tree.folders.filter((f) => !adventureHidden(app.adventures, f.path)) : []);
  const hidden = $derived(ms.tree ? ms.tree.folders.length - folders.length : 0);

  function select(path: string) {
    ui.folder = path;
    ui.trash = false;
    openTab('vault');
  }

  // Корзина своя у каждого хранилища: другое открыли — перечитываем.
  const root = $derived(ms.root);
  $effect(() => {
    void root;
    void loadTrash();
  });
</script>

{#if ms.tree}
  <div class="tree">
    <button class="row root" class:active={!ui.trash && ui.folder === ''} title={ms.root} onclick={() => select('')}>
      <Library size={14} />
      <span class="name">{ms.name}</span>
    </button>
    {#each folders as f (f.path)}
      <TreeNode folder={f} depth={0} {select} />
    {/each}
    {#if hidden}
      <p class="faint hint" title="Их ролевая система отключена в настройках («Приключения» → «Ролевые системы»)">
        Скрыто приключений: {hidden} — система отключена
      </p>
    {/if}
    {#if ms.tree.folders.length === 0}
      <p class="faint hint">Папок пока нет. Создайте их в Finder — они появятся здесь сами.</p>
    {/if}
    <button class="row bin" class:active={ui.trash} title="Удалённые файлы, карточки, записи и приключения" onclick={() => ((ui.trash = true), openTab('vault'))}>
      <Trash2 size={14} />
      <span class="name">Корзина</span>
      {#if trashCount()}<span class="faint count">{trashCount()}</span>{/if}
    </button>
  </div>
{/if}

<style>
  .tree {
    padding: 0 6px 10px;
  }
  .root {
    font-weight: 600;
  }
  .bin {
    margin-top: 10px;
  }
  .count {
    font-size: 12px;
  }
  .hint {
    padding: 0 8px;
    font-size: 12px;
  }
  .tree :global(.row) {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .tree :global(.row:hover) {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .tree :global(.row.active) {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .tree :global(.name) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
