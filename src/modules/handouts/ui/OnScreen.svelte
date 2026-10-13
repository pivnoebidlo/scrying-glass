<!-- Правая панель: какая раздатка сейчас у игроков. -->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { prettyName, vaultUrl } from '../../../shared/vault';

  let { ms }: ModuleProps<'handouts'> = $props();
</script>

{#if ms.current}
  <div class="row">
    <img src={vaultUrl(ms.current)} alt="" />
    <span class="name" title={ms.current}>{prettyName(ms.current)}</span>
    <button class="icon-btn" title="Убрать раздатку" onclick={() => dispatch('handouts', 'clear')}><X size={14} /></button>
  </div>
{:else}
  <div class="faint">Нет. Записки и улики — во вкладке «Раздатка».</div>
{/if}

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  img {
    width: 32px;
    height: 40px;
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
</style>
