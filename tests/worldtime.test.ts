import { describe, expect, it } from 'vitest';
import worldtime from '../src/modules/worldtime/main';
import { clockOf, minutesOf, nextMorning, partOf, START, type WorldTimeState } from '../src/modules/worldtime/types';
import { renameAdventurePaths } from '../src/shared/adventures';
import { run } from './helpers';

const act = (s: WorldTimeState, a: string, p?: unknown) => run(worldtime, s, a, p);
const S0 = worldtime.initialState;

describe('time in the game world', () => {
  it('minutes since day 1 are a day and a time; parts of the day', () => {
    expect(clockOf(0)).toEqual({ day: 1, hour: 0, minute: 0 });
    expect(clockOf(1500)).toEqual({ day: 2, hour: 1, minute: 0 });
    expect(minutesOf(3, 14, 20)).toBe(2 * 1440 + 14 * 60 + 20);
    expect(clockOf(minutesOf(3, 14, 20))).toEqual({ day: 3, hour: 14, minute: 20 });
    expect([4, 5, 11, 12, 16, 17, 21, 22].map(partOf)).toEqual(['night', 'morning', 'morning', 'day', 'day', 'evening', 'evening', 'night']);
  });

  it('until morning: 6:00 of the next day, or of this one before 6', () => {
    expect(nextMorning(minutesOf(1, 22, 0))).toBe(minutesOf(2, 6, 0));
    expect(nextMorning(minutesOf(2, 3, 30))).toBe(minutesOf(2, 6, 0));
    expect(nextMorning(minutesOf(2, 6, 0))).toBe(minutesOf(3, 6, 0));
  });

  it('each adventure has its own time; it starts on the morning of day 1 and never goes before it', () => {
    let s = act(S0, 'advance', { adventure: 'Pumpkins', minutes: 60 });
    expect(s.byAdventure['Pumpkins']).toEqual({ minutes: START + 60, shown: false });
    s = act(s, 'advance', { adventure: 'Pumpkins', minutes: 8 * 60 });
    s = act(s, 'untilMorning', { adventure: 'Pumpkins' });
    expect(clockOf(s.byAdventure['Pumpkins']!.minutes)).toEqual({ day: 2, hour: 6, minute: 0 });
    s = act(s, 'advance', { adventure: 'Pumpkins', minutes: -99999 });
    expect(s.byAdventure['Pumpkins']!.minutes).toBe(0);
    s = act(s, 'advance', { adventure: 'Pumpkins', minutes: NaN });
    expect(s.byAdventure['Pumpkins']!.minutes).toBe(0);

    s = act(s, 'show', { adventure: null, shown: true });
    expect(s.byAdventure['']).toEqual({ minutes: START, shown: true });
    s = act(s, 'reset', { adventure: 'Pumpkins' });
    expect(Object.keys(s.byAdventure)).toEqual(['']);
  });

  it('moves with a renamed adventure', () => {
    const s = act(S0, 'set', { adventure: 'Pumpkins', minutes: 100 });
    expect(renameAdventurePaths(s, 'Pumpkins', 'Pumpkin festival').byAdventure).toEqual({ 'Pumpkin festival': { minutes: 100, shown: false } });
  });
});
