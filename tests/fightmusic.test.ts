// Fight music: the first round of a fight puts it on, the end of the fight brings back what played before.
import { describe, expect, it } from 'vitest';
import music from '../src/modules/music/main';
import type { MusicState } from '../src/modules/music/types';
import { ctx, run, tree } from './helpers';

const t = tree(['Curse/music/calm/a.mp3', 'Curse/music/calm/b.mp3', 'Curse/music/fight/x.mp3', 'Curse/music/fight/y.mp3', 'music/boss.mp3']);
const c = ctx(t);
const base = music.initialState as MusicState;
const hook = (s: MusicState, a: number, b: number, current: string | null = 'Curse') =>
  music.afterAction!(s, { initiative: { round: a }, adventures: { current } }, { initiative: { round: b }, adventures: { current } }, c);

const calm = (): MusicState => {
  let s = run(music, base, 'setBattle', { adventure: 'Curse', path: 'Curse/music/fight' }, c);
  s = run(music, s, 'playFolder', { folder: 'Curse/music/calm' }, c);
  return run(music, s, 'next', undefined, c); // b.mp3
};

describe('fight music', () => {
  it('starts with the first round and keeps what played', () => {
    const s = hook(calm(), 0, 1);
    expect(s.playlist).toBe('Curse/music/fight');
    expect(s.queue).toEqual(['Curse/music/fight/x.mp3', 'Curse/music/fight/y.mp3']);
    expect(s.playing).toBe(true);
    expect(s.beforeFight).toMatchObject({ playlist: 'Curse/music/calm', index: 1, playing: true });
  });

  it('a new round changes nothing', () => {
    const s = hook(calm(), 0, 1);
    expect(hook(s, 1, 2)).toBe(s);
  });

  it('brings back what played after the fight, from where it stopped', () => {
    const fight = hook(calm(), 0, 1);
    const s = hook(fight, 3, 0);
    expect(s.playlist).toBe('Curse/music/calm');
    expect(s.queue[s.index]).toBe('Curse/music/calm/b.mp3');
    expect(s.beforeFight).toBeNull();
    expect(s.resume).toBe(s.seq);
    expect(s.seq).toBeGreaterThan(fight.seq);
  });

  it('paused music comes back paused; silence comes back as silence', () => {
    const paused = run(music, calm(), 'playPause', undefined, c);
    const back = hook(hook(paused, 0, 1), 1, 0);
    expect(back.playing).toBe(false);
    expect(back.playlist).toBe('Curse/music/calm');

    const quiet = run(music, base, 'setBattle', { adventure: 'Curse', path: 'Curse/music/fight' }, c);
    const fight = hook(quiet, 0, 1);
    expect(fight.playing).toBe(true);
    const after = hook(fight, 1, 0);
    expect(after.queue).toEqual([]);
    expect(after.playing).toBe(false);
  });

  it('music the GM chose during the fight stays after it', () => {
    let s = hook(calm(), 0, 1);
    s = run(music, s, 'playTrack', { path: 'music/boss.mp3' }, c);
    expect(s.beforeFight).toBeNull();
    expect(hook(s, 2, 0)).toBe(s);
  });

  it('only the adventure that has fight music; one track works too', () => {
    expect(hook(calm(), 0, 1, null)).toEqual(calm());
    const s = run(music, base, 'setBattle', { adventure: '', path: 'music/boss.mp3' }, c);
    expect(hook(s, 0, 1, null).queue).toEqual(['music/boss.mp3']);
  });

  it('already playing it: nothing to come back to', () => {
    let s = run(music, base, 'setBattle', { adventure: 'Curse', path: 'Curse/music/fight' }, c);
    s = run(music, s, 'playFolder', { folder: 'Curse/music/fight' }, c);
    expect(hook(s, 0, 1)).toBe(s);
  });

  it('back now, before the fight ends', () => {
    const s = run(music, hook(calm(), 0, 1), 'fightBack', undefined, c);
    expect(s.playlist).toBe('Curse/music/calm');
    expect(s.beforeFight).toBeNull();
  });

  it('forgets fight music whose folder is gone; older saves get none', () => {
    const s = run(music, base, 'setBattle', { adventure: 'Curse', path: 'Curse/music/gone' }, c);
    expect(music.onTreeChange!(s, c).battle).toEqual({});
    const old = { ...base } as Partial<MusicState>;
    delete old.battle;
    expect(music.init!(old as MusicState, c).battle).toEqual({});
  });
});
