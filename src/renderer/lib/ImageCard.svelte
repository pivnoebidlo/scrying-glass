<!-- Карточка картинки из хранилища. Кнопки — действия модулей (портрет, на весь экран, …),
     клик по картинке выполняет основное действие. Нижняя часть карточки — на усмотрение того, кто её показывает. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { vaultUrl } from '../../shared/vault';
  import { imageActions } from './registry';
  import { dispatch, store } from './store.svelte';
  import { Trash2 } from '@lucide/svelte';

  let {
    path,
    primary,
    aspect = '3 / 4',
    children,
  }: { path: string; primary: string; aspect?: string; children?: Snippet } = $props();

  const app = $derived(store.state);
  const main = $derived(imageActions.find((a) => a.id === primary) ?? imageActions[0]);
  const active = $derived(imageActions.filter((a) => a.active(app, path)));
</script>

<div class="card" class:on={active.length > 0}>
  {#if main}
    <button
      class="thumb"
      title={main.active(app, path) ? 'Убрать с экрана' : main.title}
      onclick={() => main.toggle(app, path)}
    >
      <img src={vaultUrl(path)} alt="" loading="lazy" style:aspect-ratio={aspect} />
    </button>
  {/if}

  <div class="badges">
    {#each active as a (a.id)}<span class="badge">{a.badge}</span>{/each}
  </div>

  <div class="actions">
    {#each imageActions as a (a.id)}
      {@const on = a.active(app, path)}
      <button class="action" class:on title={on ? `${a.title}: убрать` : a.title} onclick={() => a.toggle(app, path)}>
        <a.icon size={13} />
      </button>
    {/each}
    <button class="action trash" title="Переместить в Корзину" onclick={() => dispatch('vault', 'trash', { paths: [path] })}>
      <Trash2 size={13} />
    </button>
  </div>

  {@render children?.()}
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
    object-fit: cover;
  }
  .badges {
    position: absolute;
    left: 6px;
    top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    pointer-events: none;
  }
  .badge {
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
  }
  .actions {
    position: absolute;
    right: 6px;
    top: 6px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.12s ease;
  }
  .card:hover .actions {
    opacity: 1;
  }
  .action {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    cursor: pointer;
  }
  .action.trash {
    margin-left: 6px;
  }
  .action.trash:hover {
    color: var(--danger);
  }
  .action:hover {
    background: rgba(0, 0, 0, 0.85);
  }
  .action.on {
    background: var(--accent);
  }
</style>
