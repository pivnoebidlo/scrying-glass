<!-- Стартовый экран, когда хранилище не открыто: выбрать папку или открыть недавнюю. -->
<script lang="ts">
  import { FolderOpen, X } from '@lucide/svelte';
  import { dispatch, store } from '../lib/store.svelte';
  import { t } from '../lib/i18n.svelte';

  const recent = $derived(store.state.vault.recent);
  const name = (p: string) => p.split(/[\\/]/).filter(Boolean).pop() ?? p;
</script>

<div class="welcome">
  <div class="card">
    <div class="logo">🔮</div>
    <h1>Scrying Glass</h1>
    <p class="muted">{t('welcome.text')}</p>
    <button class="btn primary big" onclick={() => dispatch('vault', 'choose')}>
      <FolderOpen size={16} /> {t('welcome.open')}
    </button>

    {#if recent.length}
      <div class="pane-title">{t('welcome.recent')}</div>
      <ul>
        {#each recent as r (r)}
          <li>
            <button class="recent" title={r} onclick={() => dispatch('vault', 'open', { root: r })}>
              <span class="name">{name(r)}</span>
              <span class="path faint">{r}</span>
            </button>
            <button class="icon-btn" title={t('welcome.forget')} onclick={() => dispatch('vault', 'forget', { root: r })}>
              <X size={14} />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .welcome {
    display: grid;
    place-items: center;
    height: 100vh;
    padding: 24px;
  }
  .card {
    width: min(520px, 100%);
    text-align: center;
  }
  .logo {
    font-size: 48px;
  }
  h1 {
    margin: 8px 0 12px;
    font-size: 24px;
    font-weight: 600;
  }
  p {
    margin: 0 0 20px;
    line-height: 1.5;
  }
  .big {
    padding: 8px 18px;
    font-size: 14px;
  }
  .pane-title {
    margin-top: 28px;
    text-align: left;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    text-align: left;
  }
  li {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .recent {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 10px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .recent:hover {
    background: var(--bg-hover);
  }
  .path {
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
