// Снимок экрана в сцену и включение сцены. Работает в окне управления через обычные действия модулей.
import { t } from '../../renderer/lib/i18n.svelte';
import { dispatch } from '../../renderer/lib/store.svelte';
import type { AppState } from '../../shared/types';
import { allFiles, fileKind, isLibraryAsset, prettyName, trackName } from '../../shared/vault';
import { playlistTitle } from '../music/ui/playlists';
import type { Part, Scene, SceneContent } from './types';
import { leftovers, shown, type Tray } from './tray';
import { isBuiltinSound } from '../../shared/sounds';
import { ROLL_RESULT } from '../../shared/rolltable';

// Что сейчас видят и слышат игроки.
export function capture(app: AppState): SceneContent {
  return {
    background: { path: app.scene.background, fit: app.scene.fit },
    map: { path: app.maps.current },
    portraits: { paths: [...app.portraits.onScreen] },
    handout: { path: app.handouts.current?.startsWith(ROLL_RESULT) ? null : app.handouts.current },
    music: { playlist: app.music.playing ? app.music.playlist : null, shuffle: app.music.shuffle },
    ambience: { loops: app.music.ambiencePlaying ? app.music.ambience.map((a) => ({ ...a })) : [] },
  };
}

// «Scene N» for a new scene: numbered within its adventure (each adventure starts with «Scene 1»), the first free number.
export function defaultSceneName(scenes: Scene[], adventure: string | null): string {
  const taken = new Set(scenes.filter((s) => (s.adventure ?? null) === adventure).map((s) => s.name));
  let n = taken.size + 1;
  for (let i = 1; i <= taken.size; i++) {
    if (!taken.has(t('scenes.defaultName', { n: i }))) {
      n = i;
      break;
    }
  }
  return t('scenes.defaultName', { n });
}

// Название новой сцены по её содержимому.
// Ничего не показано — по подборке.
export function suggestName(c: SceneContent, scenes: Scene[], adventure: string | null, tray?: Tray): string {
  const first = c.map.path ?? c.background.path ?? c.portraits.paths[0] ?? tray?.map[0] ?? tray?.background[0];
  if (first) return prettyName(first);
  return defaultSceneName(scenes, adventure);
}

// Файлы сцены, которых больше нет в хранилище.
export function missing(app: AppState, sc: Scene): string[] {
  const tree = app.vault.tree;
  if (!tree) return [];
  const files = new Set(allFiles(tree).map((f) => f.path));
  const used = [
    sc.include.background && sc.background.path,
    sc.include.map && sc.map.path,
    ...(sc.include.portraits ? sc.portraits.paths : []),
    sc.include.handout && sc.handout.path,
    ...(sc.include.ambience ? sc.ambience.loops.map((l) => l.path) : []),
  ].filter((p): p is string => !!p);
  return used.filter((p) => !files.has(p) && !isLibraryAsset(p) && !isBuiltinSound(p));
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function activate(app: AppState, sc: Scene) {
  const tree = app.vault.tree;
  const exists = new Set(tree ? allFiles(tree).map((f) => f.path) : []);
  const ok = (p: string | null) => (p && exists.has(p) ? p : null);
  const on = (part: Part) => sc.include[part];

  // Через затемнение: погасить, поменять, вернуть. Если экран уже погашен мастером, не трогаем.
  const black = app.scenes.throughBlack && !app.core.blackout;
  if (black) {
    await dispatch('core', 'toggleBlackout');
    await wait(450);
  }

  // What the previous scene showed and the new one doesn't change goes away (its portraits, handout, music…). Music on
  // pause and muted ambience count too: they would stay in the player otherwise.
  const now = { ...shown(app), music: app.music.playlist ? [app.music.playlist] : [], ambience: app.music.ambience.map((a) => a.path) };
  const gone = leftovers(app.scenes.scenes.find((x) => x.id === app.scenes.active), sc, now);

  // Сначала — какая сцена включена: показанное ею попадает в её подборку правой панели.
  await dispatch('scenes', 'markActive', { id: sc.id });
  const jobs: Promise<unknown>[] = [];
  if (gone.background === null) jobs.push(dispatch('scene', 'clear'));
  if (gone.map === null) jobs.push(dispatch('maps', 'clear'));
  if (gone.handout === null) jobs.push(dispatch('handouts', 'clear'));
  if (gone.portraits) jobs.push(dispatch('portraits', 'setOnScreen', { paths: gone.portraits }));
  if (gone.music === null) jobs.push(dispatch('music', 'clear'));
  if (gone.ambience) {
    const stay = gone.ambience;
    jobs.push(dispatch('music', 'setAmbience', { loops: app.music.ambience.filter((a) => stay.includes(a.path)).map((a) => ({ ...a })) }));
  }
  if (on('background')) jobs.push(dispatch('scene', 'set', { path: ok(sc.background.path), fit: sc.background.fit }));
  if (on('map')) {
    const p = ok(sc.map.path);
    jobs.push(p ? dispatch('maps', 'show', { path: p }) : dispatch('maps', 'clear'));
  }
  if (on('portraits')) jobs.push(dispatch('portraits', 'setOnScreen', { paths: sc.portraits.paths.filter((p) => exists.has(p) || isLibraryAsset(p)) }));
  if (on('handout')) jobs.push(dispatch('handouts', 'set', { path: ok(sc.handout.path) }));
  if (on('ambience')) jobs.push(dispatch('music', 'setAmbience', { loops: sc.ambience.loops.filter((l) => exists.has(l.path) || isBuiltinSound(l.path)) }));
  if (on('music')) jobs.push(applyMusic(app, sc.music));
  await Promise.all(jobs);

  if (black) {
    await wait(150);
    await dispatch('core', 'toggleBlackout');
  }
}

async function applyMusic(app: AppState, m: Scene['music']) {
  if (!m.playlist) return app.music.playing ? dispatch('music', 'stop') : undefined;
  // Этот плейлист уже играет — не перезапускаем.
  if (app.music.playing && app.music.playlist === m.playlist) return;
  if (fileKind(m.playlist) === 'audio') return dispatch('music', 'playTrack', { path: m.playlist });
  await dispatch('music', 'setShuffle', { value: m.shuffle });
  await dispatch('music', 'playFolder', { folder: m.playlist });
}

// Кратко, что в части сцены: для списка частей в редакторе.
export function describe(app: AppState, sc: Scene, part: Part): string {
  switch (part) {
    case 'background':
      return sc.background.path ? `${prettyName(sc.background.path)} · ${sc.background.fit === 'cover' ? t('scenes.fill') : t('scenes.fit')}` : t('scenes.noBackground');
    case 'map':
      return sc.map.path ? prettyName(sc.map.path) : t('scenes.noMap');
    case 'portraits':
      return sc.portraits.paths.length
        ? sc.portraits.paths.map((p) => app.portraits.names[p] ?? prettyName(p)).join(', ')
        : t('scenes.nobody');
    case 'handout':
      return sc.handout.path ? prettyName(sc.handout.path) : t('scenes.noHandout');
    case 'music':
      return sc.music.playlist !== null
        ? `${playlistTitle(app.vault.tree, app.vault.name, sc.music.playlist)}${sc.music.shuffle ? ' · ' + t('scenes.shuffled') : ''}`
        : t('scenes.silence');
    case 'ambience':
      return sc.ambience.loops.length ? sc.ambience.loops.map((l) => trackName(l.path)).join(', ') : t('scenes.noAmbience');
  }
}

export const partTitle = (p: Part) => t(`scenes.part.${p}`);
