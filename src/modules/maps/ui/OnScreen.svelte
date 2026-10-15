<!-- Правая панель: карты под рукой (подборка) — щелчок выводит карту игрокам и убирает; у текущей — редактор и обзор. -->
<script lang="ts">
  import { Maximize, Pencil } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { openTab } from '../../../renderer/lib/nav';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import Tray from '../../scenes/ui/Tray.svelte';
  import { mapName } from '../library';
  import { FULL_VIEW } from '../types';
  import { ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'maps'> = $props();

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
  hint="Карты под рукой: перетащите сюда карты из списка или добавьте кнопкой."
>
  {#if ms.current}
    {@const path = ms.current}
    <div class="row">
      <span class="name" title={path}>{mapName(path)}</span>
      <button class="icon-btn" title="Открыть в редакторе" onclick={() => { ui.selected = path; openTab('maps'); }}><Pencil size={14} /></button>
      <button class="icon-btn" title="Игроки видят всю карту" onclick={() => dispatch('maps', 'setView', { path, view: FULL_VIEW })}><Maximize size={14} /></button>
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
