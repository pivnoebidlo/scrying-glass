<!-- Экран игроков: раздатка по центру поверх затемнённой сцены, как лист, положенный на стол. -->
<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { vaultUrl } from '../../../shared/vault';

  let { ms }: ModuleProps<'handouts'> = $props();
</script>

{#key ms.current}
  {#if ms.current}
    <!-- |global: переход должен срабатывать и когда блок пересоздаётся из-за смены картинки ({#key}). -->
    <div class="backdrop" transition:fade|global={{ duration: 400 }}>
      <img src={vaultUrl(ms.current)} alt="" transition:scale|global={{ start: 0.94, duration: 400 }} />
    </div>
  {/if}
{/key}

<style>
  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.78);
  }
  /* Картинка вписывается в экран с полями; тень — по самой картинке, а не по её рамке. */
  img {
    position: absolute;
    inset: 4cqmin;
    width: calc(100% - 8cqmin);
    height: calc(100% - 8cqmin);
    object-fit: contain;
    filter: drop-shadow(0 1.5cqmin 4cqmin rgba(0, 0, 0, 0.8));
  }
</style>
