<!-- Карточка портрета: клик по картинке выводит на экран или убирает. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { assetUrl, dispatch } from '../../../renderer/lib/store.svelte';
  import { isFromFolder, type Portrait } from '../types';

  let { p, on }: { p: Portrait; on: boolean } = $props();

  function remove() {
    if (confirm(`Удалить «${p.name}» из библиотеки?`)) dispatch('portraits', 'remove', { id: p.id });
  }
</script>

<div class="card" class:on>
  <button class="thumb" title={on ? 'Убрать с экрана' : 'Показать на экране'} onclick={() => dispatch('portraits', 'toggle', { id: p.id })}>
    <img src={assetUrl(p)} alt={p.name} loading="lazy" />
  </button>
  {#if on}<div class="badge">на экране</div>{/if}
  {#if !isFromFolder(p)}
    <!-- Файлы из подключённых папок отсюда не удаляются. -->
    <button class="del" title="Удалить из библиотеки" onclick={remove}><X size={13} /></button>
  {/if}
  <input
    type="text"
    placeholder="Подпись"
    value={p.name}
    onchange={(e) => dispatch('portraits', 'rename', { id: p.id, name: e.currentTarget.value })}
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
  .del {
    position: absolute;
    right: 6px;
    top: 6px;
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    cursor: pointer;
    opacity: 0;
  }
  .card:hover .del {
    opacity: 1;
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
