<!-- Tools → Map editor: the drafts of the adventure, the map with its brushes and things, «To Maps». A draft is a layout
     of the map generator, so a generated map is edited the same way («Edit» in the generator). -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronDown, ChevronRight, Eye, FolderOpen, RefreshCw, Map as MapIcon, MousePointer2, Pencil, Plus, Redo2, RotateCw, Search, Trash2, Undo2, X, ZoomIn, ZoomOut } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import type { PropKind } from '../mapgen/furnish';
  import { isOpenAir, LIGHTS, tonesFor, type Light } from '../mapgen/layout';
  import { landmarkPins } from '../mapgen/landmarks';
  import { layoutToMaps } from '../mapgen/toMaps';
  import { brushesFor, MAX_SIDE, MIN_SIDE, removeProps, resize, rotateProp, setAssetVariant, setLight, setTone, STRETCH, tintProp, type BrushId } from './edit';
  import { TINTS, tintOf } from '../mapgen/draw-props';
  import MapCanvas from './MapCanvas.svelte';
  import NewMapDialog from './NewMapDialog.svelte';
  import PropIcon from './PropIcon.svelte';
  import { CELL_BASE, editor } from './store.svelte';
  import { assets, assetSrc } from './assets.svelte';
  import { groupTitle, type AssetThing, type MapAsset } from '../../../shared/mapassets';
  import { thumb } from '../../../shared/vault';
  import { modKey } from '../../../shared/hotkeys';

  // «⌘» or «Ctrl»: the strings add «+wheel» themselves.
  const mod = { mod: modKey().replace(/\+$/, '') };

  let creating = $state(false);
  let sizing = $state<{ w: number; h: number } | null>(null);
  let failed = $state(false);
  let titleInput = $state('');
  // The «New map…» item of the list of maps.
  const NEW = '\u0000new';

  onMount(() => {
    void editor.refresh();
    void assets.load();
    return () => void editor.flush();
  });
  // The list follows the adventure.
  $effect(() => {
    void store.state.adventures.current;
    void editor.refresh();
  });
  $effect(() => {
    titleInput = editor.title;
  });

  const layout = $derived(editor.layout);
  const brushes = $derived(layout ? brushesFor(layout.style) : []);
  // A brush of another kind of map (a road in a cave) gives way to the first of this one.
  $effect(() => {
    if (layout && !brushes.some((b) => b.id === editor.brush)) editor.brush = brushes[0]!.id;
  });

  const SWATCH: Record<BrushId, string> = {
    floor: '#d9cfb8', wall: '#26221d', room: '#d9cfb8', door: '#7a5230', pillar: '#120f0b', grass: '#7f9558', road: '#b3a78f', square: '#c2b8a2',
    house: '#a9583c', sand: '#d9c893', water: '#3f7d97', ford: '#7fb0bd', tree: '#3f6a35', boulder: '#8c8c86', townWall: '#857e72', tower: '#7a7368',
    lava: '#e2561b', ice: '#cfe6ee', mud: '#6b5638', pit: '#0b0907', planks: '#a87a4a', timber: '#5e4630', build: '#8a6a48', roof: '#9b4a35', erase: '#555',
    cobbles: '#9a9282', flags: '#b7ad98', field: '#8a6c44', sea: '#2a5c78', mountain: '#8a8174', pine: '#2c4a33', palm: '#5f8f3c', snag: '#5b4a3a',
  };
  const GROUPS: { id: string; kinds: PropKind[] }[] = [
    { id: 'furniture', kinds: ['table', 'roundtable', 'counter', 'chair', 'stool', 'bench', 'cushion', 'bed', 'shelf', 'wardrobe', 'desk', 'throne', 'hearth', 'bathtub', 'chandelier', 'rug'] },
    { id: 'storage', kinds: ['barrel', 'crate', 'sack', 'chest', 'coins', 'rack', 'urn', 'bucket', 'woodpile'] },
    { id: 'work', kinds: ['workbench', 'anvil', 'grindstone', 'cauldron', 'trough'] },
    { id: 'shrine', kinds: ['altar', 'candle', 'brazier', 'statue', 'idol', 'pedestal', 'crystal', 'circle', 'obelisk', 'sarcophagus', 'grave', 'bones'] },
    { id: 'dungeon', kinds: ['stairs', 'trapdoor', 'cage', 'chains', 'stocks', 'spikes', 'web', 'lever', 'plate', 'torch', 'rubble'] },
    { id: 'town', kinds: ['stall', 'cart', 'haystack', 'tent', 'boat', 'fence', 'signpost', 'lamppost', 'gallows', 'well', 'fountain'] },
    { id: 'cave', kinds: ['stalagmite', 'mushrooms', 'puddle', 'campfire', 'bedroll', 'nest'] },
    { id: 'wild', kinds: ['log', 'stump', 'bush', 'flowers', 'reeds', 'fern', 'deadtree', 'menhir', 'cairn', 'totem'] },
  ];
  // Folded groups and the search of things: the window remembers the folds.
  const FOLDS = 'sg.mapedit.folded';
  let folded = $state<string[]>(
    (() => {
      try {
        const v = JSON.parse(localStorage.getItem(FOLDS) ?? '[]');
        return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
      } catch {
        return [];
      }
    })(),
  );
  function fold(id: string) {
    folded = folded.includes(id) ? folded.filter((x) => x !== id) : [...folded, id];
    try {
      localStorage.setItem(FOLDS, JSON.stringify(folded));
    } catch {
      /* the window forgets */
    }
  }
  let query = $state('');
  // The brushes, by what they make: the ground, and what is built on it.
  const BUILDING: BrushId[] = ['room', 'house', 'build', 'timber', 'planks', 'door', 'roof', 'pillar', 'townWall', 'tower'];
  const GROWTH: BrushId[] = ['tree', 'pine', 'palm', 'snag', 'boulder', 'mountain'];
  const brushGroups = $derived(
    [
      { id: 'surfaces', list: brushes.filter((b) => !BUILDING.includes(b.id) && !GROWTH.includes(b.id)) },
      { id: 'growth', list: brushes.filter((b) => GROWTH.includes(b.id)) },
      { id: 'building', list: brushes.filter((b) => BUILDING.includes(b.id)) },
    ].filter((g) => g.list.length),
  );
  const foundBrushes = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return q ? brushes.filter((b) => t(`mapedit.brush.${b.id}` as never).toLowerCase().includes(q)) : [];
  });
  const found = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return GROUPS.flatMap((g) => g.kinds).filter((k) => t(`mapedit.prop.${k}` as never).toLowerCase().includes(q) || k.includes(q));
  });
  // The colours of the thing being put down or the one chosen.
  const tintKind = $derived(editor.mode === 'place' ? editor.prop : editor.mode === 'select' ? (layout?.props?.[editor.selected]?.kind ?? null) : null);
  const tints = $derived(tintKind ? (TINTS[tintKind] ?? null) : null);
  const tintNow = $derived(editor.mode === 'select' ? (layout?.props?.[editor.selected]?.tint ?? null) : editor.tint);
  function pickTint(i: number | null) {
    if (!tints) return;
    const t = i === null ? null : tintOf(i, tints.length);
    if (editor.mode === 'select' && editor.layout && editor.selected >= 0) {
      // Every picked thing of the same kind takes the colour.
      let next = editor.layout;
      for (const n of editor.picked) if (next.props?.[n]?.kind === tintKind) next = tintProp(next, n, t ?? Math.random());
      editor.change(next);
    } else editor.tint = t;
  }
  const isTint = (i: number) => tints !== null && tintNow !== null && Math.floor(tintNow * tints.length) === i;
  // The box the map scrolls in: room around the map to take any of its corners to the middle (half the view on
  // every side), a pinch or ⌘ / Ctrl + wheel zooms around the cursor, the wheel and two fingers scroll.
  let viewport = $state<HTMLElement>();
  let scrollW = $state(0);
  let scrollH = $state(0);
  $effect(() => {
    const box = viewport;
    if (!box) return;
    editor.viewport = box;
    const wheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      editor.wheelZoom(e);
    };
    box.addEventListener('wheel', wheel, { passive: false });
    return () => {
      box.removeEventListener('wheel', wheel);
      if (editor.viewport === box) editor.viewport = null;
    };
  });
  // A map just opened: all of it, in the middle.
  let fitted: string | null = null;
  $effect(() => {
    const p = editor.path;
    if (!viewport || !scrollW || !layout || p === fitted) return;
    fitted = p;
    requestAnimationFrame(() => editor.fit());
  });

  // The GM's own pictures: groups by folder, folded until opened (there may be thousands); the search finds them too.
  const OPEN = 'sg.mapedit.assetsOpen';
  let opened = $state<string[]>(
    (() => {
      try {
        const v = JSON.parse(localStorage.getItem(OPEN) ?? '[]');
        return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
      } catch {
        return [];
      }
    })(),
  );
  function openGroup(g: string) {
    opened = opened.includes(g) ? opened.filter((x) => x !== g) : [...opened, g];
    try {
      localStorage.setItem(OPEN, JSON.stringify(opened));
    } catch {
      /* the window forgets */
    }
  }
  const assetGroups = $derived.by(() => {
    const by = new Map<string, AssetThing[]>();
    for (const th of assets.things) by.set(th.group, [...(by.get(th.group) ?? []), th]);
    return [...by.entries()].map(([group, list]) => ({ group, list }));
  });
  // A search shows no more than this many: a word like «a» would find everything.
  const FOUND_MAX = 120;
  const foundAssets = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return q ? assets.things.filter((th) => th.title.toLowerCase().includes(q) || th.group.toLowerCase().includes(q)).slice(0, FOUND_MAX) : [];
  });
  const pickAsset = (th: AssetThing) => {
    editor.mode = 'place';
    editor.prop = 'asset';
    editor.asset = th.variants[0]!;
    editor.selected = -1;
  };
  // The variants of the picture being put down or of the one picked.
  const pickedAsset = $derived(editor.mode === 'select' ? layout?.props?.[editor.selected] : undefined);
  const variantsOf = $derived.by((): { thing: AssetThing; now: string | null } | null => {
    const path = editor.mode === 'place' && editor.prop === 'asset' ? editor.asset?.path : pickedAsset?.kind === 'asset' ? pickedAsset.asset : undefined;
    const a = path ? assets.byPath.get(path) : undefined;
    const thing = a ? assets.byBase.get(a.base) : undefined;
    return thing && thing.variants.length > 1 ? { thing, now: editor.mode === 'place' && editor.assetAny ? null : path! } : null;
  });
  function pickVariant(v: MapAsset | null) {
    if (editor.mode === 'place') {
      editor.assetAny = v === null;
      if (v) editor.asset = v;
      return;
    }
    if (!v || !editor.layout) return;
    // Every picked picture of the same thing takes the variant.
    let next = editor.layout;
    for (const n of editor.picked) {
      const q = next.props?.[n];
      if (q?.kind === 'asset' && q.asset && assets.byPath.get(q.asset)?.base === v.base) next = setAssetVariant(next, n, v);
    }
    editor.change(next);
  }
  const pickBrush = (id: BrushId) => ((editor.mode = 'brush'), (editor.brush = id), (editor.selected = -1));
  // Another thing — a random colour again (a red rug does not make every chest red).
  const pickProp = (k: PropKind) => {
    if (editor.prop !== k) editor.tint = null;
    editor.mode = 'place';
    editor.prop = k;
    editor.selected = -1;
  };
  function rotate() {
    if (!editor.layout) return;
    if (editor.picked.length) {
      let next = editor.layout;
      for (const n of editor.picked) next = rotateProp(next, n);
      editor.change(next);
    } else editor.face = ((editor.face + 1) % 4) as 0 | 1 | 2 | 3;
  }
  function removeSelected() {
    if (!editor.layout || !editor.picked.length) return;
    editor.change(removeProps(editor.layout, editor.picked));
    editor.picked = [];
  }
  function setViewing(on: boolean) {
    editor.viewing = on;
    if (on) editor.picked = [];
  }
  async function toMaps() {
    if (!editor.layout) return;
    await editor.flush();
    const l = $state.snapshot(editor.layout);
    await assets.loadFor(l);
    const open = isOpenAir(l.style);
    const room = (i: number) => ({ title: t(open ? 'mapgen.place' : 'mapgen.room', { n: i + 1 }), note: '', color: open ? ('green' as const) : ('gold' as const) });
    failed = !(await layoutToMaps(l, editor.title, l.rooms.map((_, i) => room(i)), { pins: await landmarkPins(l) }));
  }
  function remove() {
    if (confirm(t('mapedit.deleteQ', { name: editor.title }))) void editor.remove();
  }
  function applySize() {
    if (!sizing || !editor.layout) return;
    editor.change(resize(editor.layout, sizing.w, sizing.h));
    sizing = null;
  }

  const hint = $derived(
    editor.viewing
      ? t('mapedit.hint.view', mod)
      : editor.mode === 'brush'
      ? t(`mapedit.hint.${(brushes.find((b) => b.id === editor.brush)?.rect ? 'rect' : brushes.find((b) => b.id === editor.brush)?.toggle ? 'toggle' : 'paint')}` as never, mod)
      : editor.mode === 'place'
        ? t('mapedit.hint.place')
        : t('mapedit.hint.select'),
  );
  const tones = $derived(layout ? tonesFor(layout.style) : []);

  function onkeydown(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    if (!editor.layout || creating || sizing || (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable))) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.code === 'KeyZ') {
      e.preventDefault();
      if (e.shiftKey) editor.redo();
      else editor.undo();
    } else if (mod && e.code === 'KeyY') {
      e.preventDefault();
      editor.redo();
    } else if (!mod && (e.code === 'Digit0' || e.code === 'Numpad0')) editor.fit();
    else if (!mod && (e.code === 'Digit1' || e.code === 'Numpad1')) editor.zoomTo(CELL_BASE);
    else if (!mod && (e.code === 'Equal' || e.code === 'NumpadAdd')) editor.zoomBy(1.25);
    else if (!mod && (e.code === 'Minus' || e.code === 'NumpadSubtract')) editor.zoomBy(1 / 1.25);
    else if (!mod && e.code === 'KeyH') setViewing(true);
    else if (!mod && e.code === 'KeyV') {
      setViewing(false);
      editor.mode = 'select';
      editor.prop = null;
    } else if (!mod && e.code === 'KeyB') {
      setViewing(false);
      editor.mode = 'brush';
      editor.selected = -1;
    } else if (editor.viewing) return;
    else if (mod && e.code === 'KeyA' && editor.mode === 'select') {
      e.preventDefault();
      editor.picked = (editor.layout.props ?? []).map((_, i) => i);
    } else if (!mod && e.code === 'KeyR') rotate();
    else if ((e.key === 'Delete' || e.key === 'Backspace') && editor.picked.length) {
      e.preventDefault();
      removeSelected();
    } else if (e.key === 'Escape') {
      editor.selected = -1;
      editor.mode = editor.mode === 'place' ? 'select' : editor.mode;
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="editor">
  {#if !layout}
    <div class="empty">
      <h2>{t('mapedit.title')}</h2>
      <p class="faint">{t('mapedit.about')}</p>
      <div class="row">
        <button class="btn primary" onclick={() => (creating = true)}><Plus size={14} /> {t('mapedit.new')}</button>
      </div>
      {#if editor.drafts.length}
        <div class="label">{t('mapedit.myMaps')}</div>
        {#each editor.drafts as p (p)}
          <button class="draft" title={p} onclick={() => void editor.open(p)}>{p.slice(p.lastIndexOf('/') + 1).replace(/\.map\.json$/i, '')}</button>
        {/each}
      {/if}
    </div>
  {:else}
    <header>
      <select class="maps" aria-label={t('mapedit.myMaps')} value={editor.path} onchange={(e) => (e.currentTarget.value === NEW ? ((creating = true), (e.currentTarget.value = editor.path ?? '')) : void editor.open(e.currentTarget.value))}>
        {#each editor.drafts as p (p)}<option value={p}>{p.slice(p.lastIndexOf('/') + 1).replace(/\.map\.json$/i, '')}</option>{/each}
        <option value={NEW}>{t('mapedit.new')}</option>
      </select>
      <input class="name" type="text" aria-label={t('mapedit.name')} bind:value={titleInput} onchange={() => void editor.rename(titleInput)} />
      <span class="faint small">{t(`mapgen.style.${layout.style}` as never)} · {layout.w} × {layout.h}</span>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('mapedit.undo')} disabled={!editor.undos} onclick={() => editor.undo()}><Undo2 size={15} /></button>
      <button class="icon-btn" title={t('mapedit.redo')} disabled={!editor.redos} onclick={() => editor.redo()}><Redo2 size={15} /></button>
      <button class="btn" onclick={() => (sizing = { w: layout.w, h: layout.h })}>{t('mapedit.size')}</button>
      <button class="icon-btn" title={t('mapedit.delete')} onclick={remove}><Trash2 size={15} /></button>
      <button class="btn primary" title={t('mapgen.toMapsHint')} onclick={toMaps}><MapIcon size={14} /> {t('mapgen.toMaps')}</button>
    </header>
    {#if sizing}
      <form class="sizing" onsubmit={(e) => (e.preventDefault(), applySize())}>
        <label>{t('mapedit.width')} <input type="number" min={MIN_SIDE} max={MAX_SIDE} bind:value={sizing.w} /></label>
        <label>{t('mapedit.height')} <input type="number" min={MIN_SIDE} max={MAX_SIDE} bind:value={sizing.h} /></label>
        <span class="faint small">{t('mapedit.sizeHint')}</span>
        <button class="btn primary" type="submit">{t('mapedit.apply')}</button>
        <button class="btn" type="button" onclick={() => (sizing = null)}>{t('mapedit.cancel')}</button>
      </form>
    {/if}
    {#if failed}<p class="warning small">{t('mapgen.noFolder')}</p>{/if}
    <div class="toolbar" role="toolbar" aria-label={t('mapedit.brushes')}>
      <div class="seg">
        <button class:on={editor.viewing} title="{t('mapedit.view')} · H" onclick={() => setViewing(true)}><Eye size={14} /> {t('mapedit.view')}</button>
        <button class:on={!editor.viewing} title="{t('mapedit.edit')} · V / B" onclick={() => setViewing(false)}><Pencil size={14} /> {t('mapedit.edit')}</button>
      </div>
      <span class="sep"></span>
      {#if !editor.viewing}
      <span class="faint small">{t('mapedit.thickness')}</span>
      {#each [1, 2, 3] as n (n)}<button class="btn size" class:on={editor.size === n} onclick={() => (editor.size = n)}>{n}</button>{/each}
      <span class="sep"></span>
      <label class="check">{t('mapedit.ground')}
        <select value={layout.tone ?? ''} onchange={(e) => editor.layout && editor.change(setTone(editor.layout, e.currentTarget.value || null))}>
          <option value="">{t('mapedit.tone.usual')}</option>
          {#each tones as tn (tn)}<option value={tn}>{t(`mapedit.tone.${tn}` as never)}</option>{/each}
        </select>
      </label>
      <label class="check">{t('mapedit.light')}
        <select value={layout.light ?? ''} onchange={(e) => editor.layout && editor.change(setLight(editor.layout, (e.currentTarget.value || null) as Light | null))}>
          <option value="">{t('mapedit.light.day')}</option>
          {#each LIGHTS as h (h)}<option value={h}>{t(`mapedit.light.${h}` as never)}</option>{/each}
        </select>
      </label>
      <span class="sep"></span>
      {/if}
      <label class="check"><input type="checkbox" bind:checked={editor.grid} /> {t('mapedit.grid')}</label>
      <label class="check"><input type="checkbox" bind:checked={editor.numbers} /> {t('mapedit.numbers')}</label>
    </div>
    <div class="body">
      <section class="map">
        <div class="scroll" bind:this={viewport} bind:clientWidth={scrollW} bind:clientHeight={scrollH}>
          <div class="room" style:padding="{Math.round(scrollH / 2)}px {Math.round(scrollW / 2)}px"><MapCanvas {layout} /></div>
        </div>
        <div class="zoombar">
          <button class="icon-btn" title={t('mapedit.zoomOut', mod)} onclick={() => editor.zoomBy(1 / 1.25)}><ZoomOut size={16} /></button>
          <span class="percent">{Math.round((editor.cell / CELL_BASE) * 100)}%</span>
          <button class="icon-btn" title={t('mapedit.zoomIn', mod)} onclick={() => editor.zoomBy(1.25)}><ZoomIn size={16} /></button>
          <button class="btn fitbtn" title={t('mapedit.fitHint')} onclick={() => editor.fit()}>{t('mapedit.fit')}</button>
        </div>
        <div class="hint" title={hint}>{hint}</div>
      </section>
      {#if !editor.viewing}
      <section class="palette" aria-label={t('mapedit.things')}>
        <div class="head">
        <div class="row">
          <button class="tool grow" title="{t('mapedit.select')} · V" class:on={editor.mode === 'select'} onclick={() => ((editor.mode = 'select'), (editor.prop = null))}><MousePointer2 size={14} /> {t('mapedit.select')}</button>
          <button class="icon-btn" title={t('mapedit.rotate')} onclick={rotate}><RotateCw size={15} /></button>
          <button class="icon-btn" title={t('mapedit.removePicked')} disabled={!editor.picked.length} onclick={removeSelected}><Trash2 size={15} /></button>
        </div>
        {#if editor.picked.length > 1}<p class="faint small">{t('mapedit.picked', { count: editor.picked.length })}</p>{/if}
        {#if tints}
          <div class="group">{t('mapedit.colour')}</div>
          <div class="tints">
            {#if editor.mode === 'place'}<button class="tintbtn random" class:on={editor.tint === null} title={t('mapedit.randomColour')} onclick={() => pickTint(null)}>?</button>{/if}
            {#each tints as colour, i (i)}<button class="tintbtn" class:on={isTint(i)} style:background={colour} aria-label={colour} onclick={() => pickTint(i)}></button>{/each}
          </div>
        {/if}
        {#if variantsOf}
          <div class="group">{t('mapedit.variant')} · {variantsOf.thing.variants.length}</div>
          <div class="variants">
            {#if editor.mode === 'place'}<button class="variant random" class:on={editor.assetAny} title={t('mapedit.randomVariant')} onclick={() => pickVariant(null)}>?</button>{/if}
            {#each variantsOf.thing.variants as v (v.path)}
              <button class="variant" class:on={variantsOf.now === v.path} title={v.variant || v.title} onclick={() => pickVariant(v)}>
                <img src={thumb(assetSrc(v.path), 40, true)} alt="" loading="lazy" draggable="false" />
              </button>
            {/each}
          </div>
        {/if}
        {#if editor.mode === 'select' && editor.selected >= 0 && layout.props?.[editor.selected] && STRETCH.includes(layout.props[editor.selected]!.kind)}
          <p class="faint small">{t('mapedit.stretchHint')}</p>
        {/if}
        <label class="search">
          <Search size={13} />
          <input type="search" placeholder={t('mapedit.searchThings')} bind:value={query} />
          {#if query}<button class="icon-btn clear" aria-label={t('mapedit.cancel')} onclick={() => (query = '')}><X size={12} /></button>{/if}
        </label>
        </div>
        {#snippet things(kinds: PropKind[])}
          <div class="grid">
            {#each kinds as k (k)}
              <button class="thing" class:on={editor.mode === 'place' && editor.prop === k} title={t(`mapedit.prop.${k}` as never)} onclick={() => pickProp(k)}>
                <PropIcon kind={k} />
                <span>{t(`mapedit.prop.${k}` as never)}</span>
              </button>
            {/each}
          </div>
        {/snippet}
        {#snippet assetList(list: AssetThing[])}
          <div class="grid">
            {#each list as th (th.base)}
              <button class="thing" class:on={editor.mode === 'place' && editor.prop === 'asset' && editor.asset?.base === th.base} title="{th.title}{th.variants.length > 1 ? ` · ${th.variants.length}` : ''}" onclick={() => pickAsset(th)}>
                <img class="pic" src={thumb(assetSrc(th.variants[0]!.path), 40, true)} alt="" loading="lazy" draggable="false" />
                <span>{th.title}</span>
                {#if th.variants.length > 1}<span class="many">{th.variants.length}</span>{/if}
              </button>
            {/each}
          </div>
        {/snippet}
        {#snippet assetHead()}
          <div class="group assets-head">
            <span>{t('mapedit.assets')}</span>
            <span class="count">{assets.things.length}</span>
            <span class="spacer"></span>
            <button class="icon-btn" title={t('mapedit.assetsRefresh')} onclick={() => void assets.load(true)}><RefreshCw size={12} /></button>
            <button class="icon-btn" title={t('mapedit.assetsFolderHint')} onclick={() => void window.api.revealMapAssets()}><FolderOpen size={13} /></button>
          </div>
          {#if assets.ready && !assets.list.length}<p class="faint small">{t('mapedit.assetsEmpty')}</p>{/if}
          {#if assets.cut}<p class="warning small">{t('mapedit.assetsCut', { count: assets.list.length })}</p>{/if}
        {/snippet}
        {#snippet brushList(list: typeof brushes)}
          <div class="brushes">
            {#each list as b (b.id)}
              <button class="tool" class:on={editor.mode === 'brush' && editor.brush === b.id} title={b.id === 'build' || b.id === 'roof' ? t('mapedit.buildHint') : t(`mapedit.brush.${b.id}` as never)} onclick={() => pickBrush(b.id)}>
                <span class="swatch {b.id}" style:background={SWATCH[b.id]}></span>
                <span class="bname">{t(`mapedit.brush.${b.id}` as never)}</span>
              </button>
            {/each}
          </div>
        {/snippet}
        {#if found}
          {#if foundBrushes.length}{@render brushList(foundBrushes)}{/if}
          {#if found.length}{@render things(found)}{/if}
          {#if foundAssets.length}
            <div class="group">{t('mapedit.assets')}</div>
            {@render assetList(foundAssets)}
            {#if foundAssets.length === FOUND_MAX}<p class="faint small">{t('mapedit.foundMore', { count: FOUND_MAX })}</p>{/if}
          {/if}
          {#if !found.length && !foundBrushes.length && !foundAssets.length}<p class="faint small">{t('mapedit.nothingFound')}</p>{/if}
        {:else}
          {#each brushGroups as g (g.id)}
            <button class="group fold" aria-expanded={!folded.includes(g.id)} onclick={() => fold(g.id)}>
              {#if folded.includes(g.id)}<ChevronRight size={13} />{:else}<ChevronDown size={13} />{/if}
              {t(`mapedit.group.${g.id}` as never)}
              <span class="count">{g.list.length}</span>
            </button>
            {#if !folded.includes(g.id)}{@render brushList(g.list)}{/if}
          {/each}
          {#each GROUPS as g (g.id)}
            <button class="group fold" aria-expanded={!folded.includes(g.id)} onclick={() => fold(g.id)}>
              {#if folded.includes(g.id)}<ChevronRight size={13} />{:else}<ChevronDown size={13} />{/if}
              {t(`mapedit.group.${g.id}` as never)}
              <span class="count">{g.kinds.length}</span>
            </button>
            {#if !folded.includes(g.id)}{@render things(g.kinds)}{/if}
          {/each}
          {@render assetHead()}
          {#each assetGroups as g (g.group)}
            <button class="group fold" aria-expanded={opened.includes(g.group)} onclick={() => openGroup(g.group)}>
              {#if opened.includes(g.group)}<ChevronDown size={13} />{:else}<ChevronRight size={13} />{/if}
              <span class="gname" title={groupTitle(g.group)}>{#if g.group.includes('/')}<span class="faint">{groupTitle(g.group.slice(0, g.group.lastIndexOf('/')))} / </span>{/if}{g.group ? groupTitle(g.group.slice(g.group.lastIndexOf('/') + 1)) : t('mapedit.assets')}</span>
              <span class="count">{g.list.length}</span>
            </button>
            {#if opened.includes(g.group)}{@render assetList(g.list)}{/if}
          {/each}
        {/if}
      </section>
      {/if}
    </div>
  {/if}
</div>

{#if creating}<NewMapDialog onclose={() => (creating = false)} />{/if}

<style>
  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .label {
    padding: 14px 0 6px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .draft {
    display: block;
    padding: 5px 8px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .draft:hover {
    background: var(--bg-hover);
  }
  .small {
    font-size: 12px;
  }
  .faint {
    color: var(--text-muted);
  }
  .warning {
    margin: 4px 14px;
    color: var(--warning);
  }
  .empty {
    padding: 24px;
    max-width: 640px;
  }
  .empty h2 {
    margin: 0 0 8px;
    font-size: 18px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .maps {
    max-width: 180px;
  }
  .name {
    width: 220px;
    font-size: 15px;
    font-weight: 600;
    background: transparent;
    border-color: transparent;
  }
  .name:hover,
  .name:focus {
    border-color: var(--border);
  }
  .spacer {
    flex: 1;
  }
  .sizing {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .sizing label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .sizing input {
    width: 80px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-bottom: 1px solid var(--border);
  }
  .sep {
    width: 1px;
    height: 20px;
    margin: 0 4px;
    background: var(--border);
  }
  .tool {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    white-space: nowrap;
    cursor: pointer;
  }
  .tool:hover {
    background: var(--bg-hover);
  }
  .tool.on,
  .size.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .size {
    min-width: 28px;
    justify-content: center;
    padding: 2px 6px;
  }
  .brushes {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1px;
    margin-bottom: 6px;
  }
  .brushes .tool {
    min-width: 0;
    justify-content: flex-start;
    padding: 3px 6px;
    font-size: 13px;
  }
  .brushes .bname {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .swatch {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    border: 1px solid #120f0b;
    border-radius: 3px;
  }
  .swatch.room {
    box-shadow: inset 0 0 0 2px #120f0b;
  }
  .swatch.pillar,
  .swatch.tree,
  .swatch.tower {
    border-radius: 50%;
  }
  .swatch.door {
    transform: scaleX(0.45);
  }
  .swatch.erase {
    background: repeating-linear-gradient(45deg, #666 0 3px, #2a2a2a 3px 6px) !important;
  }
  .check {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 4px;
    font-size: 12px;
  }
  .body {
    flex: 1;
    min-height: 0;
    display: flex;
  }
  .map {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: color-mix(in srgb, var(--bg-primary) 70%, #000);
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .room {
    width: max-content;
  }
  .map {
    position: relative;
  }
  .zoombar {
    position: absolute;
    right: 12px;
    bottom: 40px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 3px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }
  .percent {
    min-width: 42px;
    text-align: center;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
  }
  .fitbtn {
    padding: 2px 8px;
    font-size: 12px;
  }
  .tints {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 0 2px 4px;
  }
  .tintbtn {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border);
    border-radius: 50%;
    cursor: pointer;
  }
  .tintbtn.on {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
  .tintbtn.random {
    background: var(--bg-primary);
    color: var(--text-muted);
    font-size: 12px;
  }
  .hint {
    padding: 6px 12px;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .head {
    position: sticky;
    top: -8px;
    z-index: 1;
    margin: -8px -8px 0;
    padding: 8px 8px 6px;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border);
  }
  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    padding: 0 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    color: var(--text-muted);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: none;
    background: none;
    padding: 4px 0;
  }
  .clear {
    padding: 2px;
  }
  .fold {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .fold:hover {
    color: var(--text-normal);
  }
  .count {
    margin-left: auto;
    font-weight: 400;
    opacity: 0.7;
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .seg button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .seg button.on {
    background: var(--accent-soft);
    color: var(--text-normal);
  }
  .check select {
    padding: 2px 4px;
  }
  .palette {
    width: 196px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    border-left: 1px solid var(--border);
    overflow: auto;
  }
  .row {
    display: flex;
    gap: 4px;
  }
  .grow {
    flex: 1;
  }
  .group {
    padding: 10px 2px 4px;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
  }
  .thing {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 52px;
    padding: 4px 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-normal);
    font-size: 10.5px;
    overflow: hidden;
    cursor: pointer;
  }
  .thing span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .thing:hover {
    background: var(--bg-hover);
  }
  .thing {
    position: relative;
  }
  .thing .pic {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }
  .thing .many {
    position: absolute;
    top: 2px;
    right: 3px;
    color: var(--text-faint);
    font-size: 9.5px;
  }
  .variants {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    max-height: 132px;
    overflow-y: auto;
    padding: 0 2px 4px;
  }
  .variant {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 1px;
    border: 2px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-primary);
    color: var(--text-muted);
    cursor: pointer;
  }
  .variant img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .variant.on {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
  .assets-head {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 10px;
  }
  .assets-head .spacer {
    flex: 1;
  }
  .gname {
    display: flex;
    min-width: 0;
    white-space: nowrap;
  }
  /* The folders above shrink first: the group's own name stays readable. */
  .gname .faint {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: normal;
  }
  .thing.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
</style>
