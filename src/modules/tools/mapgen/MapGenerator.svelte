<!-- Map generator (Tools → Map generator, any system): a building, a cave, a town quarter or open country with some rooms or places
     → a map for the Maps tab, with fog, a matching grid and a pin on every one. The current map is remembered by the window. -->
<script lang="ts">
  import { Map as MapIcon } from '@lucide/svelte';
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import type { PinIcon } from '../../maps/icons';
  import LayoutCanvas from './LayoutCanvas.svelte';
  import { generateLayout, isOpenAir, LAYOUT_STYLES, MAX_ROOMS, MIN_ROOMS, roomCount, type Layout, type LandmarkKind, type LayoutStyle } from './layout';
  import { helpers } from '../settlement/store.svelte';
  import { landmarkCell, layoutToMaps, type MapExtras } from './toMaps';

  const KEY = 'mapgen.state';
  interface Saved {
    style: LayoutStyle;
    rooms: number;
    layout: Layout | null;
  }
  const DEFAULTS: Saved = { style: 'building', rooms: 5, layout: null };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }
  const mg = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(mg)));
    } catch {
      /* not remembered — not a problem */
    }
  };

  function create() {
    mg.rooms = roomCount(mg.rooms);
    mg.layout = generateLayout(mg.style, { rooms: mg.rooms });
    save();
  }
  // A town's buildings as pins: what it is, who runs it, a name for the tavern. Made afresh for each map.
  const ICON: Record<LandmarkKind, PinIcon> = { tavern: 'beer', temple: 'church', shop: 'store', hall: 'landmark', smithy: 'anvil' };
  async function landmarkPins(l: Layout): Promise<MapExtras['pins']> {
    if (!l.landmarks?.length) return [];
    const h = await helpers(locale.lang === 'ru' ? 'ru' : 'en');
    return l.landmarks.map((m) => {
      const who = h.person('');
      const kind = t(`mapgen.landmark.${m.kind}`);
      const title = m.kind === 'tavern' ? h.tavernName() || kind : kind;
      const trait = who.trait.charAt(0).toUpperCase() + who.trait.slice(1);
      const note = `${m.kind === 'tavern' ? `${kind}\n\n` : ''}${t('mapgen.inCharge', { name: who.name })}\n\n${trait}`;
      return { ...landmarkCell(l, m), title, note, color: 'gold' as const, icon: ICON[m.kind] };
    });
  }
  let failed = $state(false);
  async function toMaps() {
    if (!mg.layout) return;
    const l = $state.snapshot(mg.layout) as Layout;
    const open = isOpenAir(l.style);
    const room = (i: number) => ({ title: t(open ? 'mapgen.place' : 'mapgen.room', { n: i + 1 }), note: '', color: open ? ('green' as const) : ('gold' as const) });
    failed = !(await layoutToMaps(l, t(`mapgen.style.${l.style}` as never), l.rooms.map((_, i) => room(i)), { pins: await landmarkPins(l) }));
  }
</script>

<div class="view">
  <header class="head">
    <h2>{t('mapgen.title')}</h2>
    <div class="spacer"></div>
    {#if mg.layout}<button class="btn" title={t('mapgen.toMapsHint')} onclick={toMaps}><MapIcon size={14} /> {t('mapgen.toMaps')}</button>{/if}
  </header>
  <p class="faint about"><Lead text={t('mapgen.about')} /></p>
  <div class="options">
    <label>{t('mapgen.kind')}
      <select bind:value={mg.style} onchange={save}>
        {#each LAYOUT_STYLES as id (id)}<option value={id}>{t(`mapgen.style.${id}` as never)}</option>{/each}
      </select>
    </label>
    <label>{t(isOpenAir(mg.style) ? 'mapgen.places' : 'mapgen.rooms')}
      <input type="number" min={MIN_ROOMS} max={MAX_ROOMS} bind:value={mg.rooms} onchange={save} />
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={create}><MapIcon size={16} /> {t('mapgen.create')}</button>
  </div>
  {#if failed}<p class="warn">{t('mapgen.noFolder')}</p>{/if}
  {#if mg.layout}
    <LayoutCanvas layout={mg.layout} />
  {:else}
    <p class="faint placeholder">{t('mapgen.empty')}</p>
  {/if}
</div>

<style>
  .view {
    max-width: 920px;
    padding: 16px 20px 32px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .head h2 {
    margin: 0;
    font-size: 18px;
  }
  .spacer {
    flex: 1;
  }
  .about {
    margin: 6px 0 12px;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
  }
  .options label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .options input {
    width: 72px;
  }
  .actions {
    margin: 12px 0 16px;
  }
  .big {
    padding: 6px 18px;
    font-size: 15px;
  }
  .placeholder {
    font-style: italic;
  }
  .warn {
    color: var(--warning);
  }
</style>
