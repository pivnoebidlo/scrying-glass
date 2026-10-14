import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import timer from '../src/modules/timer/main';
import { clock, timeLeft, type TimerState } from '../src/modules/timer/types';
import { run } from './helpers';

const act = (s: TimerState, a: string, p?: unknown) => run(timer, s, a, p);

describe('таймер', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
  });
  afterEach(() => vi.useRealTimers());

  it('идёт, встаёт на паузу и продолжает с того же места', () => {
    let s = act(timer.initialState, 'start', { duration: 60_000, label: ' Пока горит факел ' });
    expect([s.active, s.label, timeLeft(s, Date.now())]).toEqual([true, 'Пока горит факел', 60_000]);
    vi.advanceTimersByTime(20_000);
    s = act(s, 'pause');
    expect(s.remaining).toBe(40_000);
    vi.advanceTimersByTime(300_000); // на паузе время стоит
    expect(timeLeft(s, Date.now())).toBe(40_000);
    s = act(s, 'resume');
    vi.advanceTimersByTime(10_000);
    expect(timeLeft(s, Date.now())).toBe(30_000);
  });

  it('добавка времени: к идущему, к вышедшему (снова идёт), убавить не ниже нуля', () => {
    let s = act(timer.initialState, 'start', { duration: 30_000 });
    s = act(s, 'add', { ms: 60_000 });
    expect([timeLeft(s, Date.now()), s.duration]).toEqual([90_000, 90_000]);
    vi.advanceTimersByTime(100_000);
    expect(timeLeft(s, Date.now())).toBe(0);
    s = act(s, 'add', { ms: 60_000 });
    expect([s.endsAt !== null, timeLeft(s, Date.now())]).toEqual([true, 60_000]);
    s = act(s, 'add', { ms: -120_000 });
    expect(timeLeft(s, Date.now())).toBe(0);
    s = act(s, 'stop');
    expect(s.active).toBe(false);
  });

  it('запись времени', () => {
    expect([clock(65_000), clock(999), clock(3_725_000), clock(0)]).toEqual(['1:05', '0:01', '1:02:05', '0:00']);
  });
});
