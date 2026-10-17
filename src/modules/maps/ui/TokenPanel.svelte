<!-- Жетоны карты: добавить участников текущего боя, размер, спрятать от игроков, убрать. Жетоны из боя берут
     имя, портрет, сторону и ранения из инициативы. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Eye, EyeOff, Shield, Swords, Trash2, X } from '@lucide/svelte';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import type { CardSummary } from '../../../shared/cards';
  import CardSearch from './CardSearch.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { assetUrl, thumb } from '../../../shared/vault';
  import type { Combatant } from '../../initiative/types';
  import { RING, type TokenView } from '../tokens';
  import type { MapData } from '../types';
  import { ui } from './ui.svelte';

  let {
    path,
    tokens,
    data,
    fight,
    onaddfight,
    onaddcard,
    onaddparty,
  }: {
    path: string;
    tokens: TokenView[];
    data: MapData;
    fight: Combatant[];
    onaddfight: () => void | Promise<void>;
    onaddcard: (c: CardSummary) => void;
    onaddparty: () => Promise<number | undefined>;
  } = $props();

  const shownScale = $derived(ui.tokenScale ?? data.tokenScale ?? 1);
  let status = $state('');
  async function party() {
    const n = await onaddparty();
    status = n ? '' : t('maps.allParty');
    if (status) setTimeout(() => (status = ''), 3000);
  }

  // Размеры D&D: крошечный и маленький занимают клетку так же, как средний.
  const SIZES = [
    { v: 1 },
    { v: 2 },
    { v: 3 },
    { v: 4 },
  ];

  const missing = $derived(fight.filter((c) => !data.tokens.some((t) => t.combatant === c.id)).length);
  const update = (id: string, changes: Record<string, unknown>) => dispatch('maps', 'updateToken', { path, id, changes });

  function clear() {
    if (confirm(t('maps.clearTokensConfirm'))) {
      ui.token = null;
      dispatch('maps', 'removeToken', { path });
    }
  }
</script>

<div class="panel" role="presentation" onpointerdown={(e) => e.stopPropagation()}>
  <header>
    <div class="head">{t('maps.tokens')}</div>
    {#if tokens.length}<button class="icon-btn" title={t('maps.clearTokens')} onclick={clear}><Trash2 size={14} /></button>{/if}
    <button class="icon-btn" title={t('maps.close')} onclick={() => (ui.tokenList = false)}><X size={15} /></button>
  </header>

  <div class="row">
    <button class="btn" disabled={!missing} title={t('maps.fromFightHint')} onclick={onaddfight}>
      <Swords size={14} /> {t('maps.fromFight')}{missing ? ` (${missing})` : ''}
    </button>
    <button class="btn" title={t('maps.partyHint')} onclick={party}><Shield size={14} /> {t('maps.party')}</button>
  </div>
  <CardSearch placeholder={t('maps.addByCard')} onpick={onaddcard} />
  {#if status}<p class="faint hint">{status}</p>{/if}

  <div class="scale" title={t('maps.scaleHint')}>
    <span class="faint">{t('maps.size')}</span>
    <div class="slider">
      <Slider value={shownScale} min={0.25} max={4} step={0.05} oninput={(v) => (ui.tokenScale = v)} onchange={(v) => dispatch('maps', 'setTokenScale', { path, value: v }).then(() => (ui.tokenScale = null))} />
    </div>
    <span class="faint pct">{Math.round(shownScale * 100)}%</span>
  </div>

  {#if tokens.length}
    <ul>
      {#each tokens as tok (tok.id)}
        <li class:sel={ui.token === tok.id} class:down={tok.down}>
          <button class="item" onclick={() => (ui.token = ui.token === tok.id ? null : tok.id)}>
            <span class="av" style:--ring={RING[tok.side]}>
              {#if tok.portrait}<img src={thumb(assetUrl(tok.portrait), 32)} alt="" />{:else}{tok.name.slice(0, 1).toUpperCase()}{/if}
            </span>
            <span class="name" class:faint={tok.hidden}>{tok.name}</span>
          </button>
          <select value={tok.size} title={t('maps.size')} onchange={(e) => update(tok.id, { size: Number(e.currentTarget.value) })}>
            {#each SIZES as s (s.v)}<option value={s.v} title={t(`maps.size.${s.v as 1 | 2 | 3 | 4}`)}>{s.v}×{s.v}</option>{/each}
          </select>
          <button
            class="icon-btn"
            title={tok.hidden ? t('maps.tokenHidden') : t('maps.tokenHide')}
            onclick={() => update(tok.id, { hidden: !data.tokens.find((x) => x.id === tok.id)?.hidden })}
          >
            {#if tok.hidden}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
          </button>
          <button class="icon-btn" title={t('maps.removeFromMap')} onclick={() => dispatch('maps', 'removeToken', { path, id: tok.id })}><X size={14} /></button>
        </li>
      {/each}
    </ul>
    <p class="faint hint">{t('maps.tokensHelp')}</p>
  {:else}
    <p class="faint hint">{t('maps.noTokens')}</p>
  {/if}
</div>

<style>
  .panel {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 290px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-primary);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  }
  header {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .head {
    flex: 1;
    font-weight: 600;
  }
  .row {
    display: flex;
    gap: 6px;
  }
  .row .btn {
    flex: 1;
    justify-content: center;
  }
  .scale {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .slider {
    flex: 1;
  }
  .pct {
    width: 36px;
    text-align: right;
  }
  ul {
    max-height: 45vh;
    overflow: auto;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: var(--radius-s);
  }
  li.sel {
    background: var(--accent-soft);
  }
  li.down {
    opacity: 0.55;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 4px 6px;
    border: 0;
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .av {
    display: grid;
    place-items: center;
    flex: none;
    width: 24px;
    height: 24px;
    overflow: hidden;
    border: 2px solid var(--ring);
    border-radius: 50%;
    background: #333;
    font-size: 11px;
    font-weight: 600;
  }
  .av img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  select {
    padding: 1px 2px;
    font-size: 12px;
  }
  .hint {
    margin: 0;
    font-size: 12px;
  }
</style>
