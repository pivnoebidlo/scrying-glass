<!-- Правая панель: портреты под рукой (подборка) — щелчок выводит на экран и убирает, на экране может быть
     несколько; ниже — подписи тех, кто на экране. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { CircleHelp, Plus, X } from '@lucide/svelte';
  import { currentTray, trayOwner } from '../../scenes/tray';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { assetUrl, thumb } from '../../../shared/vault';
  import { onMount } from 'svelte';
  import { caption, connectCardNames } from './cardNames.svelte';
  import { canRename, renamePortrait } from './rename';
  import Tray from '../../scenes/ui/Tray.svelte';

  let { ms, app }: ModuleProps<'portraits'> = $props();
  onMount(connectCardNames);

  // На экране, но не в подборке (осталось от прошлой сцены) — можно добавить.
  const inTrayNow = (path: string) => currentTray(app.scenes, app.adventures).portraits.includes(path);
  const addToTray = (path: string) =>
    dispatch('scenes', 'trayAdd', { owner: $state.snapshot(trayOwner(app.scenes, app.adventures)), part: 'portraits', paths: [path] });
</script>

<Tray
  {app}
  part="portraits"
  prefer="characters"
  caption={(p) => caption(ms, p)}
  isOn={(p) => ms.onScreen.includes(p)}
  toggle={(path) => dispatch('portraits', 'toggle', { path })}
  hint={t('portraits.trayHint')}
  showLoose={false}
/>

{#if ms.onScreen.length}
  <ul>
    {#each ms.onScreen as path (path)}
      <li>
        <img src={thumb(assetUrl(path), 64)} alt="" />
        <input
          class="name"
          type="text"
          title={t('portraits.screenNameHint')}
          value={caption(ms, path)}
          readonly={!canRename(path)}
          onchange={(e) => {
            const name = e.currentTarget.value.trim();
            if (name && name !== caption(ms, path)) renamePortrait(path, name);
            else e.currentTarget.value = caption(ms, path);
          }}
          onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <button
          class="icon-btn unknown"
          class:on={ms.unknown?.includes(path)}
          title={ms.unknown?.includes(path) ? t('portraits.unknownOn') : t('portraits.unknownOff')}
          onclick={() => dispatch('portraits', 'toggleUnknown', { path })}
        ><CircleHelp size={14} /></button>
        {#if !inTrayNow(path)}
          <button class="icon-btn" title={t('common.addToTray')} onclick={() => addToTray(path)}><Plus size={14} /></button>
        {/if}
        <button class="icon-btn" title={t('common.removeFromScreen')} onclick={() => dispatch('portraits', 'toggle', { path })}>
          <X size={14} />
        </button>
      </li>
    {/each}
  </ul>
  <button class="btn" onclick={() => dispatch('portraits', 'clearScreen')}>{t('portraits.clear')}</button>
{/if}

<style>
  .unknown.on {
    color: var(--accent);
  }
  ul {
    margin: 8px 0 0;
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
