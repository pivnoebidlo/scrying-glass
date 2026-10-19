import { describe, expect, it } from 'vitest';
import { nextGame, occKey, occurrences, parseKey, reminderDue, tally, type Game } from '../src/shared/schedule';

const at = (y: number, m: number, d: number, h = 19) => new Date(y, m - 1, d, h, 0).getTime();
const game = (over: Partial<Game> = {}): Game => ({ id: 'g1', title: '', start: at(2026, 10, 22), minutes: 240, repeat: 'week', remind: true, ...over });

describe('расписание', () => {
  it('повторы раз в неделю и в две, пропуски и «до»', () => {
    const g = game({ skip: [at(2026, 10, 29)] });
    const list = occurrences([g], at(2026, 10, 1), at(2026, 11, 20));
    expect(list.map((o) => new Date(o.start).getDate())).toEqual([22, 5, 12, 19]);
    const two = occurrences([game({ repeat: '2weeks', until: at(2026, 11, 19, 0) })], at(2026, 10, 1), at(2026, 12, 31));
    expect(two.map((o) => new Date(o.start).getDate())).toEqual([22, 5, 19]);
    expect(occurrences([game({ repeat: 'none' })], at(2026, 10, 1), at(2026, 12, 31))).toHaveLength(1);
  });

  it('время держится через переход на зимнее время', () => {
    const list = occurrences([game({ start: at(2026, 3, 20) })], at(2026, 3, 1), at(2026, 4, 30));
    for (const o of list) expect(new Date(o.start).getHours()).toBe(19);
  });

  it('ближайшая — идущая сейчас или первая впереди; ключ туда и обратно', () => {
    const g = game();
    expect(nextGame([g], at(2026, 10, 22, 21))!.start).toBe(at(2026, 10, 22));
    expect(nextGame([g], at(2026, 10, 23, 12))!.start).toBe(at(2026, 10, 29));
    const k = occKey(g, at(2026, 10, 29));
    expect(parseKey(k)).toEqual({ id: 'g1', start: at(2026, 10, 29) });
  });

  it('напоминания: за день, за два часа, после начала — нет; отправленное не повторяется', () => {
    const o = occurrences([game()], at(2026, 10, 1), at(2026, 10, 23))[0]!;
    expect(reminderDue(o, at(2026, 10, 20))).toBeNull();
    expect(reminderDue(o, at(2026, 10, 21, 20))).toBe('day');
    expect(reminderDue(o, at(2026, 10, 21, 20), ['day'])).toBeNull();
    expect(reminderDue(o, at(2026, 10, 22, 18), ['day'])).toBe('soon');
    expect(reminderDue(o, at(2026, 10, 22, 18), [])).toBe('soon');
    expect(reminderDue(o, at(2026, 10, 22, 20))).toBeNull();
    expect(reminderDue({ ...o, game: { ...o.game, remind: false } }, at(2026, 10, 22, 18))).toBeNull();
  });

  it('ответы по порядку', () => {
    expect(tally({ a: { name: 'Ann', answer: 'yes', at: 2 }, b: { name: 'Bob', answer: 'no', at: 1 }, c: { name: 'Cat', answer: 'yes', at: 1 } })).toEqual({ yes: ['Cat', 'Ann'], maybe: [], no: ['Bob'] });
  });
});

describe('расписание: ядро', () => {
  it('ответ кнопкой записывается к игре; ушедшая игра — сообщение', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const { setLang } = await import('../src/shared/i18n');
    setLang('ru');
    const { initSchedule, saveGames, pressed, readSchedule, announce, stopSchedule } = await import('../src/main/schedule');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-sched-'));
    try {
      initSchedule({ file: path.join(dir, 'schedule.json'), changed: () => {}, adventureName: () => '' });
      stopSchedule();
      const g = game({ start: at(2030, 1, 3) });
      saveGames([g]);
      const key = occKey(g, at(2030, 1, 3));
      expect(await pressed(`rsvp:${key}:yes`, { id: 7, name: 'Гилберт' })).toBe('Записал: будете');
      expect(readSchedule().answers[key]!['7']).toMatchObject({ name: 'Гилберт', answer: 'yes' });
      expect(await pressed(`rsvp:${occKey({ id: 'zz' }, 1)}:no`, { id: 7, name: 'x' })).toBe('Этой игры больше нет в расписании.');
      expect((await announce(key)).error).toMatch(/нет включённых чатов/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
