<!-- The builder: the system's own compendium — rules, conditions, gear… Each entry has a title, a heading to group by
     and a Markdown text; in adventures of this system they are built-in entries (search, ⌘K, [[links]]), and a
     condition in the tracker with an entry of the same name opens it. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { getLang } from '../../../shared/i18n';
  import { loc, type SystemPack } from '../../../shared/syspack';
  import LocInput from './LocInput.svelte';

  let { pack = $bindable(), disabled = false }: { pack: SystemPack; disabled?: boolean } = $props();

  let sel = $state(0);
  const list = $derived(pack.compendium ?? []);
  const cur = $derived(list[sel]);
  const L = (x: Parameters<typeof loc>[0]) => loc(x, getLang());

  function add() {
    pack.compendium = [...list, { title: t('sb.newEntry'), text: '' }];
    sel = pack.compendium.length - 1;
  }
  function remove(i: number) {
    pack.compendium = list.filter((_, j) => j !== i);
    if (!pack.compendium.length) delete pack.compendium;
    sel = Math.max(0, Math.min(sel, list.length - 2));
  }
</script>

<div class="panel">
  <p class="faint small">{t('sb.compendiumAbout')}</p>
  <div class="list">
    {#each list as e, i (i)}
      <div class="line">
        <button class="item" class:on={i === sel} onclick={() => (sel = i)}>
          {L(e.title) || '—'}{#if e.category}<span class="faint"> · {L(e.category)}</span>{/if}
        </button>
        {#if !disabled}<button class="icon-btn" title={t('sb.remove')} onclick={() => remove(i)}><X size={12} /></button>{/if}
      </div>
    {/each}
    {#if !disabled}<button class="add" onclick={add}>{t('sb.addEntry')}</button>{/if}
  </div>
  {#if cur}
    <label class="row"><span>{t('sb.name')}</span><LocInput value={cur.title} set={(v) => (cur.title = v)} {disabled} /></label>
    <label class="row"><span>{t('sb.entryCategory')}</span><LocInput value={cur.category} set={(v) => (cur.category = v || undefined)} placeholder={t('sb.entryCategoryPh')} {disabled} /></label>
    <label class="row text"><span>{t('sb.entryText')}</span><LocInput value={cur.text} set={(v) => (cur.text = v)} multiline {disabled} /></label>
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .small {
    margin: 0;
    font-size: 11px;
  }
  .list {
    display: flex;
    flex-direction: column;
    max-height: 240px;
    overflow-y: auto;
  }
  .line {
    display: flex;
    align-items: center;
  }
  .item {
    flex: 1;
    min-width: 0;
    padding: 3px 6px;
    overflow: hidden;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--bg-active);
  }
  .add {
    align-self: flex-start;
    padding: 2px 6px;
    border: 0;
    background: none;
    color: var(--text-muted);
    font-size: 12px;
  }
  .add:hover {
    color: var(--accent);
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .row > span:first-child {
    color: var(--text-faint);
    font-size: 11px;
  }
  .text :global(textarea) {
    min-height: 220px;
    resize: vertical;
  }
</style>
