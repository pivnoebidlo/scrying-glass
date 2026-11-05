<!-- Right panel: the switch of the sheets on phones and the party with a QR code each. -->
<script lang="ts">
  import { Copy, QrCode, RefreshCw } from '@lucide/svelte';
  import ContextMenu from '../../../renderer/lib/ContextMenu.svelte';
  import HelpTip from '../../../renderer/lib/HelpTip.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import type { PlayerRow } from '../../../shared/players';
  import { players } from './players.svelte';

  let {}: ModuleProps<'players'> = $props();

  const s = $derived(players.status);
  let menu = $state<{ x: number; y: number; row: PlayerRow } | null>(null);
  const openMenu = (e: MouseEvent, row: PlayerRow) => {
    e.preventDefault();
    menu = { x: e.clientX, y: e.clientY, row };
  };
  const renew = (row: PlayerRow) => {
    if (confirm(t('pl.renewQ', { name: row.name }))) void players.renew(row.ref);
  };
</script>

<label class="switch">
  <input type="checkbox" checked={s.on} onchange={(e) => void players.toggle(e.currentTarget.checked)} />
  {t('pl.serve')}
  <HelpTip text={t('pl.serveHint')} />
</label>
{#if s.error}<p class="warning">{t('pl.failed', { error: s.error })}</p>{/if}
{#if s.on && !s.addresses.length}<p class="warning">{t('pl.noNetwork')}</p>{/if}
<ul>
  {#each s.party as row (row.token)}
    <li>
      <button class="row" title={t('pl.showQr')} onclick={() => void players.show(row)} oncontextmenu={(e) => openMenu(e, row)}>
        <QrCode size={14} />
        <span class="name">{row.name}</span>
        {#if row.clients}<span class="dot" title={t('pl.connected', { count: row.clients })}></span>{/if}
      </button>
    </li>
  {/each}
</ul>

{#if menu}
  {@const row = menu.row}
  <ContextMenu
    x={menu.x}
    y={menu.y}
    onclose={() => (menu = null)}
    items={[
      { label: t('pl.showQr'), icon: QrCode, action: () => void players.show(row) },
      { label: t('pl.copy'), icon: Copy, action: () => void navigator.clipboard.writeText(players.urlOf(row)) },
      { label: t('pl.renew'), icon: RefreshCw, action: () => renew(row) },
    ]}
  />
{/if}

<style>
  .switch {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .warning {
    margin: 6px 0 0;
    color: var(--warning);
  }
  ul {
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 6px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .row:hover {
    background: var(--bg-hover);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
  }
</style>
