<!-- Вкладка «Музыка»: треки выбранного плейлиста и атмосфера. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import RoleFolderNames from '../../../renderer/lib/RoleFolderNames.svelte';
  import { Pause, Play, Shuffle, Trash2, Volume2, Wind, X } from '@lucide/svelte';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import Slider from '../../../renderer/lib/Slider.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { allFiles, findFolder, trackName } from '../../../shared/vault';
  import { live } from './playback.svelte';
  import { playlists } from './playlists';
  import { ui } from './ui.svelte';

  let { ms, app }: ModuleProps<'music'> = $props();

  const lists = $derived(app.vault.tree ? playlists(app.vault.tree, app.vault.name, app.adventures) : []);
  // Открыт выбранный плейлист, иначе тот, что играет, иначе первый.
  const current = $derived(
    lists.find((p) => p.path === ui.selected) ?? lists.find((p) => p.path === ms.playlist) ?? lists[0]
  );
  const tracks = $derived.by(() => {
    const f = current && app.vault.tree ? findFolder(app.vault.tree, current.path) : null;
    return f ? allFiles(f, 'audio') : [];
  });
  const nowPlaying = $derived(ms.queue[ms.index]);

  function playTrack(path: string) {
    if (path === nowPlaying && ms.playlist === current?.path) dispatch('music', 'playPause');
    else if (current) dispatch('music', 'playFolder', { folder: current.path, start: path });
  }

  async function shufflePlay() {
    if (!current) return;
    if (!ms.shuffle) await dispatch('music', 'toggleShuffle');
    dispatch('music', 'playFolder', { folder: current.path });
  }
</script>

<div class="view">
  {#if current}
    <header class="head">
      <div class="info">
        <h2>{current.title}</h2>
        <div class="faint">{t('music.tracksIn', { count: tracks.length, where: current.path || app.vault.name })}</div>
      </div>
      <button class="btn primary" onclick={() => dispatch('music', 'playFolder', { folder: current.path })}>
        <Play size={14} /> {t('music.play')}
      </button>
      <button class="btn" onclick={shufflePlay}><Shuffle size={14} /> {t('music.shufflePlay')}</button>
    </header>

    <ol class="tracks">
      {#each tracks as tr, i (tr.path)}
        {@const isNow = tr.path === nowPlaying}
        <li class:now={isNow}>
          <button class="track" onclick={() => playTrack(tr.path)}>
            <span class="num faint">
              {#if isNow && ms.playing}<Volume2 size={13} />{:else}{i + 1}{/if}
            </span>
            <span class="name">{trackName(tr.path)}</span>
            <span class="state">
              {#if isNow && ms.playing}<Pause size={13} />{:else}<Play size={13} />{/if}
            </span>
          </button>
          <button
            class="icon-btn"
            class:active={ms.ambience.some((a) => a.path === tr.path)}
            title={t('music.addToAmbience')}
            onclick={() => dispatch('music', 'toggleAmbient', { path: tr.path })}
          >
            <Wind size={14} />
          </button>
          <button class="icon-btn trash" title={t('music.toTrash')} onclick={() => dispatch('vault', 'trash', { paths: [tr.path] })}>
            <Trash2 size={14} />
          </button>
        </li>
      {/each}
    </ol>
  {:else}
    <div class="empty faint">
      <p>{t('music.none')}</p>
      <p>{t('music.putAudio')} <RoleFolderNames role="music" /> {t('music.inAdventure')}</p>
    </div>
  {/if}

  <section class="ambience">
    <header class="head">
      <div class="info">
        <h3>{t('music.ambience')}</h3>
        <div class="faint">{t('music.ambienceAbout')} <Wind size={11} /></div>
      </div>
      {#if ms.ambience.length}
        <button class="btn" onclick={() => dispatch('music', 'toggleAmbience')}>
          {#if ms.ambiencePlaying}<Pause size={14} /> {t('music.mute')}{:else}<Play size={14} /> {t('music.turnOn')}{/if}
        </button>
        <button class="btn" onclick={() => dispatch('music', 'clearAmbience')}>{t('music.clear')}</button>
      {/if}
    </header>
    {#each ms.ambience as a (a.path)}
      <div class="loop">
        <span class="name" title={a.path}>{trackName(a.path)}</span>
        <Slider
          value={live.ambient[a.path] ?? a.volume}
          title={t('music.volumeShort')}
          oninput={(v) => (live.ambient[a.path] = v)}
          onchange={(v) => dispatch('music', 'setAmbientVolume', { path: a.path, value: v }).then(() => delete live.ambient[a.path])}
        />
        <button class="icon-btn" title={t('music.remove')} onclick={() => dispatch('music', 'toggleAmbient', { path: a.path })}><X size={14} /></button>
      </div>
    {/each}
  </section>
</div>

<style>
  .trash:hover {
    color: var(--danger);
  }
  .view {
    max-width: 760px;
    padding: 16px 20px 20px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0 0 2px;
    font-size: 18px;
  }
  h3 {
    margin: 0 0 2px;
    font-size: 14px;
  }
  .tracks {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    border-radius: var(--radius-s);
  }
  li:hover {
    background: var(--bg-hover);
  }
  li.now {
    color: var(--accent);
  }
  .track {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .num {
    width: 20px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .state {
    opacity: 0;
  }
  li:hover .state,
  li.now .state {
    opacity: 1;
  }
  .ambience {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .loop {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 200px 28px;
    align-items: center;
    gap: 12px;
    padding: 4px 0;
  }
  .empty {
    padding: 40px 0;
    text-align: center;
  }
</style>
