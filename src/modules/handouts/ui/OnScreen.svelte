<!-- Правая панель: какая раздатка сейчас у игроков. -->
<script lang="ts">
  import { Pencil, X } from '@lucide/svelte';
  import { editNote } from '../../tools/ui/ui.svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { prettyName, vaultUrl, thumb } from '../../../shared/vault';
  import { isNotePath, noteTitle } from '../../../shared/notes';
  import NotePaper from '../../../renderer/lib/note/NotePaper.svelte';

  let { ms }: ModuleProps<'handouts'> = $props();
</script>

{#if ms.current}
  <div class="row">
    {#if isNotePath(ms.current)}
      <div class="mini">{#if ms.note}<NotePaper note={ms.note} />{/if}</div>
      <span class="name" title={ms.current}>{noteTitle(ms.current)}</span>
    {:else}
      <img src={thumb(vaultUrl(ms.current), 80)} alt="" />
      <span class="name" title={ms.current}>{prettyName(ms.current)}</span>
    {/if}
    {#if isNotePath(ms.current)}
      {@const p = ms.current}
      <button class="icon-btn" title="Править записку" onclick={() => editNote(p)}><Pencil size={14} /></button>
    {/if}
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
  .mini {
    flex: none;
    width: 32px;
    height: 40px;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
