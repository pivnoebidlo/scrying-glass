<!-- Жетоны карты: добавить участников текущего боя, размер, спрятать от игроков, убрать. Жетоны из боя берут
     имя, портрет, сторону и ранения из инициативы. -->
<script lang="ts">
  import { Eye, EyeOff, Swords, Trash2, X } from '@lucide/svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { assetUrl } from '../../../shared/vault';
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
  }: { path: string; tokens: TokenView[]; data: MapData; fight: Combatant[]; onaddfight: () => void } = $props();

  // Размеры D&D: крошечный и маленький занимают клетку так же, как средний.
  const SIZES = [
    { v: 1, t: '1 клетка — средний' },
    { v: 2, t: '2×2 — большой' },
    { v: 3, t: '3×3 — огромный' },
    { v: 4, t: '4×4 — громадный' },
  ];

  const missing = $derived(fight.filter((c) => !data.tokens.some((t) => t.combatant === c.id)).length);
  const update = (id: string, changes: Record<string, unknown>) => dispatch('maps', 'updateToken', { path, id, changes });

  function clear() {
    if (confirm('Убрать все жетоны с этой карты?')) {
      ui.token = null;
      dispatch('maps', 'removeToken', { path });
    }
  }
</script>

<div class="panel" role="presentation" onpointerdown={(e) => e.stopPropagation()}>
  <header>
    <div class="head">Жетоны</div>
    {#if tokens.length}<button class="icon-btn" title="Убрать все жетоны" onclick={clear}><Trash2 size={14} /></button>{/if}
    <button class="icon-btn" title="Закрыть" onclick={() => (ui.tokenList = false)}><X size={15} /></button>
  </header>

  <button class="btn" disabled={!missing} title="Участники текущего боя, которых ещё нет на этой карте" onclick={onaddfight}>
    <Swords size={14} /> Из боя{missing ? ` (${missing})` : ''}
  </button>

  {#if tokens.length}
    <ul>
      {#each tokens as t (t.id)}
        <li class:sel={ui.token === t.id} class:down={t.down}>
          <button class="item" onclick={() => (ui.token = ui.token === t.id ? null : t.id)}>
            <span class="av" style:--ring={RING[t.side]}>
              {#if t.portrait}<img src={assetUrl(t.portrait)} alt="" />{:else}{t.name.slice(0, 1).toUpperCase()}{/if}
            </span>
            <span class="name" class:faint={t.hidden}>{t.name}</span>
          </button>
          <select value={t.size} title="Размер" onchange={(e) => update(t.id, { size: Number(e.currentTarget.value) })}>
            {#each SIZES as s (s.v)}<option value={s.v} title={s.t}>{s.v}×{s.v}</option>{/each}
          </select>
          <button
            class="icon-btn"
            title={t.hidden ? 'Спрятан от игроков — показать' : 'Спрятать от игроков'}
            onclick={() => update(t.id, { hidden: !data.tokens.find((x) => x.id === t.id)?.hidden })}
          >
            {#if t.hidden}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
          </button>
          <button class="icon-btn" title="Убрать с карты" onclick={() => dispatch('maps', 'removeToken', { path, id: t.id })}><X size={14} /></button>
        </li>
      {/each}
    </ul>
    <p class="faint hint">Двигайте жетоны инструментом жетонов или рукой. Под туманом игроки их не видят.</p>
  {:else}
    <p class="faint hint">Жетонов нет. «Из боя» поставит на карту участников текущего боя из «Инициативы».</p>
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
  ul {
    max-height: 55vh;
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
