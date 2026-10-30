<!-- Right panel: ambience — looped sounds over the music (rain, tavern). The tray chips turn loops on and off; under
     them — mute all and the ambience volume. The music module plays it (music/ui/Player.svelte). -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Wind } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { allFiles, trackName } from '../../../shared/vault';
  import { visibleIn } from '../../../shared/adventures';
  import { builtinSoundOptions } from '../../../shared/sounds';
  import TrayChips from '../../scenes/ui/TrayChips.svelte';
  import { live } from '../../music/ui/playback.svelte';
  import { builtin, loadBuiltin } from '../../sounds/ui/builtin.svelte';

  let { app }: ModuleProps<'ambience'> = $props();
  const ms = $derived(app.music);

  // A click on a tray chip adds the loop (and turns the ambience on) or takes it away.
  function toggleLoop(path: string) {
    const has = ms.ambience.some((a) => a.path === path);
    if (has && !ms.ambiencePlaying) return dispatch('music', 'toggleAmbience');
    return dispatch('music', 'toggleAmbient', { path });
  }
  // Built-in ambience by group, then the adventure's own audio files (there can be many — at the end of the list).
  loadBuiltin();
  function audioOptions() {
    const tree = app.vault.tree;
    const own = (tree ? allFiles(tree, 'audio') : [])
      .filter((f) => visibleIn(app.adventures, f.path))
      .map((f) => ({ id: f.path, title: trackName(f.path), sub: f.path.slice(0, f.path.lastIndexOf('/')), group: t('common.inVault') }));
    return [...builtinSoundOptions(builtin.ambience, trackName), ...own];
  }
</script>

<TrayChips
  {app}
  part="ambience"
  isOn={(path) => ms.ambiencePlaying && ms.ambience.some((a) => a.path === path)}
  toggle={toggleLoop}
  options={audioOptions}
  caption={trackName}
  iconOf={() => Wind}
  pickTitle={t('music.ambiencePick')}
  hint={t('music.ambienceHint')}
/>

{#if ms.ambience.length}
  <div class="ambience">
    <button
      class="icon-btn"
      class:active={ms.ambiencePlaying}
      title={ms.ambiencePlaying ? t('music.muteAmbience') : t('music.playAmbience')}
      onclick={() => dispatch('music', 'toggleAmbience')}
    >
      <Wind size={15} />
    </button>
    <span class="label">{t('music.ambienceN', { count: ms.ambience.length })}</span>
    <Slider
      value={live.ambienceVolume ?? ms.ambienceVolume}
      title={t('music.ambienceVolume')}
      oninput={(v) => (live.ambienceVolume = v)}
      onchange={(v) => dispatch('music', 'setAmbienceVolume', { value: v }).then(() => (live.ambienceVolume = null))}
    />
  </div>
{/if}

<style>
  .ambience {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }
  .ambience :global(.slider),
  .ambience :global(input[type='range']) {
    flex: 1;
  }
  .label {
    flex: none;
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
