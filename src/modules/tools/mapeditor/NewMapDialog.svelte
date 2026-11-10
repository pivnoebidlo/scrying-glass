<!-- A new map: from an empty field or from the generator (a preview to roll again), of a kind, of a size, with a name.
     The window remembers the choice. -->
<script lang="ts">
  import { Dices } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import LayoutCanvas from '../mapgen/LayoutCanvas.svelte';
  import { generateLayout, GENRES, isOpenAir, LAYOUT_STYLES, MAX_ROOMS, MIN_ROOMS, roomCount, type Genre, type Layout, type LayoutStyle } from '../mapgen/layout';
  import { blankLayout, MAX_SIDE, MIN_SIDE, setGenre } from './edit';
  import { editor } from './store.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const KEY = 'sg.mapedit.new';
  interface Choice {
    from: 'blank' | 'generator';
    style: LayoutStyle;
    w: number;
    h: number;
    rooms: number;
    walls: boolean;
    genre: Genre;
  }
  const DEFAULTS: Choice = { from: 'generator', style: 'building', w: 30, h: 20, rooms: 5, walls: false, genre: 'fantasy' };
  const ch = $state<Choice>(
    (() => {
      try {
        const v = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
        return LAYOUT_STYLES.includes(v.style) && GENRES.includes(v.genre) ? v : { ...DEFAULTS };
      } catch {
        return { ...DEFAULTS };
      }
    })(),
  );
  let title = $state('');
  let busy = $state(false);
  let preview = $state.raw<Layout | null>(null);

  function roll() {
    ch.rooms = roomCount(ch.rooms);
    preview = generateLayout(ch.style, { rooms: ch.rooms, walls: ch.style === 'town' && ch.walls });
  }
  // A fresh preview whenever what it is made of changes.
  $effect(() => {
    if (ch.from !== 'generator') return;
    void ch.style;
    void ch.walls;
    void ch.rooms;
    roll();
  });

  async function create() {
    busy = true;
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(ch)));
    } catch {
      /* not remembered */
    }
    const layout = ch.from === 'blank' ? blankLayout(ch.style, ch.w, ch.h, Math.floor(Math.random() * 2 ** 31)) : (preview ?? generateLayout(ch.style, { rooms: roomCount(ch.rooms) }));
    const ok = await editor.create(title.trim() || t(`mapgen.style.${ch.style}` as never), setGenre(layout, ch.genre));
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
  <form class="modal" class:wide={ch.from === 'generator'} onsubmit={(e) => (e.preventDefault(), void create())}>
    <h3>{t('mapedit.new')}</h3>
    <div class="choice">
      <button type="button" class:on={ch.from === 'generator'} onclick={() => (ch.from = 'generator')}><b>{t('mapedit.fromGenerator')}</b><span>{t('mapedit.fromGeneratorHint')}</span></button>
      <button type="button" class:on={ch.from === 'blank'} onclick={() => (ch.from = 'blank')}><b>{t('mapedit.fromBlank')}</b><span>{t('mapedit.fromBlankHint')}</span></button>
    </div>
    <div class="row">
      <label>{t('mapedit.world')}
        <select bind:value={ch.genre}>
          {#each GENRES as g (g)}<option value={g}>{t(`mapedit.genre.${g}` as never)}</option>{/each}
        </select>
      </label>
      <label>{t('mapgen.kind')}
        <select bind:value={ch.style}>
          {#each LAYOUT_STYLES as id (id)}<option value={id}>{t(`mapgen.style.${id}` as never)}</option>{/each}
        </select>
      </label>
      {#if ch.from === 'blank'}
        <label>{t('mapedit.width')} <input type="number" min={MIN_SIDE} max={MAX_SIDE} bind:value={ch.w} /></label>
        <label>{t('mapedit.height')} <input type="number" min={MIN_SIDE} max={MAX_SIDE} bind:value={ch.h} /></label>
      {:else}
        <label>{t(isOpenAir(ch.style) ? 'mapgen.places' : 'mapgen.rooms')}
          <input type="number" min={MIN_ROOMS} max={MAX_ROOMS} bind:value={ch.rooms} />
        </label>
        {#if ch.style === 'town'}
          <label class="check"><input type="checkbox" bind:checked={ch.walls} /> {t('mapgen.walls')}</label>
        {/if}
        <button type="button" class="btn again" title={t('mapedit.againHint')} onclick={roll}><Dices size={14} /> {t('mapedit.again')}</button>
      {/if}
    </div>
    {#if ch.from === 'generator' && preview}
      <div class="preview"><LayoutCanvas layout={preview} /></div>
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
    max-height: 92vh;
    overflow: auto;
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
  .row {
    flex-wrap: wrap;
    align-items: flex-end;
  }
  .row input[type='number'] {
    width: 90px;
  }
  .modal.wide {
    width: min(760px, 94vw);
  }
  label.check {
    flex-direction: row;
    align-items: center;
    gap: 6px;
    padding-bottom: 6px;
    color: var(--text-normal);
    font-size: 13px;
  }
  .again {
    margin-left: auto;
  }
  .preview :global(canvas) {
    max-height: 46vh;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
