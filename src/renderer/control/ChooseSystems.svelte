<!-- The very first launch (Welcome, before a vault): which systems the GM plays. The systems of the plugins (D&D 5e) are
     in the app; the systems of the app's own author in the official repository (Fate Core, Mausritter, Forged in the
     Dark, the samples) are downloaded when ticked. The built-in ones left unticked are turned off. Everything can be changed
     later in Settings → Game systems. -->
<script lang="ts">
  import { Check, Loader } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { dispatch } from '../lib/store.svelte';
  import { t } from '../lib/i18n.svelte';
  import { OFFICIAL_AUTHOR, OFFICIAL_SOURCE, type RepoEntry } from '../../shared/repo';
  import { PLUGINS } from '../../systems/plugins';

  const BUILT_IN = PLUGINS.flatMap((p) => p.systems);
  const builtIn = $state<Record<string, boolean>>(Object.fromEntries(BUILT_IN.map((s) => [s.id, true])));

  let packs = $state.raw<RepoEntry[]>([]);
  let picked = $state<Record<string, boolean>>({});
  let loading = $state(true);
  let offline = $state(false);
  let busy = $state('');
  let failed = $state<string[]>([]);

  onMount(async () => {
    try {
      const catalog = await window.api.repoCatalog(OFFICIAL_SOURCE);
      // One line per system: the newest version of the app's own author.
      const own = catalog.entries.filter((e) => e.kind === 'system' && e.author === OFFICIAL_AUTHOR);
      const latest = new Map<string, RepoEntry>();
      for (const e of own) if ((latest.get(e.system)?.updated ?? -1) < e.updated) latest.set(e.system, e);
      packs = [...latest.values()].sort((a, b) => a.title.localeCompare(b.title));
    } catch {
      offline = true;
    }
    loading = false;
  });

  const anything = $derived(BUILT_IN.some((d) => builtIn[d.id]) || packs.some((p) => picked[p.system]));
  const firstLine = (text: string) => text.split('\n').find((l) => l.trim())?.replace(/[*_#>]/g, '').trim() ?? '';

  async function done() {
    failed = [];
    for (const p of packs.filter((x) => picked[x.system])) {
      busy = p.title;
      try {
        if (!(await window.api.repoInstallSystem(OFFICIAL_SOURCE, $state.snapshot(p)))) failed.push(p.title);
      } catch {
        failed.push(p.title);
      }
    }
    busy = '';
    await dispatch('vault', 'setSystemsOff', { list: BUILT_IN.filter((d) => !builtIn[d.id]).map((d) => d.id) });
    if (!failed.length) await dispatch('vault', 'systemsChosen');
  }
  const skip = () => dispatch('vault', 'systemsChosen');
</script>

<div class="choose">
  <h2>{t('welcome.systemsTitle')}</h2>
  <p class="muted">{t('welcome.systemsText')}</p>

  <ul>
    {#each BUILT_IN as d (d.id)}
      <li><label><input type="checkbox" bind:checked={builtIn[d.id]} /> <b>{d.title}</b> <span class="faint">{t('welcome.builtIn')}</span></label></li>
    {/each}
    {#each packs as p (p.system)}
      <li>
        <label>
          <input type="checkbox" bind:checked={picked[p.system]} />
          <span><b>{p.title}</b>{#if firstLine(p.description)}<span class="faint desc" title={firstLine(p.description)}>{firstLine(p.description)}</span>{/if}</span>
        </label>
      </li>
    {/each}
  </ul>
  {#if loading}<p class="faint"><Loader size={13} /> {t('welcome.systemsLoading')}</p>{/if}
  {#if offline}<p class="faint">{t('welcome.systemsOffline')}</p>{/if}
  {#if failed.length}<p class="warn">{t('welcome.systemsFailed', { names: failed.join(', ') })}</p>{/if}

  <div class="row">
    <button class="btn" onclick={skip} disabled={!!busy}>{t('welcome.systemsSkip')}</button>
    <button class="btn primary" onclick={done} disabled={!anything || !!busy}>
      {#if busy}<Loader size={14} /> {t('welcome.systemsInstalling', { name: busy })}{:else}<Check size={14} /> {t('welcome.systemsDone')}{/if}
    </button>
  </div>
  <p class="faint small">{t('welcome.systemsLater')}</p>
</div>

<style>
  .choose {
    text-align: left;
  }
  h2 {
    margin: 0 0 6px;
    font-size: 18px;
    text-align: center;
  }
  p {
    margin: 0 0 12px;
    line-height: 1.5;
  }
  ul {
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
  li label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  li label:hover {
    background: var(--bg-hover);
  }
  li input {
    margin-top: 3px;
  }
  .desc {
    display: -webkit-box;
    overflow: hidden;
    font-size: 12px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 10px;
  }
  .warn {
    color: var(--warning);
  }
  .small {
    font-size: 12px;
  }
</style>
