<!-- Правая панель: звуки под рукой (подборка) — щелчок играет один раз поверх музыки (рычаг — гром), громкость и
     «остановить все». -->
<script lang="ts">
  import { AudioLines, Square, Volume2 } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { allFiles, trackName } from '../../../shared/vault';
  import { visibleIn } from '../../../shared/adventures';
  import TrayChips from '../../scenes/ui/TrayChips.svelte';
  import { sfx } from './playing.svelte';
  import { builtin, loadBuiltin } from './builtin.svelte';

  let { ms, app }: ModuleProps<'sounds'> = $props();

  // Встроенные эффекты, потом свои аудиофайлы приключения (их бывает много — в конце списка).
  loadBuiltin();
  function options() {
    const tree = app.vault.tree;
    const own = (tree ? allFiles(tree, 'audio') : [])
      .filter((f) => visibleIn(app.adventures, f.path))
      .map((f) => ({ id: f.path, title: trackName(f.path), sub: f.path.slice(0, f.path.lastIndexOf('/')), group: 'В хранилище' }));
    return [...builtin.sfx.map((p) => ({ id: p, title: trackName(p), group: 'Встроенные' })), ...own];
  }
</script>

<TrayChips
  {app}
  part="sounds"
  isOn={(id) => sfx.playing.includes(id)}
  toggle={(path) => dispatch('sounds', 'play', { path })}
  {options}
  caption={trackName}
  iconOf={() => AudioLines}
  pickTitle="Звуки"
  hint="Звуки под рукой: дёрнули рычаг — гром. Щелчок играет один раз поверх музыки."
/>

<div class="row">
  <Volume2 size={14} class="faint" />
  <Slider
    value={sfx.volume ?? ms.volume}
    title="Громкость звуков"
    oninput={(v) => (sfx.volume = v)}
    onchange={(v) => dispatch('sounds', 'setVolume', { value: v }).then(() => (sfx.volume = null))}
  />
  <button class="icon-btn" title="Остановить все звуки" disabled={!sfx.playing.length} onclick={() => dispatch('sounds', 'stop')}>
    <Square size={13} />
  </button>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }
  .row :global(.slider),
  .row :global(input[type='range']) {
    flex: 1;
  }
</style>
