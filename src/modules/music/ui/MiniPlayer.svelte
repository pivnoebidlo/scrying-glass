<!-- Правая панель: что играет, управление музыкой и атмосферой. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, Wind, X } from '@lucide/svelte';
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
      .map((f) => ({ id: f.path, title: trackName(f.path), sub: f.path.slice(0, f.path.lastIndexOf('/')), group: t('common.inVault') }));
    return [...builtin.ambience.map((p) => ({ id: p, title: trackName(p), group: t('common.builtin') })), ...own];
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
    const lists = playlists(tree, app.vault.name, app.adventures).map((p) => ({ id: p.path, title: p.title, sub: t('music.tracksN', { count: p.count }), group: t('music.playlists') }));
    const tracks = allFiles(tree, 'audio')
      .filter((f) => visibleIn(app.adventures, f.path))
      .map((f) => ({ id: f.path, title: trackName(f.path), sub: playlistTitle(tree, app.vault.name, f.path.slice(0, f.path.lastIndexOf('/'))), group: t('music.tracks') }));
    return [...lists, ...tracks];
  }

  const track = $derived(ms.queue[ms.index]);
  const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { all: 'one', one: 'off', off: 'all' };
  const repeatTitle = (r: RepeatMode) => t(`music.repeat.${r}`);
</script>

<TrayChips
  {app}
  part="music"
  isOn={(id) => ms.playing && ms.playlist === id}
  toggle={toggleItem}
  {options}
  caption={(id) => (isTrack(id) ? trackName(id) : folderTitle(id))}
  iconOf={(id) => (isTrack(id) ? Disc3 : FolderOpen)}
  pickTitle={t('music.pickTitle')}
  hint={t('music.trayHint')}
>
  {#snippet extra(id: string)}
    {#if scene}
      <button
        class="star"
        class:main={main === id}
        title={main === id ? t('music.mainOff', { name: scene.name }) : t('music.mainOn', { name: scene.name })}
        onclick={() => setMain(id)}
      >
        <Star size={11} />
      </button>
    {/if}
  {/snippet}
</TrayChips>

{#if track}
  <div class="now">
    <div class="title-row">
      <div class="title" title={track}>{trackName(track)}</div>
      <button class="icon-btn" title={t('music.removeFromPlayer')} onclick={() => dispatch('music', 'clear')}><X size={13} /></button>
    </div>
    <div class="faint sub">{playlistTitle(app.vault.tree, app.vault.name, ms.playlist)} · {t('music.position', { n: ms.index + 1, total: ms.queue.length })}</div>
  </div>

  <div class="progress">
    <Slider value={playback.time} max={playback.duration || 1} step={0.1} title={t('music.seek')} oninput={seek} />
    <div class="times faint"><span>{formatTime(playback.time)}</span><span>{formatTime(playback.duration)}</span></div>
  </div>

  <div class="controls">
    <button class="icon-btn" class:active={ms.shuffle} title={ms.shuffle ? t('music.shuffled') : t('music.shuffle')} onclick={() => dispatch('music', 'toggleShuffle')}>
      <Shuffle size={15} />
    </button>
    <button class="icon-btn" title={t('music.prev')} onclick={() => dispatch('music', 'prev')}><SkipBack size={16} /></button>
    <button class="play" title={ms.playing ? t('music.pause') : t('music.play')} onclick={() => dispatch('music', 'playPause')}>
      {#if ms.playing}<Pause size={18} />{:else}<Play size={18} />{/if}
    </button>
    <button class="icon-btn" title={t('music.next')} onclick={() => dispatch('music', 'next')}><SkipForward size={16} /></button>
    <button class="icon-btn" class:active={ms.repeat !== 'off'} title={repeatTitle(ms.repeat)} onclick={() => dispatch('music', 'setRepeat', { repeat: NEXT_REPEAT[ms.repeat] })}>
      {#if ms.repeat === 'one'}<Repeat1 size={15} />{:else}<Repeat size={15} />{/if}
    </button>
  </div>

  <div class="volume">
    <Volume2 size={14} class="faint" />
    <Slider
      value={live.volume ?? ms.volume}
      title={t('music.volume')}
      oninput={(v) => (live.volume = v)}
      onchange={(v) => dispatch('music', 'setVolume', { value: v }).then(() => (live.volume = null))}
    />
  </div>
{:else}
  <div class="faint idle">{t('music.idle')}</div>
{/if}

<div class="amb-tray">
  <div class="faint label-row">{t('music.ambience')}</div>
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
</div>

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
  .title-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .title-row .title {
    flex: 1;
    min-width: 0;
  }
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
