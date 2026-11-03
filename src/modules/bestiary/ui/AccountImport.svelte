<!-- The window «Characters from <service>» (an importer with the GM's account: LSS): the GM's own characters with
     checkboxes and a link to a player's character; they go into the party folder of the current adventure the way of
     export files — a character that has a card there already goes through «What changed». -->
<script lang="ts">
  import { hint } from '../../../shared/hotkeys';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Link, LogIn, RefreshCw, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { PLUGINS } from '../../../systems/plugins';
  import type { AccountCharacter } from '../../../systems/importer';
  import { bestiary, ipcError } from './cards.svelte';

  let { importer }: { importer: string } = $props();

  const imp = $derived(PLUGINS.flatMap((p) => p.importers ?? []).find((i) => i.id === importer));
  const title = $derived(imp?.title ?? importer);
  const place = bestiary.partyPlace();

  let signedIn = $state<boolean | null>(null);
  let rows = $state<AccountCharacter[]>([]);
  let error = $state('');
  let loading = $state(false);
  let busy = $state(false);
  let picked = $state<Record<string, boolean>>({});
  let link = $state('');
  let result = $state('');

  async function load() {
    loading = true;
    error = '';
    signedIn = (await window.api.importerAccount(importer))?.signedIn ?? false;
    if (signedIn) {
      const r = await window.api.accountCharacters(importer);
      rows = r.rows;
      error = r.error ?? '';
    }
    loading = false;
  }
  onMount(load);

  async function signIn() {
    await window.api.signInImporter(importer);
    await load();
  }

  const chosen = $derived(rows.filter((r) => picked[r.id]).map((r) => r.id));

  async function run(links: string[], fresh: boolean) {
    busy = true;
    result = '';
    result = await bestiary.importFromAccount(importer, links, place, fresh);
    busy = false;
    picked = {};
    await load();
  }

  const close = () => (bestiary.accountImport = null);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && !bestiary.importRequest && close()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={t('best.acc.title', { source: title })}>
    <header>
      <h3>{t('best.acc.title', { source: title })}</h3>
      {#if signedIn}
        <button class="icon-btn" title={t('best.acc.reload')} disabled={loading || busy} onclick={load}><RefreshCw size={15} /></button>
      {/if}
      <button class="icon-btn" title={hint(t('lib.cancel'), 'close')} onclick={close}><X size={16} /></button>
    </header>

    <div class="body">
      {#if signedIn === false}
        <p class="faint">{t('best.acc.signedOut', { source: title })}</p>
        <button class="btn" onclick={signIn}><LogIn size={14} /> {t('best.acc.signIn', { source: title })}</button>
      {:else if signedIn}
        <div class="link">
          <input type="text" bind:value={link} placeholder={imp?.account?.characters?.example ?? ''} disabled={busy}
            onkeydown={(e) => e.key === 'Enter' && link.trim() && run([link.trim()], true)} />
          <button class="btn" disabled={!link.trim() || busy} onclick={() => run([link.trim()], true)}><Link size={14} /> {t('best.acc.byLink')}</button>
        </div>
        <p class="faint small">{t('best.acc.linkHint')}</p>

        <div class="section">{t('best.acc.mine')}</div>
        {#if loading && !rows.length}
          <p class="faint">{t('best.acc.loading')}</p>
        {:else if error}
          <p class="warn">{error}</p>
        {:else}
          <div class="list">
            {#each rows as r (r.id)}
              <label class="row">
                <input type="checkbox" bind:checked={picked[r.id]} disabled={busy} />
                <span class="name">{r.name}</span>
                <span class="faint">{r.subtitle}</span>
                {#if r.card}<span class="badge">{t('best.acc.hasCard')}</span>{/if}
              </label>
            {:else}
              <p class="faint">{t('best.acc.none')}</p>
            {/each}
          </div>
        {/if}
      {/if}
      {#if result}<p class="result">{result}</p>{/if}
    </div>

    {#if signedIn}
      <footer>
        <span class="faint where" title={place.folder}>{t('best.acc.into', { folder: place.folder ?? '' })}</span>
        <button class="btn primary" disabled={!chosen.length || busy} onclick={() => run(chosen, false)}>
          {busy ? t('best.acc.importing') : chosen.length ? t('best.acc.import', { count: chosen.length }) : t('best.acc.pick')}
        </button>
      </footer>
    {/if}
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
    max-height: calc(100vh - 80px);
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 12px 12px 8px 16px;
  }
  h3 {
    flex: 1;
    margin: 0;
    font-size: 15px;
  }
  .body {
    padding: 0 16px 12px;
    overflow: auto;
  }
  .link {
    display: flex;
    gap: 6px;
  }
  .link input {
    flex: 1;
    min-width: 0;
  }
  .small {
    margin: 4px 0 0;
    font-size: 12px;
  }
  .section {
    margin: 14px 0 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .list {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 4px;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .row:hover {
    background: var(--bg-hover);
  }
  .name {
    font-weight: 500;
  }
  .badge {
    margin-left: auto;
    padding: 1px 6px;
    border-radius: 8px;
    font-size: 11px;
    background: var(--bg-secondary);
    color: var(--text-muted);
  }
  .warn {
    color: var(--warning);
  }
  .result {
    margin: 12px 0 0;
    white-space: pre-line;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px 14px;
    border-top: 1px solid var(--border);
  }
  .where {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }
</style>
