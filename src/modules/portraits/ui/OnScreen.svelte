<!-- Правая панель: кто сейчас на экране. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { assetUrl } from '../../../shared/vault';
  import { caption } from '../library';

  let { ms }: ModuleProps<'portraits'> = $props();
</script>

{#if ms.onScreen.length === 0}
  <div class="faint">Никого нет. Нажмите на портрет, чтобы показать его игрокам.</div>
{:else}
  <ul>
    {#each ms.onScreen as path (path)}
      <li>
        <img src={assetUrl(path)} alt="" />
        <span class="name">{caption(ms, path) || 'Без подписи'}</span>
        <button class="icon-btn" title="Убрать с экрана" onclick={() => dispatch('portraits', 'toggle', { path })}>
          <X size={14} />
        </button>
      </li>
    {/each}
  </ul>
  <button class="btn" onclick={() => dispatch('portraits', 'clearScreen')}>Убрать всех</button>
{/if}

<style>
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
  }
  img {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-s);
    object-fit: cover;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .btn {
    justify-content: center;
  }
</style>
