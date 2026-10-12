<!-- Правая панель: что играет, управление музыкой и атмосферой. -->
<script lang="ts">
  import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, Wind } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { trackName } from '../../../shared/vault';
  import type { Repeat as RepeatMode } from '../types';
  import { formatTime, live, playback, seek } from './playback.svelte';
  import { playlistTitle } from './playlists';

  let { ms, app }: ModuleProps<'music'> = $props();

  const track = $derived(ms.queue[ms.index]);
  const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { all: 'one', one: 'off', off: 'all' };
  const REPEAT_TITLE: Record<RepeatMode, string> = {
    all: 'Повтор: вся очередь',
    one: 'Повтор: один трек',
    off: 'Без повтора',
  };
</script>

{#if track}
  <div class="now">
    <div class="title" title={track}>{trackName(track)}</div>
    <div class="faint sub">{playlistTitle(app.vault.tree, app.vault.name, ms.playlist)} · {ms.index + 1} из {ms.queue.length}</div>
  </div>

  <div class="progress">
    <Slider value={playback.time} max={playback.duration || 1} step={0.1} title="Перемотка" oninput={seek} />
    <div class="times faint"><span>{formatTime(playback.time)}</span><span>{formatTime(playback.duration)}</span></div>
  </div>

  <div class="controls">
    <button class="icon-btn" class:active={ms.shuffle} title={ms.shuffle ? 'Перемешано' : 'Перемешать'} onclick={() => dispatch('music', 'toggleShuffle')}>
      <Shuffle size={15} />
    </button>
    <button class="icon-btn" title="Предыдущий" onclick={() => dispatch('music', 'prev')}><SkipBack size={16} /></button>
    <button class="play" title={ms.playing ? 'Пауза' : 'Играть'} onclick={() => dispatch('music', 'playPause')}>
      {#if ms.playing}<Pause size={18} />{:else}<Play size={18} />{/if}
    </button>
    <button class="icon-btn" title="Следующий" onclick={() => dispatch('music', 'next')}><SkipForward size={16} /></button>
    <button class="icon-btn" class:active={ms.repeat !== 'off'} title={REPEAT_TITLE[ms.repeat]} onclick={() => dispatch('music', 'setRepeat', { repeat: NEXT_REPEAT[ms.repeat] })}>
      {#if ms.repeat === 'one'}<Repeat1 size={15} />{:else}<Repeat size={15} />{/if}
    </button>
  </div>

  <div class="volume">
    <Volume2 size={14} class="faint" />
    <Slider
      value={live.volume ?? ms.volume}
      title="Громкость музыки"
      oninput={(v) => (live.volume = v)}
      onchange={(v) => dispatch('music', 'setVolume', { value: v }).then(() => (live.volume = null))}
    />
  </div>
{:else}
  <div class="faint">Ничего не играет. Выберите плейлист в «Музыке» или трек в «Файлах».</div>
{/if}

{#if ms.ambience.length}
  <div class="ambience">
    <button
      class="icon-btn"
      class:active={ms.ambiencePlaying}
      title={ms.ambiencePlaying ? 'Приглушить атмосферу' : 'Включить атмосферу'}
      onclick={() => dispatch('music', 'toggleAmbience')}
    >
      <Wind size={15} />
    </button>
    <span class="label">Атмосфера · {ms.ambience.length}</span>
    <Slider
      value={live.ambienceVolume ?? ms.ambienceVolume}
      title="Громкость атмосферы"
      oninput={(v) => (live.ambienceVolume = v)}
      onchange={(v) => dispatch('music', 'setAmbienceVolume', { value: v }).then(() => (live.ambienceVolume = null))}
    />
  </div>
{/if}

<style>
  .now {
    min-width: 0;
  }
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  .sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
  }
  .times {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .play {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
  }
  .play:hover {
    background: var(--accent-hover);
  }
  .volume,
  .ambience {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ambience {
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }
  .label {
    flex: none;
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
