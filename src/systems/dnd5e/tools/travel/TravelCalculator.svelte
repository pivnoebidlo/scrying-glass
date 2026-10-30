<!-- Travel (Tools → Travel, D&D only): distance, how (on foot or a vessel), pace, terrain, road, hours a day →
     time on the way, the pace kept and its effect, the long-day saves and the terrain's DCs. The rules follow the
     edition of the adventure's system (2014 or 2024). The inputs are remembered by the window. -->
<script lang="ts">
  import Lead from '../../../../renderer/lib/Lead.svelte';
  import { locale, t } from '../../../../renderer/lib/i18n.svelte';
  import { store } from '../../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../../shared/adventures';
  import { PACE_RATE, PACES, TERRAIN_TABLE, TERRAINS, travel, VESSEL_MPH, VESSELS, type Edition, type TravelInput } from './rules';

  const KEY = 'travel.state';
  type Saved = Omit<TravelInput, 'edition'>;
  const DEFAULTS: Saved = { distance: 60, by: 'land', pace: 'normal', terrain: 'grassland', road: true, difficult: false, hours: 8 };
  function load(): Saved {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  }
  const tv = $state(load());
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(tv)));
    } catch {
      /* not remembered — not a problem */
    }
  };

  const edition = $derived<Edition>(currentSystem(store.state.adventures) === 'dnd5e-2014' ? '2014' : '2024');
  const r = $derived(travel({ ...tv, edition }));
  const land = $derived(tv.by === 'land');
  const row = $derived(TERRAIN_TABLE[tv.terrain]);
  const num = (n: number) => (Math.round(n * 10) / 10).toLocaleString(locale.lang);
  const miles = (n: number) => t('travel.miles', { count: Math.round(n * 10) / 10, n: num(n) });
  const timeText = $derived(
    [r.days ? t('travel.days', { count: r.days }) : '', r.hours ? t('travel.hoursN', { count: r.hours }) : ''].filter(Boolean).join(' ') || '—'
  );
</script>

<div class="view">
  <header class="head">
    <h2>{t('travel.title')}</h2>
    <span class="faint ed">{t('travel.edition', { edition: edition === '2014' ? '5.1' : '5.2' })}</span>
  </header>
  <p class="faint about"><Lead text={t('travel.about')} /></p>

  <div class="options">
    <label>{t('travel.distance')}
      <input type="number" min="0" step="1" bind:value={tv.distance} oninput={save} />
    </label>
    <label>{t('travel.by')}
      <select bind:value={tv.by} onchange={save}>
        <option value="land">{t('travel.land')}</option>
        {#each VESSELS as id (id)}<option value={id}>{t(`travel.vessel.${id}` as never)} ({VESSEL_MPH[id]} mph)</option>{/each}
      </select>
    </label>
    {#if land}
      <label>{t('travel.pace')}
        <select bind:value={tv.pace} onchange={save}>
          {#each PACES as id (id)}<option value={id}>{t(`travel.pace.${id}` as never)} ({PACE_RATE[id].day})</option>{/each}
        </select>
      </label>
      {#if edition === '2024'}
        <label>{t('travel.terrain')}
          <select bind:value={tv.terrain} onchange={save}>
            {#each TERRAINS as id (id)}<option value={id}>{t(`travel.terrain.${id}` as never)}</option>{/each}
          </select>
        </label>
      {/if}
    {/if}
    <label>{t('travel.hours')}
      <input type="number" min="1" max="24" step="1" bind:value={tv.hours} oninput={save} />
    </label>
  </div>
  {#if land}
    <div class="checks">
      {#if edition === '2024'}
        <label class="check"><input type="checkbox" bind:checked={tv.road} onchange={save} /> {t('travel.road')}</label>
      {:else}
        <label class="check"><input type="checkbox" bind:checked={tv.difficult} onchange={save} /> {t('travel.difficult')}</label>
      {/if}
    </div>
  {/if}

  <section class="result">
    <div class="big">{timeText}</div>
    <div class="faint">{t('travel.speed', { hour: miles(r.perHour), day: miles(r.perDay) })}{r.pace ? ` · ${t(`travel.pace.${r.pace}` as never)}` : ''}</div>
    {#if r.capped && r.pace}
      <p class="warn">{t('travel.capped', { pace: t(`travel.pace.${r.pace}` as never).toLowerCase(), road: tv.road ? t('travel.cappedRoad') : '' })}</p>
    {/if}
  </section>

  <div class="cards">
    {#if r.pace}
      <section class="card">
        <h3>{t('travel.effect')}</h3>
        <p>{t(`travel.effect${edition}.${r.pace}` as never)}</p>
        <p class="faint">{t('travel.mounts')}</p>
      </section>
    {:else}
      <section class="card">
        <h3>{t(`travel.vessel.${tv.by}` as never)}</h3>
        <p class="faint"><Lead text={t('travel.vesselNote')} /></p>
      </section>
    {/if}
    {#if r.saves.length}
      <section class="card">
        <h3>{t('travel.march')}</h3>
        <p>{t('travel.marchText')}</p>
        <p>{r.saves.map((dc, k) => t('travel.hourSave', { n: 9 + k, dc })).join('; ')}</p>
      </section>
    {/if}
    {#if land && edition === '2024'}
      <section class="card">
        <h3>{t('travel.terrainTable')}: {t(`travel.terrain.${tv.terrain}` as never)}</h3>
        <dl>
          <dt>{t('travel.encounter')}</dt><dd>{t('travel.feet', { dice: row.encounter })}</dd>
          <dt>{t('travel.foraging')}</dt><dd>{row.foraging}</dd>
          <dt>{t('travel.navigation')}</dt><dd>{row.navigation}</dd>
          <dt>{t('travel.search')}</dt><dd>{row.search}</dd>
        </dl>
        {#if tv.terrain === 'arctic'}<p class="faint">{t('travel.arcticNote')}</p>{/if}
      </section>
    {/if}
  </div>
</div>

<style>
  .view {
    max-width: 920px;
    padding: 16px 20px 32px;
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .head h2 {
    margin: 0;
    font-size: 18px;
  }
  .ed {
    font-size: 12px;
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
  .options input[type='number'] {
    width: 110px;
  }
  .checks {
    margin-top: 10px;
  }
  .check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .result {
    margin: 16px 0 12px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .big {
    font-size: 24px;
    font-weight: 600;
  }
  .warn {
    margin: 6px 0 0;
    color: var(--warning);
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 10px;
  }
  .card {
    padding: 8px 12px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  h3 {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .card p {
    margin: 6px 0 0;
    line-height: 1.5;
  }
  dl {
    display: grid;
    grid-template-columns: auto auto;
    gap: 2px 12px;
    margin: 6px 0 0;
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    margin: 0;
    text-align: right;
  }
</style>
