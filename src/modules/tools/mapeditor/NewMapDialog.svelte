<!-- A new map: from an empty field or from the generator, of a kind, of a size, with a name. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { generateLayout, LAYOUT_STYLES, type LayoutStyle } from '../mapgen/layout';
  import { blankLayout, MAX_SIDE, MIN_SIDE } from './edit';
  import { editor } from './store.svelte';

  let { onclose }: { onclose: () => void } = $props();

  let from = $state<'blank' | 'generator'>('blank');
  let style = $state<LayoutStyle>('building');
  let w = $state(30);
  let h = $state(20);
  let rooms = $state(5);
  let title = $state('');
  let busy = $state(false);

  async function create() {
    busy = true;
    const layout = from === 'blank' ? blankLayout(style, w, h, Math.floor(Math.random() * 2 ** 31)) : generateLayout(style, { rooms });
    const ok = await editor.create(title.trim() || t(`mapgen.style.${style}` as never), layout);
    busy = false;
    if (ok) onclose();
  }
  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window {onkeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <form class="modal" onsubmit={(e) => (e.preventDefault(), void create())}>
    <h3>{t('mapedit.new')}</h3>
    <div class="choice">
      <button type="button" class:on={from === 'blank'} onclick={() => (from = 'blank')}><b>{t('mapedit.fromBlank')}</b><span>{t('mapedit.fromBlankHint')}</span></button>
      <button type="button" class:on={from === 'generator'} onclick={() => (from = 'generator')}><b>{t('mapedit.fromGenerator')}</b><span>{t('mapedit.fromGeneratorHint')}</span></button>
    </div>
    <label>{t('mapgen.kind')}
      <select bind:value={style}>
        {#each LAYOUT_STYLES as id (id)}<option value={id}>{t(`mapgen.style.${id}` as never)}</option>{/each}
      </select>
    </label>
    {#if from === 'blank'}
      <div class="row">
        <label>{t('mapedit.width')} <input type="number" min={MIN_SIDE} max={MAX_SIDE} bind:value={w} /></label>
        <label>{t('mapedit.height')} <input type="number" min={MIN_SIDE} max={MAX_SIDE} bind:value={h} /></label>
      </div>
    {:else}
      <label>{t(style === 'town' || style === 'forest' || style === 'meadow' || style === 'shore' || style === 'swamp' ? 'mapgen.places' : 'mapgen.rooms')}
        <input type="number" min="3" max="30" bind:value={rooms} />
      </label>
    {/if}
    <label>{t('mapedit.name')} <input type="text" bind:value={title} placeholder={t('mapedit.namePh')} /></label>
    <footer>
      <button type="button" class="btn" onclick={onclose}>{t('mapedit.cancel')}</button>
      <button type="submit" class="btn primary" disabled={busy}>{t('mapedit.create')}</button>
    </footer>
  </form>
</div>

<style>
  .backdrop {
    position: fixed;
    -webkit-app-region: no-drag;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.5);
  }
  .modal {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(460px, 92vw);
    padding: 16px 18px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  h3 {
    margin: 0;
    font-size: 16px;
  }
  .choice {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .choice button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .choice button span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .choice button.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .row {
    display: flex;
    gap: 12px;
  }
  .row input {
    width: 100px;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
