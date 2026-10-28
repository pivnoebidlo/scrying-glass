<!-- Боковая панель: дерево папок хранилища. Как в файловом менеджере: ↑ ↓ — соседняя папка, → — раскрыть или войти,
     ← — свернуть или к родителю. Выбранная папка приключения (или папка внутри него) сразу открывает это приключение;
     общие папки и корень текущее приключение не меняют. -->
<script lang="ts">
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { folderMenu } from './folderMenu.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Library, Trash2 } from '@lucide/svelte';
  import { tick } from 'svelte';
  import type { VaultFolder } from '../../../shared/vault';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import TreeNode from './TreeNode.svelte';
  import { followAdventure, ui } from './ui.svelte';
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
    followAdventure(path);
  }

  // Папки в том порядке, как они видны (корень, затем раскрытые ветки), — для стрелок.
  function visible(): { folder: VaultFolder | null; path: string; parent: string | null }[] {
    const out: { folder: VaultFolder | null; path: string; parent: string | null }[] = [{ folder: null, path: '', parent: null }];
    const add = (f: VaultFolder, parent: string) => {
      out.push({ folder: f, path: f.path, parent });
      if (ui.expanded[f.path]) for (const sub of f.folders) add(sub, f.path);
    };
    for (const f of folders) add(f, '');
    return out;
  }

  let tree = $state<HTMLElement>();
  async function go(path: string) {
    select(path);
    await tick();
    tree?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`)?.focus();
  }

  function onkeydown(e: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
    const list = visible();
    const i = list.findIndex((x) => x.path === ui.folder);
    const here = list[i];
    e.preventDefault();
    if (!here) return void go('');
    if (e.key === 'ArrowUp' && i > 0) go(list[i - 1]!.path);
    else if (e.key === 'ArrowDown' && i < list.length - 1) go(list[i + 1]!.path);
    else if (e.key === 'ArrowRight' && here.folder?.folders.length) {
      if (!ui.expanded[here.path]) ui.expanded[here.path] = true;
      else go(here.folder.folders[0]!.path);
    } else if (e.key === 'ArrowLeft') {
      if (here.folder && ui.expanded[here.path]) ui.expanded[here.path] = false;
      else if (here.parent !== null) go(here.parent);
    }
  }

  // Корзина своя у каждого хранилища: другое открыли — перечитываем.
  const root = $derived(ms.root);
  $effect(() => {
    void root;
    void loadTrash();
  });
  // The vault root's menu (a right click): as any folder's.
  let rootMenu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
</script>

{#if ms.tree}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="tree" bind:this={tree} {onkeydown}>
    <button class="row root" data-path="" class:active={!ui.trash && ui.folder === ''} title={ms.root} onclick={() => select('')} oncontextmenu={(e) => (select(''), (rootMenu = { ...menuAt(e), items: folderMenu('') }))}>
      <Library size={14} />
      <span class="name">{ms.name}</span>
    </button>
    {#each folders as f (f.path)}
      <TreeNode folder={f} depth={0} {select} />
    {/each}
    {#if hidden}
      <p class="faint hint" title={t('vault.hiddenAdventuresHint')}>
        {t('vault.hiddenAdventures', { count: hidden })}
      </p>
    {/if}
    {#if ms.tree.folders.length === 0}
      <p class="faint hint">{t('vault.noFolders')}</p>
    {/if}
    <button class="row bin" class:active={ui.trash} title={t('vault.trashHint')} onclick={() => ((ui.trash = true), openTab('vault'))}>
      <Trash2 size={14} />
      <span class="name">{t('vault.trash')}</span>
      {#if trashCount()}<span class="faint count">{trashCount()}</span>{/if}
    </button>
  </div>
{/if}

{#if rootMenu}<ContextMenu x={rootMenu.x} y={rootMenu.y} items={rootMenu.items} onclose={() => (rootMenu = null)} />{/if}

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
