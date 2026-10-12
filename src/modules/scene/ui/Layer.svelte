<!-- Экран игроков: фон на весь экран с плавной сменой. -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { vaultUrl } from '../../../shared/vault';

  let { ms, app }: ModuleProps<'scene'> = $props();

  // Под портретами фон притеняется, чтобы они читались.
  const dimmed = $derived(ms.dim && !!ms.background && app.portraits.onScreen.length > 0);
</script>

{#key ms.background}
  {#if ms.background}
    <!-- |global: переход должен срабатывать и когда блок пересоздаётся из-за смены картинки ({#key}). -->
    <div class="bg" transition:fade|global={{ duration: 600 }}>
      {#if ms.fit === 'contain'}
        <!-- Поля вокруг вписанной картинки заполняются её размытой копией. -->
        <img class="fill" src={vaultUrl(ms.background)} alt="" />
      {/if}
      <img class="main" class:cover={ms.fit === 'cover'} src={vaultUrl(ms.background)} alt="" />
    </div>
  {/if}
{/key}
<div class="dim" class:on={dimmed}></div>

<style>
  .bg,
  .dim {
    position: absolute;
    inset: 0;
  }
  .bg {
    overflow: hidden;
  }
  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .fill {
    object-fit: cover;
    filter: blur(4cqmin) brightness(0.45);
    transform: scale(1.1);
  }
  .main {
    object-fit: contain;
  }
  .main.cover {
    object-fit: cover;
  }
  .dim {
    background: #000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
  }
  .dim.on {
    opacity: 0.55;
  }
</style>
