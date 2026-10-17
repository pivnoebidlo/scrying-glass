<!-- Правая панель: карты под рукой (подборка) — щелчок выводит карту игрокам и убирает; у текущей — редактор и обзор. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Maximize, Pencil, Plus, X } from '@lucide/svelte';
  import { currentTray, trayOwner } from '../../scenes/tray';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import Tray from '../../scenes/ui/Tray.svelte';
  import { mapName } from '../library';
  import { FULL_VIEW } from '../types';
  import { ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'maps'> = $props();

  const inTrayNow = (path: string) => currentTray(app.scenes, app.adventures).map.includes(path);

  function toggle(path: string) {
    if (ms.current === path) return dispatch('maps', 'clear');
    ui.selected = path;
    return dispatch('maps', 'show', { path });
  }
</script>

<Tray
  {app}
  part="map"
  prefer="maps"
  wide
  caption={mapName}
  isOn={(p) => ms.current === p}
  {toggle}
  hint={t('maps.trayHint')}
  showLoose={false}
>
  {#if ms.current}
    {@const path = ms.current}
    <div class="row">
      <span class="name" title={path}>{mapName(path)}</span>
      <button class="icon-btn" title={t('maps.openInEditor')} onclick={() => { ui.selected = path; openTab('maps'); }}><Pencil size={14} /></button>
      <button class="icon-btn" title={t('maps.wholeMapHint')} onclick={() => dispatch('maps', 'setView', { path, view: FULL_VIEW })}><Maximize size={14} /></button>
      {#if !inTrayNow(path)}
        <button class="icon-btn" title={t('common.addToTray')} onclick={() => dispatch('scenes', 'trayAdd', { owner: $state.snapshot(trayOwner(app.scenes, app.adventures)), part: 'map', paths: [path] })}><Plus size={14} /></button>
      {/if}
      <button class="icon-btn" title={t('maps.removeMap')} onclick={() => dispatch('maps', 'clear')}><X size={14} /></button>
    </div>
  {/if}
</Tray>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
