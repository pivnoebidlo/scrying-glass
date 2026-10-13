<!-- Раздел настроек «Файлы»: какое хранилище открыто. -->
<script lang="ts">
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import RoleNames from './RoleNames.svelte';

  let { ms }: ModuleProps<'vault'> = $props();
  const others = $derived(ms.recent.filter((r) => r !== ms.root));
</script>

<div class="setting">
  <div class="info">
    <div class="name">Хранилище</div>
    <div class="desc path" title={ms.root}>{ms.root}</div>
  </div>
  <button class="btn" onclick={() => dispatch('vault', 'reveal', { folder: '' })}>Показать в Finder</button>
  <button class="btn primary" onclick={() => dispatch('vault', 'choose')}>Открыть другое…</button>
</div>

<div class="setting">
  <div class="info">
    <div class="name">Как устроено хранилище</div>
    <div class="desc">
      Это обычная папка, внутри — любое дерево: приключения, главы кампании, вложенные папки. Назначение папок
      приложение угадывает по названию (список — ниже, в «Назначении папок»). Свои данные (подписи, что на экране)
      приложение хранит в скрытой папке <code>.scrying-glass</code> внутри хранилища. Файлы пользователя оно не
      меняет; исключение — карточки, которые вы создаёте и правите в приложении.
    </div>
  </div>
</div>

{#if others.length}
  <h3>Недавние</h3>
  {#each others as r (r)}
    <div class="setting">
      <div class="info"><div class="desc path" title={r}>{r}</div></div>
      <button class="btn" onclick={() => dispatch('vault', 'open', { root: r })}>Открыть</button>
      <button class="btn" onclick={() => dispatch('vault', 'forget', { root: r })}>Забыть</button>
    </div>
  {/each}
{/if}

<RoleNames {ms} />

<style>
  .path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bg-active);
  }
</style>
