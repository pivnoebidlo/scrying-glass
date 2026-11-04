<!-- Wilderness encounter (D&D, Tools → Wilderness encounter): the place, the heroes and the difficulty → a scene, foes by
     the 2024 budget and a small map. "To Maps" puts the heroes and the foes on it as tokens; the fog stays over the foes
     and is lifted from where the heroes stand. Each part can be rerolled; remembered by the window. -->
<script lang="ts">
  import { Check, Copy, Map as MapIcon, NotebookPen, RefreshCw, Swords, Trees } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import Lead from '../../../../renderer/lib/Lead.svelte';
  import { peekEntry } from '../../../../renderer/lib/entry/peek.svelte';
  import { locale, t } from '../../../../renderer/lib/i18n.svelte';
  import { openTab } from '../../../../renderer/lib/nav';
  import { store } from '../../../../renderer/lib/store.svelte';
  import { connectCards } from '../../../../modules/bestiary/ui/cards.svelte';
  import { journalFolder } from '../../../../modules/journal/ui/store.svelte';
  import { openPage } from '../../../../modules/journal/ui/ui.svelte';
  import { partyTokens } from '../../../../modules/maps/ui/party';
  import { findCard, toEncounter } from '../../../../modules/tools/encounter';
  import LayoutCanvas from '../../../../modules/tools/mapgen/LayoutCanvas.svelte';
  import { WILD_STYLES, type WildStyle } from '../../../../modules/tools/mapgen/layout';
  import { layoutToMaps, type MapExtras, type RoomPin } from '../../../../modules/tools/mapgen/toMaps';
  import { cardAsset } from '../../../../shared/cards';
  import { RATING_TITLES } from '../../difficulty';
  import { SCENES } from './content';
  import { DIFFICULTIES, foesRating, foesXp, generateSkirmish, generateSkirmishPart, heroCount, heroLevel, randomTerrain, skirmishSpots, type Difficulty, type Skirmish, type SkirmishPart } from './generate';
  import { foeLine, foeName, foesLine, skirmishMarkdown, skirmishTexts, type SkirmishLabels, type SkirmishLang } from './text';

  const KEY = 'skirmish.state';
  interface Saved {
    terrain: WildStyle | 'random';
    scene: number | 'random';
    level: number;
    heroes: number;
    difficulty: Difficulty;
    last: Skirmish | null;
  }
  const DEFAULTS: Saved = { terrain: 'random', scene: 'random', level: 3, heroes: 4, difficulty: 'moderate', last: null };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }
  const sk = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(sk)));
    } catch {
      /* not remembered — not a problem */
    }
  };
  const lang = $derived<SkirmishLang>(locale.lang === 'ru' ? 'ru' : 'en');
  const at = $derived(lang === 'ru' ? 1 : 0);

  function create() {
    sk.level = heroLevel(sk.level);
    sk.heroes = heroCount(sk.heroes);
    const terrain = sk.terrain === 'random' ? randomTerrain() : sk.terrain;
    sk.last = generateSkirmish({ terrain, level: sk.level, heroes: sk.heroes, difficulty: sk.difficulty }, sk.scene === 'random' ? null : sk.scene);
    save();
  }
  function reroll(part: SkirmishPart) {
    if (!sk.last) return;
    const x = $state.snapshot(sk.last) as Skirmish;
    sk.last = { ...x, ...generateSkirmishPart(part, x) };
    save();
  }

  const place = (x: Skirmish) => t(`mapgen.style.${x.terrain}`);
  const worth = (x: Skirmish) => t('skirmish.worth', { xp: foesXp(x.foes), rating: RATING_TITLES[foesRating(x)].toLowerCase() });
  const labels = (x: Skirmish): SkirmishLabels => ({
    place: place(x),
    foes: t('skirmish.part.foes'),
    worth: worth(x),
    start: t('skirmish.start'),
    motive: t('skirmish.motive'),
    complication: t('skirmish.complication'),
    ground: t('skirmish.ground'),
  });

  let copied = $state(false);
  function copy() {
    if (!sk.last) return;
    void navigator.clipboard.writeText(skirmishMarkdown(sk.last, lang, labels(sk.last)).replace(/\[\[([^\]]+)\]\]/g, '$1'));
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
  async function toJournal() {
    if (!sk.last) return;
    const title = `${skirmishTexts(sk.last, lang).title} (${place(sk.last)})`;
    const path = await window.api.createPage(journalFolder(store.state.adventures.current), title, skirmishMarkdown(sk.last, lang, labels(sk.last), false));
    if (!path) return;
    openPage(path);
    openTab('journal');
  }

  let missing = $state('');
  async function encounter(x: Skirmish) {
    const title = `${skirmishTexts(x, lang).title} (${place(x)})`;
    const lost = await toEncounter(title, x.foes.map((f) => ({ name: foeName(f, lang), count: f.count })), lang);
    missing = lost.length ? t('tools.noCards', { names: lost.join(', ') }) : '';
  }

  // The map goes to Maps with everyone on it. Heroes come from the party of the adventure, if it has one.
  let noMaps = $state(false);
  async function toMaps(x: Skirmish) {
    await connectCards();
    const o = skirmishTexts(x, lang);
    const party = await partyTokens(store.state);
    const spots = skirmishSpots(x, party.length || x.heroes);
    const cards = x.foes.map((f) => findCard(foeName(f, lang), lang));
    let hero = 0;
    const tokens: MapExtras['tokens'] = spots.map((c) => {
      if (c.kind === 'party') {
        const p = party[hero++];
        return { x: c.x, y: c.y, size: 1, name: p?.name ?? t('skirmish.hero', { n: hero }), portrait: p?.portrait ?? null, side: 'party' };
      }
      const card = cards[c.group];
      return { x: c.x, y: c.y, size: c.size, name: card?.name ?? foeName(x.foes[c.group]!, lang), portrait: card?.portrait ? cardAsset(card.ref.scope, card.portrait) : null, side: card?.side ?? 'enemy' };
    });
    const home = SCENES[x.scene]!.heroes;
    const rooms = x.map.rooms.map((_, i): RoomPin => (i === home ? { title: o.title, note: `${o.text}\n\n${o.start}\n\n${o.ground}`, color: 'gold', icon: 'shield' } : { title: t('mapgen.place', { n: i + 1 }), note: '', color: 'white' }));
    const first = spots.find((c) => c.kind === 'creature')!;
    const refs = cards.flatMap((c) => (c ? [c.ref] : []));
    const foes: MapExtras['pins'] = [{ x: first.x, y: first.y, title: foesLine(x, lang), note: `${o.motive}\n\n${t('skirmish.complication')}: ${o.complication}`, color: 'red', icon: 'swords', ...(refs.length ? { cards: refs } : {}) }];
    noMaps = !(await layoutToMaps(x.map, `${o.title} (${place(x)})`, rooms, { pins: foes, tokens, open: home }));
  }
