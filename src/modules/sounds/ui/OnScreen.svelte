<!-- Правая панель: звуки под рукой (подборка) — щелчок играет один раз поверх музыки (рычаг — гром), громкость и
     «остановить все». -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { AudioLines, Square, Volume2 } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { allFiles, trackName } from '../../../shared/vault';
  import { visibleIn } from '../../../shared/adventures';
  import TrayChips from '../../scenes/ui/TrayChips.svelte';
  import { sfx } from './playing.svelte';
  import { builtinSoundOptions } from '../../../shared/sounds';
  import { builtin, loadBuiltin } from './builtin.svelte';

  let { ms, app }: ModuleProps<'sounds'> = $props();

  // Built-in effects by group, then the adventure's own audio files (there can be many — at the end of the list).
  loadBuiltin();
  function options() {
    const tree = app.vault.tree;
    const own = (tree ? allFiles(tree, 'audio') : [])
      .filter((f) => visibleIn(app.adventures, f.path))
      .map((f) => ({ id: f.path, title: trackName(f.path), sub: f.path.slice(0, f.path.lastIndexOf('/')), group: t('common.inVault') }));
    return [...builtinSoundOptions(builtin.sfx, trackName), ...own];
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
  pickTitle={t('sounds.pickTitle')}
  hint={t('sounds.trayHint')}
/>

<div class="row">
  <Volume2 size={14} class="faint" />
  <Slider
    value={sfx.volume ?? ms.volume}
    title={t('sounds.volume')}
    oninput={(v) => (sfx.volume = v)}
    onchange={(v) => dispatch('sounds', 'setVolume', { value: v }).then(() => (sfx.volume = null))}
  />
  <button class="icon-btn" title={t('sounds.stopAll')} disabled={!sfx.playing.length} onclick={() => dispatch('sounds', 'stop')}>
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
