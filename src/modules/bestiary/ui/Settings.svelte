<!-- Раздел настроек «Карточки»: где лежит библиотека карточек. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';

  let {}: ModuleProps<'bestiary'> = $props();

  let lib = $state<{ path: string | null; isDefault: boolean }>({ path: null, isDefault: true });
  const refresh = async () => (lib = await window.api.library());
  onMount(refresh);

  async function choose(reset = false) {
    await window.api.chooseLibrary(reset);
    await refresh();
  }
</script>

<div class="setting">
  <div class="info">
    <div class="name">Библиотека карточек</div>
    <div class="desc path" title={lib.path ?? ''}>{lib.path}</div>
    <div class="desc">
      Общие для всех кампаний монстры и NPC с портретами. Папку можно положить в облако (iCloud, Dropbox) или в git,
      чтобы библиотека была на всех компьютерах. При смене папки карточки из старой не переносятся.
    </div>
  </div>
  <button class="btn" onclick={() => window.api.revealLibrary()}>Показать в Finder</button>
  <button class="btn primary" onclick={() => choose()}>Выбрать папку…</button>
</div>
{#if !lib.isDefault}
  <div class="setting">
    <div class="info"><div class="desc">Сейчас выбрана своя папка.</div></div>
    <button class="btn" onclick={() => choose(true)}>Вернуть папку по умолчанию</button>
  </div>
{/if}

<div class="setting">
  <div class="info">
    <div class="name">Встроенный бестиарий</div>
    <div class="desc">
      Монстры из System Reference Document 5.1 и 5.2.1 © Wizards of the Coast, лицензия CC BY 4.0. Числовые данные —
      проект 5e-bits/5e-database. Русский перевод — OmnisGM (rules.omnisgm.com), CC BY 4.0. Встроенные карточки
      только для чтения: чтобы изменить, перевести или добавить портрет, сделайте копию в библиотеку или кампанию.
    </div>
  </div>
</div>

<style>
  .path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
