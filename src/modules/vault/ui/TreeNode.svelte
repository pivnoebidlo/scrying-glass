<!-- Ветка дерева: папка и, если раскрыта, вложенные папки. -->
<script lang="ts">
  import { ChevronRight, Map } from '@lucide/svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import type { VaultFolder } from '../../../shared/vault';
  import Self from './TreeNode.svelte';
  import { folderIcon, ui } from './ui.svelte';

  let { folder, depth, select }: { folder: VaultFolder; depth: number; select: (path: string) => void } = $props();

  const open = $derived(!!ui.expanded[folder.path]);
  // Приключения — со своей иконкой, текущее выделено.
  const adventure = $derived(depth === 0 && store.state.adventures.list.includes(folder.path));
  const current = $derived(adventure && store.state.adventures.current === folder.path);
  const Icon = $derived(adventure ? Map : folderIcon(folder.name));

  function toggle(e: MouseEvent) {
    e.stopPropagation();
    ui.expanded[folder.path] = !open;
  }
</script>

<button
  class="row"
  class:active={ui.folder === folder.path}
  style:padding-left="{8 + depth * 14}px"
  title={folder.path}
  onclick={() => {
    select(folder.path);
    if (!open && folder.folders.length) ui.expanded[folder.path] = true;
  }}
>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <span class="chevron" class:open class:hidden={!folder.folders.length} onclick={toggle}>
    <ChevronRight size={12} />
  </span>
  <span class="icon" class:current><Icon size={14} /></span>
  <span class="name" class:current>{folder.name}</span>
</button>

{#if open}
  {#each folder.folders as f (f.path)}
    <Self folder={f} depth={depth + 1} {select} />
  {/each}
{/if}

<style>
  .icon {
    display: inline-flex;
  }
  .current {
    color: var(--accent-hover);
  }
  .chevron {
    display: inline-flex;
    width: 12px;
    transition: transform 0.12s ease;
  }
  .chevron.open {
    transform: rotate(90deg);
  }
  .chevron.hidden {
    visibility: hidden;
  }
</style>
