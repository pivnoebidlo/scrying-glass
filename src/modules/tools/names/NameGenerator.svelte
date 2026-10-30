<!-- Name generator (Tools → Name generator): race, gender, name form and nickname, filters by length, sound and
     first letters, 1–20 names at once. Each name can be copied or starred; favorites and history export to TXT / CSV.
     Lists: built-in (in the interface language) and the GM's own from the library (names/<lang>/). -->
<script lang="ts">
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { hint } from '../../../shared/hotkeys';
  import { onMount } from 'svelte';
  import { Check, Copy, Dices, FolderOpen, Star, Trash2, Upload } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { LANGUAGES } from '../../../shared/cards';
  import { generateNames, isPeople, nameText, peoplesIn, racesIn, RACES, type Gender, type LengthFilter, type NameOptions, type SoundFilter } from '../../../shared/names';
  import {
    asCsv, asText, book, clearFavorites, clearHistory, isFavorite, langNow, listLangs, loadFavorites, loadOwn, names, opts, ownCount, remember,
    resetFilters, saveOptions, toggleFavorite, type SavedName,
  } from './store.svelte';

  onMount(() => {
    void loadOwn();
    void loadFavorites();
  });

  const current = $derived(book());
  const races = $derived(racesIn(current));
  // The chosen race has no names in these lists (own lists turned off, another language) — the first that has.
  const race = $derived(races.includes(opts.race) ? opts.race : (races[0] ?? opts.race));
  // Peoples of the race (humans of the Forgotten Realms); '' — the common names of the race.
  const peoples = $derived(peoplesIn(current, race));
  const people = $derived(peoples.includes(opts.people) ? opts.people : '');
  const raceTitle = (id: string) =>
    (RACES as readonly string[]).includes(id) || isPeople(id) ? t(`names.race.${id}` as never) : id.charAt(0).toUpperCase() + id.slice(1);
  const genderTitle = (g: Gender) => t(g === 'male' ? 'names.male' : 'names.female');
  const quote = (s: string) => t('common.quote', { text: s });
  const filtersOn = $derived(opts.length !== 'any' || opts.sound !== 'any' || !!opts.first.trim());

  const set = <K extends keyof typeof opts>(k: K, v: (typeof opts)[K]) => {
    opts[k] = v;
    saveOptions();
  };

  function generate() {
    const o: NameOptions = { ...$state.snapshot(opts), race: people || race };
    const list = generateNames(current, o);
    names.results = list;
    remember(list.map((g) => ({ text: nameText(g, quote), race: o.race, gender: opts.gender })));
  }

  let copied = $state('');
  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    copied = text;
    setTimeout(() => copied === text && (copied = ''), 1200);
  }

  let status = $state('');
  async function importLists() {
    const r = await window.api.importNameLists();
    if (!r) return;
    await loadOwn();
    status = [r.count ? t('names.imported', { count: r.count }) : '', ...r.errors].filter(Boolean).join(' ');
  }

  const fileStem = (kind: 'favorites' | 'history') => t(kind === 'favorites' ? 'names.fileFavorites' : 'names.fileHistory');
  const exportList = (list: SavedName[], kind: 'favorites' | 'history', csv: boolean) =>
    window.api.saveTextFile(
      `${fileStem(kind)}.${csv ? 'csv' : 'txt'}`,
      csv ? asCsv(list, [t('names.csvName'), t('names.csvRace'), t('names.csvGender')], raceTitle, genderTitle) : asText(list)
    );

  function onkeydown(e: KeyboardEvent) {
    const el = e.target as HTMLElement;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable) return;
    if (e.code === 'Space' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      generate();
    }
  }

  const LENGTHS: LengthFilter[] = ['any', 'short', 'medium', 'long'];
  const SOUNDS: SoundFilter[] = ['any', 'melodic', 'soft', 'harsh'];
</script>

<svelte:window {onkeydown} />

