<!-- Выбор из списка (плейлисты и треки, заготовки боёв): поиск, отметить несколько и добавить разом. -->
<script lang="ts" module>
  import { hint } from '../../shared/hotkeys';
  import { t } from './i18n.svelte';
  export interface PickOption {
    id: string;
    title: string;
    // Вторая строка: где лежит, сколько участников.
    sub?: string;
    // Заголовок группы, с которого начинается эта строка («Плейлисты», «Треки»).
    group?: string;
  }
</script>

<script lang="ts">
  import { Check, Search, X } from '@lucide/svelte';

  let {
    title,
    options,
    skip = [],
    onpick,
    onclose,
  }: {
    title: string;
    options: PickOption[];
    // Уже добавленное: отмечено и не выбирается.
    skip?: string[];
    onpick: (ids: string[]) => void;
    onclose: () => void;
  } = $props();

  let search = $state('');
  let chosen = $state<string[]>([]);
  const fold = (s: string) => s.normalize('NFC').toLowerCase().replace(/ё/g, 'е');
  const visible = $derived(
    options.filter((o) => !search.trim() || fold(`${o.title} ${o.sub ?? ''}`).includes(fold(search.trim()))).slice(0, 400)
  );

  function pick(id: string) {
    if (skip.includes(id)) return;
    chosen = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id];
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={title}>
    <header>
      <label class="search">
        <Search size={13} />
        <!-- svelte-ignore a11y_autofocus -->
        <input type="text" placeholder={title} bind:value={search} autofocus />
      </label>
      <button class="icon-btn" title={hint(t('app.close'), 'close')} onclick={onclose}><X size={16} /></button>
    </header>
    <div class="list">
      {#each visible as o, i (o.id)}
        {#if o.group && o.group !== visible[i - 1]?.group}
          <div class="group">{o.group}</div>
        {/if}
        {@const on = chosen.includes(o.id) || skip.includes(o.id)}
        <button class="row" class:on class:skip={skip.includes(o.id)} title={skip.includes(o.id) ? t('lib.alreadyAdded') : ''} onclick={() => pick(o.id)}>
          <span class="box">{#if on}<Check size={12} />{/if}</span>
          <span class="text">
            <span class="title">{o.title}</span>
            {#if o.sub}<span class="sub faint">{o.sub}</span>{/if}
          </span>
        </button>
      {:else}
        <p class="faint empty">{t('lib.nothingFound')}</p>
      {/each}
    </div>
    <footer>
      <span class="faint">{chosen.length ? t('lib.selected', { count: chosen.length }) : t('lib.clickToSelect')}</span>
      <button class="btn" onclick={onclose}>{t('lib.cancel')}</button>
      <button class="btn primary" disabled={!chosen.length} onclick={() => onpick($state.snapshot(chosen))}>{t('lib.add')}</button>
    </footer>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.55);
  }
  .modal {
    display: flex;
    flex-direction: column;
    width: min(520px, calc(100vw - 80px));
    height: min(560px, calc(100vh - 80px));
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  header {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }
  .search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    color: var(--text-faint);
  }
  .search input {
    flex: 1;
    padding: 5px 0;
    border: 0;
    background: none;
  }
  .search input:focus {
    outline: none;
  }
  .list {
    flex: 1;
    padding: 6px;
    overflow: auto;
  }
  .group {
    padding: 10px 8px 4px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 5px 8px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .row:hover {
    background: var(--bg-hover);
  }
  .row.skip {
    opacity: 0.45;
    cursor: default;
  }
  .box {
    flex: none;
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--on-accent);
  }
  .on .box {
    border-color: var(--accent);
    background: var(--accent);
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .title,
  .sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    font-size: 12px;
  }
  .empty {
    padding: 8px;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid var(--border);
  }
  footer .faint {
    flex: 1;
  }
</style>
