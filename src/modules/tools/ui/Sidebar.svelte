<!-- Боковая панель «Инструментов»: записки (и их быстрый список), общие инструменты и раздел системы текущего
     приключения; инструменты других систем — только включённые в настройках (registry.svelte.ts). -->
<script lang="ts">
  import { unread } from '../../telegram/ui/tg.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Brush, FileText, ScrollText } from '@lucide/svelte';
  import { sketchTitle } from '../../../shared/sketch';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { noteTitle } from '../../../shared/notes';
  import { noteGroups } from './library';
  import { pickTool, ui } from './ui.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { FAMILIES, familyOf } from '../../../systems';
  import { placeOf, TOOLS, type Place, type ToolDef } from './registry.svelte';

  let { app }: ModuleProps<'tools'> = $props();
  const family = $derived(familyOf(currentSystem(app.adventures)));
  const familyTitle = $derived(FAMILIES.find((f) => f.id === family)?.title ?? family);
  const at = (place: Place) => TOOLS.filter((d) => placeOf(d, family) === place);
  const notes = $derived(app.vault.tree ? noteGroups(app.vault.tree, app.vault.name, app.adventures).flatMap((g) => g.items) : []);
  const sketches = $derived(app.vault.tree ? noteGroups(app.vault.tree, app.vault.name, app.adventures, 'sketch').flatMap((g) => g.items) : []);
  // A count next to a tool: unread messages, a running timer.
  const badge = (d: ToolDef) => (d.id === 'telegram' ? unread() || '' : d.id === 'timer' && app.timer.active ? t('tools.side.running') : '');
</script>

{#snippet item(d: ToolDef)}
  {@const Icon = d.icon}
  <button class="item" data-nav class:active={ui.tool === d.id && !ui.note} onclick={() => pickTool(d.id)}>
    <Icon size={14} />
    <span class="name">{d.title}</span>
    {#if badge(d)}<span class="count" class:unread={d.id === 'telegram'}>{badge(d)}</span>{/if}
  </button>
{/snippet}

<div class="list">
  <button class="item" data-nav class:active={ui.tool === 'notes' && !ui.note} onclick={() => pickTool('notes')}>
    <ScrollText size={14} />
    <span class="name">{t('tools.side.notes')}</span>
    <span class="count">{notes.length}</span>
  </button>
  {#each ui.tool === 'notes' && ui.folded !== 'notes' ? notes : [] as f (f.path)}
    <button class="item sub" data-nav data-depth="1" class:active={ui.note === f.path} title={f.path} onclick={() => ((ui.tool = 'notes'), (ui.note = f.path))}>
      <FileText size={13} />
      <span class="name">{noteTitle(f.path)}</span>
    </button>
  {/each}
  <button class="item" data-nav class:active={ui.tool === 'sketches' && !ui.note} onclick={() => pickTool('sketches')}>
    <Brush size={14} />
    <span class="name">{t('tools.side.sketches')}</span>
    <span class="count">{sketches.length}</span>
  </button>
  {#each ui.tool === 'sketches' && ui.folded !== 'sketches' ? sketches : [] as f (f.path)}
    <button class="item sub" data-nav data-depth="1" class:active={ui.note === f.path} title={f.path} onclick={() => ((ui.tool = 'sketches'), (ui.note = f.path))}>
      <Brush size={13} />
      <span class="name">{sketchTitle(f.path)}</span>
    </button>
  {/each}
  {#each at('common') as d (d.id)}{@render item(d)}{/each}

  {#if at('own').length}
    <h4 class="section">{familyTitle}</h4>
    {#each at('own') as d (d.id)}{@render item(d)}{/each}
  {/if}
  {#if at('extra').length}
    <h4 class="section" title={t('tools.side.extraHint')}>{t('tools.side.extra')}</h4>
    {#each at('extra') as d (d.id)}{@render item(d)}{/each}
  {/if}
  <p class="faint more">{t('tools.side.more')}</p>
</div>

<style>
  .list {
    padding: 0 6px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
  }
  .item.sub {
    padding-left: 24px;
  }
  .item:hover {
    background: var(--bg-hover);
    color: var(--text-normal);
  }
  .item.active {
    background: var(--bg-active);
    color: var(--text-normal);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    color: var(--text-faint);
    font-size: 12px;
  }
  .count.unread {
    min-width: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--on-accent);
    text-align: center;
  }
  .section {
    margin: 12px 8px 4px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .more {
    padding: 10px 8px;
    font-size: 12px;
  }
</style>
