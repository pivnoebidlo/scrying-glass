<!-- A character's QR code, big enough to scan across the table. ← → — the next character. -->
<script lang="ts">
  import { ChevronLeft, ChevronRight, Copy, Monitor, RefreshCw, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { refKey } from '../../../shared/cards';
  import Qr from './Qr.svelte';
  import { players } from './players.svelte';

  const party = $derived(players.status.party);
  const at = $derived(party.findIndex((r) => refKey(r.ref) === players.qr));
  const row = $derived(party[at]);
  const url = $derived(row ? players.urlOf(row) : '');
  let copied = $state(false);

  const close = () => (players.qr = null);
  function step(by: number) {
    const next = party[(at + by + party.length) % party.length];
    if (next) players.qr = refKey(next.ref);
    copied = false;
  }
  async function copy() {
    await navigator.clipboard.writeText(url);
    copied = true;
  }
  function renew() {
    if (row && confirm(t('pl.renewQ', { name: row.name }))) void players.renew(row.ref);
  }
  // The whole party on the players' screen: this window is not needed then.
  function toScreen() {
    const on = !players.codes;
    void players.showCodes(on);
    if (on) close();
  }
  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  }

  // The character has gone from the party while the window is open.
  $effect(() => {
    if (at < 0) close();
  });
</script>

<svelte:window {onkeydown} />

{#if row}
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && close()}>
    <div class="modal" role="dialog" aria-label={row.name}>
      <div class="head">
        <button class="icon" disabled={party.length < 2} title={t('pl.prev')} onclick={() => step(-1)}><ChevronLeft size={20} /></button>
        <h2>{row.name}</h2>
        <button class="icon" disabled={party.length < 2} title={t('pl.next')} onclick={() => step(1)}><ChevronRight size={20} /></button>
      </div>
      {#if url && players.status.addresses.length}
        <div class="code"><Qr text={url} /></div>
        <p class="faint">{row.clients ? t('pl.connected', { count: row.clients }) : t('pl.scan')}</p>
        <code>{url}</code>
      {:else}
        <p class="warning">{t('pl.noNetwork')}</p>
      {/if}
      {#if players.status.addresses.length > 1}
        <label class="net">
          {t('pl.address')}
          <select value={players.host} onchange={(e) => (players.address = e.currentTarget.value)}>
            {#each players.status.addresses as a (a)}<option value={a}>{a}</option>{/each}
          </select>
        </label>
      {/if}
      <div class="actions">
        <button class="btn" onclick={copy}><Copy size={14} /> {copied ? t('pl.copied') : t('pl.copy')}</button>
        <button class="btn" onclick={toScreen}><Monitor size={14} /> {players.codes ? t('pl.codesOff') : t('pl.codesOn')}</button>
        <button class="btn" onclick={renew}><RefreshCw size={14} /> {t('pl.renew')}</button>
        <button class="btn" onclick={close}><X size={14} /> {t('pl.close')}</button>
      </div>
    </div>
  </div>
{/if}

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
    align-items: center;
    gap: 10px;
    width: min(440px, 92vw);
    max-height: 92vh;
    overflow: auto;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
  }
  h2 {
    margin: 0;
    font-size: 18px;
    text-align: center;
  }
  .icon {
    display: grid;
    place-items: center;
    padding: 4px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .icon:hover:not(:disabled) {
    background: var(--bg-hover);
  }
  .icon:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .code {
    width: min(320px, 70vh);
    max-width: 100%;
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  p {
    margin: 0;
  }
  .faint {
    color: var(--text-muted);
  }
  .warning {
    color: var(--warning);
  }
  code {
    max-width: 100%;
    font-size: 11px;
    color: var(--text-faint);
    overflow-wrap: anywhere;
    text-align: center;
    user-select: text;
  }
  .net {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  .actions .btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
</style>
