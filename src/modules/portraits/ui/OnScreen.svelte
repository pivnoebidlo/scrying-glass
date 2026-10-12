<!-- Правая панель: кто сейчас на экране. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { assetUrl } from '../../../shared/vault';
  import { onMount } from 'svelte';
  import { autoCaption, connectCardNames } from './cardNames.svelte';

  let { ms }: ModuleProps<'portraits'> = $props();
  onMount(connectCardNames);
</script>

{#if ms.onScreen.length === 0}
  <div class="faint">Никого нет. Нажмите на портрет, чтобы показать его игрокам.</div>
{:else}
  <ul>
    {#each ms.onScreen as path (path)}
      <li>
        <img src={assetUrl(path)} alt="" />
        <input
          class="name"
          type="text"
          title="Подпись на экране игроков. Оставьте пустым — будет название карточки или имя файла"
          placeholder={autoCaption(path)}
          value={ms.names[path] ?? ''}
          onchange={(e) => dispatch('portraits', 'rename', { path, name: e.currentTarget.value })}
          onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
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
    padding: 3px 6px;
    border: 1px solid transparent;
    background: transparent;
    text-overflow: ellipsis;
  }
  .name::placeholder {
    color: var(--text-normal);
  }
  .name:hover {
    border-color: var(--border);
  }
  .name:focus::placeholder {
    color: var(--text-faint);
  }
  .btn {
    justify-content: center;
  }
</style>
