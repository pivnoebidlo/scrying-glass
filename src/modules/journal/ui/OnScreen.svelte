<!-- Блок «Журнал» в правой панели: закреплённая заметка приключения под рукой на игре (видит только мастер). -->
<script lang="ts">
  import { Maximize2, PinOff } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { notes } from '../../../renderer/lib/note/notes.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { pinnedPage } from '../control';
  import PageBody from './PageBody.svelte';
  import { loadPages, pageAt } from './store.svelte';
  import { openPage } from './ui.svelte';

  let { app }: ModuleProps<'journal'> = $props();

  const tree = $derived(app.vault.tree);
  const adv = $derived(app.adventures.current);
  $effect(() => {
    void tree;
    void adv;
    void notes.rev;
    void loadPages();
  });

  const path = $derived(pinnedPage(app));
  const page = $derived(pageAt(path));
</script>

{#if page}
  <div class="pinned">
    <div class="head">
      <span class="t" title={page.path}>{page.title}</span>
      <button class="icon-btn" title="Открыть во вкладке «Журнал»" onclick={() => openPage(page.path)}><Maximize2 size={13} /></button>
      <button class="icon-btn" title="Открепить" onclick={() => dispatch('journal', 'pin', { adventure: adv, path: null })}><PinOff size={13} /></button>
    </div>
    <div class="body"><PageBody {page} compact /></div>
  </div>
{/if}

<style>
  .pinned {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .t {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .head .icon-btn {
    padding: 3px;
  }
  .body {
    max-height: 45vh;
    padding-right: 4px;
    overflow: auto;
  }
</style>
