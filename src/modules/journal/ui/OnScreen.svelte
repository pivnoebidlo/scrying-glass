<!-- Блок «Журнал» в правой панели: закреплённые заметки и PDF приключения под рукой на игре (видит только мастер).
     Only their names: a click (or the panel button) opens one in the side drawer over any tab; the pin unpins it. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { BookOpen, NotebookText, PanelRight, PinOff } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { isPdf, pageTitle } from '../../../shared/journal';
  import { pinnedPages } from '../control';
  import { peek, peekJournal } from './ui.svelte';

  let { app }: ModuleProps<'journal'> = $props();

  const adv = $derived(app.adventures.current);
  const list = $derived(pinnedPages(app));
</script>

<ul class="pinned">
  {#each list as path (path)}
    <li class:open={peek.path === path}>
      <button class="name" title={t('journal.peekHint')} onclick={() => peekJournal(path)}>
        {#if isPdf(path)}<BookOpen size={13} />{:else}<NotebookText size={13} />{/if}
        <span class="t">{pageTitle(path)}</span>
      </button>
      <button class="icon-btn" title={t('journal.peekHint')} onclick={() => peekJournal(path)}><PanelRight size={13} /></button>
      <button class="icon-btn" title={t('journal.unpin')} onclick={() => dispatch('journal', 'unpin', { adventure: adv, path })}><PinOff size={13} /></button>
    </li>
  {/each}
</ul>

<style>
  .pinned {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: var(--radius-s);
  }
  li.open {
    background: var(--bg-active);
  }
  .name {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 6px;
    padding: 3px 4px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .name:hover {
    background: var(--bg-hover);
  }
  .t {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  li .icon-btn {
    padding: 3px;
  }
</style>