<div class="view">
  <header class="head">
    <h2>{t('names.title')}</h2>
    <div class="spacer"></div>
    {#if listLangs().length > 1}
      <select title={t('names.langHint')} value={langNow()} onchange={(e) => set('lang', e.currentTarget.value)}>
        {#each listLangs() as l (l)}<option value={l}>{LANGUAGES[l] ?? l}</option>{/each}
      </select>
    {/if}
    <button class="btn" title={t('names.importHint')} onclick={importLists}><Upload size={14} /> {t('names.import')}</button>
    <button class="icon-btn" title={t('names.reveal')} onclick={() => window.api.revealNameLists()}><FolderOpen size={15} /></button>
  </header>
  <p class="faint about"><Lead text={t('names.about')} /></p>
  {#if status}<p class="status">{status}</p>{/if}

  <div class="panel">
    <div class="row">
      <span class="label">{t('names.race')}</span>
      <div class="chips">
        {#each races as r (r)}<button class:on={race === r} onclick={() => set('race', r)}>{raceTitle(r)}</button>{/each}
      </div>
    </div>
    {#if peoples.length}
      <div class="row">
        <span class="label" title={t('names.peopleHint')}>{t('names.people')}</span>
        <div class="chips">
          <button class:on={!people} onclick={() => set('people', '')}>{t('names.peopleCommon')}</button>
          {#each peoples as p (p)}<button class:on={people === p} onclick={() => set('people', p)}>{raceTitle(p)}</button>{/each}
        </div>
      </div>
    {/if}
    <div class="row">
      <span class="label">{t('names.gender')}</span>
      <div class="seg">
        {#each ['male', 'female'] as const as g (g)}<button class:active={opts.gender === g} onclick={() => set('gender', g)}>{genderTitle(g)}</button>{/each}
      </div>
    </div>
    <div class="row">
      <span class="label">{t('names.form')}</span>
      <div class="seg">
        <button class:active={opts.form === 'name'} onclick={() => set('form', 'name')}>{t('names.formName')}</button>
        <button class:active={opts.form === 'full'} onclick={() => set('form', 'full')}>{t('names.formFull')}</button>
      </div>
    </div>
    <div class="row">
      <span class="label">{t('names.nickname')}</span>
      <div class="seg">
        <button class:active={opts.nickname === 'none'} onclick={() => set('nickname', 'none')}>{t('names.nickNone')}</button>
        <button class:active={opts.nickname === 'simple'} onclick={() => set('nickname', 'simple')}>{t('names.nickSimple')}</button>
        <button class:active={opts.nickname === 'epic'} onclick={() => set('nickname', 'epic')}>{t('names.nickEpic')}</button>
      </div>
    </div>

    <details class="filters" open={filtersOn}>
      <summary>{t('names.filters')}{#if filtersOn}<span class="dot"></span>{/if}</summary>
      <div class="row">
        <span class="label">{t('names.length')}</span>
        <div class="seg">
          {#each LENGTHS as l (l)}<button class:active={opts.length === l} onclick={() => set('length', l)}>{t(`names.length.${l}`)}</button>{/each}
        </div>
      </div>
      <div class="row">
        <span class="label">{t('names.sound')}</span>
        <div class="seg">
          {#each SOUNDS as s (s)}<button class:active={opts.sound === s} onclick={() => set('sound', s)}>{t(`names.sound.${s}`)}</button>{/each}
        </div>
      </div>
      <div class="row">
        <span class="label">{t('names.first')}</span>
        <input class="first" type="text" maxlength="3" placeholder={t('names.firstPh')} value={opts.first} oninput={(e) => set('first', e.currentTarget.value)} />
        {#if filtersOn}<button class="link" onclick={resetFilters}>{t('names.reset')}</button>{/if}
      </div>
    </details>

    <div class="row go">
      <div class="seg">
        {#each [1, 5, 10, 20] as n (n)}<button class:active={opts.count === n} onclick={() => set('count', n)}>{n}</button>{/each}
      </div>
      <button class="btn primary big" disabled={!races.length} title={hint(t('names.generate'), 'generate')} onclick={generate}><Dices size={16} /> {t('names.generate')}</button>
    </div>
  </div>

  <div class="results">
    {#if !races.length}
      <p class="faint">{t('names.noLists')}</p>
    {:else if names.results === null}
      <p class="faint placeholder">{t('names.placeholder')}</p>
    {:else if !names.results.length}
      <p class="faint">{t('names.nothing')}</p>
    {:else}
      {#each names.results as g, i (i)}
        {@const text = nameText(g, quote)}
        <div class="result" class:one={names.results.length === 1}>
          <span class="name">{text}</span>
          <button class="icon-btn" title={copied === text ? t('names.copied') : t('names.copy')} onclick={() => copy(text)}>
            {#if copied === text}<Check size={14} />{:else}<Copy size={14} />{/if}
          </button>
          <button class="icon-btn star" class:on={isFavorite(text)} title={isFavorite(text) ? t('names.unfavorite') : t('names.favorite')} onclick={() => toggleFavorite({ text, race, gender: opts.gender })}>
            <Star size={14} />
          </button>
        </div>
      {/each}
    {/if}
  </div>

  <div class="sources">
    <label><input type="checkbox" checked={opts.builtin} onchange={(e) => set('builtin', e.currentTarget.checked)} /> {t('names.useBuiltin')}</label>
    <label title={t('names.ownHint')}><input type="checkbox" checked={opts.own} onchange={(e) => set('own', e.currentTarget.checked)} /> {t('names.useOwn', { count: ownCount() })}</label>
  </div>

  <div class="lists">
    {#each [{ kind: 'favorites' as const, list: names.favorites }, { kind: 'history' as const, list: names.history }] as box (box.kind)}
      <section>
        <header>
          <h3>{box.kind === 'favorites' ? t('names.favorites') : t('names.history')} <span class="faint">{box.list.length || ''}</span></h3>
          <div class="spacer"></div>
          <button class="btn small" disabled={!box.list.length} onclick={() => exportList(box.list, box.kind, false)}>TXT</button>
          <button class="btn small" disabled={!box.list.length} onclick={() => exportList(box.list, box.kind, true)}>CSV</button>
          <button
            class="icon-btn"
            disabled={!box.list.length}
            title={t('names.clear')}
            onclick={() => confirm(t(box.kind === 'favorites' ? 'names.clearFavorites' : 'names.clearHistory')) && (box.kind === 'favorites' ? clearFavorites() : clearHistory())}
          ><Trash2 size={13} /></button>
        </header>
        {#if box.list.length}
          <ul>
            {#each box.list as n, i (i)}
              <li>
                <span class="name">{n.text}</span>
                <span class="faint meta">{raceTitle(n.race)}, {genderTitle(n.gender).toLowerCase()}</span>
                <button class="icon-btn" title={t('names.copy')} onclick={() => copy(n.text)}><Copy size={12} /></button>
                <button class="icon-btn star" class:on={isFavorite(n.text)} title={isFavorite(n.text) ? t('names.unfavorite') : t('names.favorite')} onclick={() => toggleFavorite(n)}><Star size={12} /></button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="faint empty">{box.kind === 'favorites' ? t('names.noFavorites') : t('names.noHistory')}</p>
        {/if}
      </section>
    {/each}
  </div>
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
  .status {
    margin: 0 0 10px;
    color: var(--accent);
  }
  .panel {
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 6px 0;
  }
  .label {
    width: 110px;
    flex: none;
    color: var(--text-muted);
    font-size: 13px;
  }
  .chips {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
  }
  .chips button {
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .chips button.on {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }
  .seg {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .seg button {
    padding: 4px 10px;
    border: 0;
    border-radius: 3px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .seg button.active {
    background: var(--accent);
    color: var(--on-accent);
  }
  .filters {
    margin: 8px 0 4px;
  }
  .filters summary {
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
  }
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-left: 6px;
    border-radius: 50%;
    background: var(--accent);
    vertical-align: middle;
  }
  .first {
    width: 70px;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
  .go {
    margin-top: 12px;
  }
  .big {
    padding: 6px 18px;
    font-size: 15px;
  }
  .results {
    margin: 14px 0;
  }
  .placeholder {
    font-style: italic;
  }
  .result {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
  }
  .result .name {
    flex: 1;
    font-size: 17px;
  }
  .result.one .name {
    font-size: 24px;
  }
  .star.on {
    color: var(--warning);
  }
  .star.on :global(svg) {
    fill: currentColor;
  }
  .sources {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    color: var(--text-muted);
    font-size: 13px;
  }
  .lists {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }
  .lists header {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lists h3 {
    margin: 0;
    font-size: 14px;
  }
  .small {
    padding: 2px 8px;
    font-size: 12px;
  }
  ul {
    max-height: 320px;
    margin: 6px 0 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 0;
  }
  li .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  li .meta {
    flex: 1;
    font-size: 12px;
    white-space: nowrap;
  }
  .empty {
    margin: 6px 0 0;
    font-size: 13px;
  }
</style>
