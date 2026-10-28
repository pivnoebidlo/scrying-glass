<!-- Блок «Журнал» в правой панели: закреплённые заметки и PDF приключения под рукой на игре (видит только мастер).
     Only their names: a click opens one in the side drawer over any tab, a second click closes it; the pin unpins it. -->
<script lang="ts">
  import ContextMenu, { menuAt, type MenuItem } from '../../../renderer/lib/ContextMenu.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { BookOpen, NotebookText, PinOff } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { isPdf, pageTitle } from '../../../shared/journal';
  import { pinnedPages } from '../control';
  import { closePeek, peek, peekJournal } from './ui.svelte';

  let { app }: ModuleProps<'journal'> = $props();

  const adv = $derived(app.adventures.current);
  const list = $derived(pinnedPages(app));
  // A pinned note's menu (a right click): open or close it, unpin.
  let menu = $state<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const pinMenu = (e: MouseEvent, path: string) =>
    (menu = {
      ...menuAt(e),
      items: [
        peek.path === path
          ? { label: t('journal.peekClose'), icon: BookOpen, action: closePeek }
          : { label: t('journal.peekHint'), icon: BookOpen, action: () => peekJournal(path) },
        { label: t('journal.unpin'), icon: PinOff, action: () => void dispatch('journal', 'unpin', { adventure: adv, path }) },
      ],
    });
</script>

<ul class="pinned">
  {#each list as path (path)}
    <li class:open={peek.path === path} oncontextmenu={(e) => pinMenu(e, path)}>
      <button class="name" title={peek.path === path ? t('journal.peekClose') : t('journal.peekHint')} onclick={() => (peek.path === path ? closePeek() : peekJournal(path))}>
        {#if isPdf(path)}<BookOpen size={13} />{:else}<NotebookText size={13} />{/if}
        <span class="t">{pageTitle(path)}</span>
      </button>
      <button class="icon-btn" title={t('journal.unpin')} onclick={() => dispatch('journal', 'unpin', { adventure: adv, path })}><PinOff size={13} /></button>
    </li>
  {/each}
</ul>

{#if menu}<ContextMenu x={menu.x} y={menu.y} items={menu.items} onclose={() => (menu = null)} />{/if}

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