</script>

{#snippet part(id: SkirmishPart, body: Snippet)}
  <section class="part">
    <header>
      <h3>{t(`skirmish.part.${id}`)}</h3>
      <div class="spacer"></div>
      <button class="icon-btn" title={t('tavern.rerollPart')} onclick={() => reroll(id)}><RefreshCw size={13} /></button>
    </header>
    {@render body()}
  </section>
{/snippet}

<div class="view">
  <header class="head">
    <h2>{t('skirmish.title')}</h2>
    <div class="spacer"></div>
    {#if sk.last}
      <button class="btn" title={t('tavern.toJournalHint')} onclick={toJournal}><NotebookPen size={14} /> {t('tavern.toJournal')}</button>
      <button class="btn" onclick={copy}>{#if copied}<Check size={14} /> {t('tavern.copied')}{:else}<Copy size={14} /> {t('tavern.copy')}{/if}</button>
    {/if}
  </header>
  <p class="faint about"><Lead text={t('skirmish.about')} /></p>

  <div class="options">
    <label>{t('skirmish.terrain')}
      <select bind:value={sk.terrain} onchange={save}>
        <option value="random">{t('skirmish.random')}</option>
        {#each WILD_STYLES as id (id)}<option value={id}>{t(`mapgen.style.${id}`)}</option>{/each}
      </select>
    </label>
    <label>{t('skirmish.scene')}
      <select bind:value={sk.scene} onchange={save}>
        <option value="random">{t('skirmish.random')}</option>
        {#each SCENES as s, i (s.id)}<option value={i}>{s.title[at]}</option>{/each}
      </select>
    </label>
    <label>{t('skirmish.level')}
      <input type="number" min="1" max="20" bind:value={sk.level} onchange={save} />
    </label>
    <label>{t('skirmish.heroes')}
      <input type="number" min="1" max="8" bind:value={sk.heroes} onchange={save} />
    </label>
    <label>{t('skirmish.difficulty')}
      <select bind:value={sk.difficulty} onchange={save}>
        {#each DIFFICULTIES as id (id)}<option value={id}>{RATING_TITLES[id]}</option>{/each}
      </select>
    </label>
  </div>
  <div class="actions">
    <button class="btn primary big" onclick={create}><Trees size={16} /> {t('skirmish.create')}</button>
  </div>

  {#if !sk.last}
    <p class="faint placeholder">{t('skirmish.empty')}</p>
  {:else}
    {@const x = sk.last}
    {@const o = skirmishTexts(x, lang)}
    <div class="sheet">
      {#snippet sceneBody()}
        <p class="name">{o.title}</p>
        <p class="faint">{place(x)}</p>
        <p class="mood">{o.text}</p>
        <p><b>{t('skirmish.start')}:</b> {o.start}</p>
        <p><b>{t('skirmish.motive')}:</b> {o.motive}</p>
        <p><b>{t('skirmish.complication')}:</b> {o.complication}</p>
        <p><b>{t('skirmish.ground')}:</b> {o.ground}</p>
      {/snippet}
      {@render part('scene', sceneBody)}
      {#snippet foesBody()}
        <ul>
          {#each x.foes as f, i (i)}
            <li><button class="link" onclick={() => peekEntry(foeName(f, lang))}>{foeLine(f, lang)}</button></li>
          {/each}
        </ul>
        <p class="faint">{worth(x)}</p>
        <div class="row"><button class="btn" title={t('tools.toEncounterHint')} onclick={() => encounter(x)}><Swords size={14} /> {t('tools.toEncounter')}</button></div>
        {#if missing}<p class="faint">{missing}</p>{/if}
      {/snippet}
      {@render part('foes', foesBody)}
      {#snippet mapBody()}
        <LayoutCanvas layout={x.map} marks={skirmishSpots(x)} />
        <p class="faint legend">{t('skirmish.mapLegend')}</p>
        <div class="row"><button class="btn" title={t('skirmish.toMapsHint')} onclick={() => toMaps(x)}><MapIcon size={14} /> {t('mapgen.toMaps')}</button></div>
        {#if noMaps}<p class="faint">{t('mapgen.noFolder')}</p>{/if}
      {/snippet}
      {@render part('map', mapBody)}
    </div>
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
    width: 70px;
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
  .sheet {
    display: grid;
    gap: 10px;
  }
  .part {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .part header {
    display: flex;
    align-items: center;
  }
  h3 {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .part p,
  .part ul {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  .part ul {
    padding-left: 18px;
  }
  .name {
    font-size: 22px;
  }
  .mood {
    padding: 4px 10px;
    border-left: 3px solid var(--accent);
    background: var(--bg-primary);
    font-style: italic;
  }
  .legend {
    text-align: center;
  }
  .row {
    margin-top: 6px;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline dotted;
    cursor: pointer;
  }
</style>
