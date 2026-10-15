<!-- Правая панель: что играет, управление музыкой и атмосферой. -->
<script lang="ts">
  import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, Wind } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { trackName } from '../../../shared/vault';
  import type { Repeat as RepeatMode } from '../types';
  import { formatTime, live, playback, seek } from './playback.svelte';
  import { playlists, playlistTitle } from './playlists';
  import { Disc3, FolderOpen, Star } from '@lucide/svelte';
  import { trayOwner } from '../../scenes/tray';
  import TrayChips from '../../scenes/ui/TrayChips.svelte';
  import { builtin, loadBuiltin } from '../../sounds/ui/builtin.svelte';
  import { allFiles, fileKind, folderRole } from '../../../shared/vault';
  import { visibleIn } from '../../../shared/adventures';

  let { ms, app }: ModuleProps<'music'> = $props();

  // Подборка: плейлисты (папки) и отдельные треки. Щелчок — играть (трек — по кругу), играющее — пауза.
  const isTrack = (id: string) => fileKind(id) === 'audio';
  function toggleItem(id: string) {
    if (ms.playlist === id && ms.queue.length) return dispatch('music', 'playPause');
    return isTrack(id) ? dispatch('music', 'playTrack', { path: id }) : dispatch('music', 'playFolder', { folder: id });
  }
  // Основная музыка включённой сцены — играет, когда сцену включают. Звёздочка у строки подборки: назначить или снять
  // (тогда сцена музыку не меняет).
  const scene = $derived.by(() => {
    const o = trayOwner(app.scenes, app.adventures);
    return 'scene' in o ? app.scenes.scenes.find((x) => x.id === o.scene) : undefined;
  });
  const main = $derived(scene?.include.music ? scene.music.playlist : null);
  async function setMain(id: string) {
    if (!scene) return;
    if (main === id) return dispatch('scenes', 'setInclude', { id: scene.id, part: 'music', value: false });
    await dispatch('scenes', 'setContent', { id: scene.id, content: { music: { playlist: id, shuffle: ms.shuffle } } });
    await dispatch('scenes', 'setInclude', { id: scene.id, part: 'music', value: true });
  }

  // Атмосфера в подборке: щелчок добавляет зацикленный звук (и включает атмосферу) или убирает его.
  function toggleLoop(path: string) {
    const has = ms.ambience.some((a) => a.path === path);
    if (has && !ms.ambiencePlaying) return dispatch('music', 'toggleAmbience');
    return dispatch('music', 'toggleAmbient', { path });
  }
  // Встроенная атмосфера, потом свои аудиофайлы приключения (их бывает много — в конце списка).
  loadBuiltin();
  function audioOptions() {
    const tree = app.vault.tree;
    const own = (tree ? allFiles(tree, 'audio') : [])
      .filter((f) => visibleIn(app.adventures, f.path))
      .map((f) => ({ id: f.path, title: trackName(f.path), sub: f.path.slice(0, f.path.lastIndexOf('/')), group: 'В хранилище' }));
    return [...builtin.ambience.map((p) => ({ id: p, title: trackName(p), group: 'Встроенные' })), ...own];
  }

  // Плейлист в подборке — по названию папки (папка music — по папке, где она лежит).
  function folderTitle(path: string) {
    const parts = path.split('/');
    const name = parts.at(-1) ?? '';
    return (folderRole(name) === 'music' ? parts.at(-2) : name) || app.vault.name;
  }
  function options() {
    const tree = app.vault.tree;
    if (!tree) return [];
    const lists = playlists(tree, app.vault.name, app.adventures).map((p) => ({ id: p.path, title: p.title, sub: `треков: ${p.count}`, group: 'Плейлисты' }));
    const tracks = allFiles(tree, 'audio')
      .filter((f) => visibleIn(app.adventures, f.path))
      .map((f) => ({ id: f.path, title: trackName(f.path), sub: playlistTitle(tree, app.vault.name, f.path.slice(0, f.path.lastIndexOf('/'))), group: 'Треки' }));
    return [...lists, ...tracks];
  }

  const track = $derived(ms.queue[ms.index]);
  const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { all: 'one', one: 'off', off: 'all' };
  const REPEAT_TITLE: Record<RepeatMode, string> = {
    all: 'Повтор: вся очередь',
    one: 'Повтор: один трек',
    off: 'Без повтора',
  };
</script>

<TrayChips
  {app}
  part="music"
  isOn={(id) => ms.playing && ms.playlist === id}
  toggle={toggleItem}
  {options}
  caption={(id) => (isTrack(id) ? trackName(id) : folderTitle(id))}
  iconOf={(id) => (isTrack(id) ? Disc3 : FolderOpen)}
  pickTitle="Плейлисты и треки"
  hint="Музыка под рукой: тема локации, бой, погоня — щелчок переключает."
>
  {#snippet extra(id: string)}
    {#if scene}
      <button
        class="star"
        class:main={main === id}
        title={main === id ? `Основная музыка сцены «${scene.name}» — включается вместе с ней. Снять` : `Сделать основной музыкой сцены «${scene.name}»: включается вместе с ней`}
        onclick={() => setMain(id)}
      >
        <Star size={11} />
      </button>
    {/if}
  {/snippet}
</TrayChips>

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
  <div class="faint idle">Ничего не играет.</div>
{/if}

<div class="amb-tray">
  <div class="faint label-row">Атмосфера</div>
  <TrayChips
    {app}
    part="ambience"
    isOn={(path) => ms.ambiencePlaying && ms.ambience.some((a) => a.path === path)}
    toggle={toggleLoop}
    options={audioOptions}
    caption={trackName}
    iconOf={() => Wind}
    pickTitle="Звуки атмосферы"
    hint="Дождь, таверна, лес — зацикленные звуки поверх музыки. Щелчок включает и выключает."
  />
</div>

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
  .amb-tray {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }
  .label-row {
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .star {
    display: none;
    place-items: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--text-faint);
    cursor: pointer;
  }
  :global(.chip:hover) .star,
  .star.main {
    display: grid;
  }
  .star.main {
    color: #f0c45a;
  }
  .star.main :global(svg) {
    fill: currentColor;
  }
  .now,
  .idle {
    margin-top: 10px;
  }
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
    margin-top: 8px;
  }
  .label {
    flex: none;
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
