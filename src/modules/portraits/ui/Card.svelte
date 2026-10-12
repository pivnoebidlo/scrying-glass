<!-- Карточка картинки: клик выводит её на экран портретом или убирает. -->
<script lang="ts">
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import { vaultUrl } from '../../../shared/vault';
  import { caption } from '../library';

  let { path }: { path: string } = $props();

  const ms = $derived(store.state.portraits);
  const on = $derived(ms.onScreen.includes(path));
  const name = $derived(caption(ms, path));
</script>

<div class="card" class:on>
  <button class="thumb" title={on ? 'Убрать с экрана' : 'Показать на экране'} onclick={() => dispatch('portraits', 'toggle', { path })}>
    <img src={vaultUrl(path)} alt={name} loading="lazy" />
  </button>
  {#if on}<div class="badge">на экране</div>{/if}
  <input
    type="text"
    placeholder="Подпись"
    title="Подпись на экране игроков"
    value={name}
    onchange={(e) => dispatch('portraits', 'rename', { path, name: e.currentTarget.value })}
  />
</div>

<style>
  .card {
    position: relative;
    border: 2px solid transparent;
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    overflow: hidden;
  }
  .card.on {
    border-color: var(--accent);
  }
  .thumb {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  img {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }
  .badge {
    position: absolute;
    left: 6px;
    top: 6px;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
  }
  input {
    width: 100%;
    border: 0;
    border-top: 1px solid var(--border);
    border-radius: 0;
    background: transparent;
    padding: 6px 8px;
    font-size: 12px;
  }
</style>
