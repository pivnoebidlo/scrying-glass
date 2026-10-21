import { describe, expect, it } from 'vitest';
import { isFull, nextGame, occKey, occurrences, parseKey, reminderDue, roster, seatsOf, tally, type Game } from '../src/shared/schedule';

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

describe('расписание: места и резерв', () => {
  const r = (answer: 'yes' | 'maybe' | 'no', at: number, name = String(at)) => ({ name, answer, at });
  it('первые «участвую» до числа мест участвуют, лишние — в резерве впереди выбравших резерв', () => {
    const answers = { a: r('yes', 1, 'Ann'), b: r('maybe', 2, 'Bob'), c: r('yes', 3, 'Cat'), d: r('yes', 4, 'Dan'), e: r('no', 5, 'Eve') };
    const x = roster(answers, 2);
    expect(x.going.map((e) => e.name)).toEqual(['Ann', 'Cat']);
    expect(x.reserve.map((e) => e.name)).toEqual(['Dan', 'Bob']);
    expect(x.out.map((e) => e.id)).toEqual(['e']);
    expect(isFull(answers, 2)).toBe(true);
    expect(isFull(answers, 5)).toBe(false);
    expect(isFull(answers)).toBe(false);
    expect(tally(answers, 2)).toEqual({ yes: ['Ann', 'Cat'], maybe: ['Dan', 'Bob'], no: ['Eve'] });
  });

  it('полная игра не берёт новых «участвую» (окно с объяснением), резерв и отказ — можно', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const { setLang } = await import('../src/shared/i18n');
    setLang('ru');
    const { initSchedule, saveGames, pressed, readSchedule, stopSchedule } = await import('../src/main/schedule');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-sched-'));
    try {
      initSchedule({ file: path.join(dir, 'schedule.json'), changed: () => {}, adventureName: () => '', imageFile: () => null });
      stopSchedule();
      const g = game({ start: at(2030, 1, 3), seats: 1 });
      saveGames([g]);
      const key = occKey(g, at(2030, 1, 3));
      expect(await pressed(`rsvp:${key}:yes`, { id: 1, name: 'Ann' })).toBe('Записал: вы участвуете');
      expect(await pressed(`rsvp:${key}:yes`, { id: 2, name: 'Bob' })).toEqual({ text: expect.stringMatching(/Все места заняты/), alert: true });
      expect(readSchedule().answers[key]!['2']).toBeUndefined();
      expect(await pressed(`rsvp:${key}:maybe`, { id: 2, name: 'Bob' })).toBe('Записал: вы в резерве');
      // Ann cancels: the reserve is told (without a bot nothing goes, and nothing breaks), Bob can take the seat.
      expect(await pressed(`rsvp:${key}:no`, { id: 1, name: 'Ann' })).toBe('Записал: не сможете');
      expect(await pressed(`rsvp:${key}:yes`, { id: 2, name: 'Bob' })).toBe('Записал: вы участвуете');
      expect(roster(readSchedule().answers[key], 1).going.map((e) => e.name)).toEqual(['Bob']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('в анонсе — участники из мест, резерв; смена числа мест — изменение анонса', async () => {
    const { setLang } = await import('../src/shared/i18n');
    setLang('ru');
    const { announcementText, announceDiff } = await import('../src/shared/schedule');
    const g = game({ title: 'Игра', start: at(2026, 10, 22, 19), seats: 3 });
    const text = announcementText({ game: g, start: g.start, key: 'k' }, { a: r('yes', 1, 'Ann'), b: r('maybe', 2, 'Bob') }, 'ru');
    expect(text.split('\n\n').at(-1)).toBe('✅ Участвуют (1/3): Ann\n🕓 Резерв: Bob');
    expect(announcementText({ game: g, start: g.start, key: 'k' }, undefined, 'ru').split('\n\n').at(-1)).toBe('✅ Участвуют (0/3): —');
    expect(announceDiff(g, { ...g, seats: 4 })).toEqual(['seats']);
  });

  it('без числа мест лимит — верхнее число из «Количество участников»', () => {
    expect(seatsOf({ players: '1-2' })).toBe(2);
    expect(seatsOf({ players: '4–5 человек' })).toBe(5);
    expect(seatsOf({ players: '6' })).toBe(6);
    expect(seatsOf({ players: '4', seats: 3 })).toBe(3);
    expect(seatsOf({ players: 'кто придёт' })).toBeUndefined();
    expect(seatsOf({})).toBeUndefined();
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
      initSchedule({ file: path.join(dir, 'schedule.json'), changed: () => {}, adventureName: () => '', imageFile: () => null });
      stopSchedule();
      const g = game({ start: at(2030, 1, 3) });
      saveGames([g]);
      const key = occKey(g, at(2030, 1, 3));
      expect(await pressed(`rsvp:${key}:yes`, { id: 7, name: 'Гилберт' })).toBe('Записал: вы участвуете');
      expect(readSchedule().answers[key]!['7']).toMatchObject({ name: 'Гилберт', answer: 'yes' });
      expect(await pressed(`rsvp:${occKey({ id: 'zz' }, 1)}:no`, { id: 7, name: 'x' })).toBe('Этой игры больше нет в расписании.');
      expect((await announce(key)).error).toMatch(/нет включённых чатов/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('расписание: анонс', () => {
  it('анонс как в примере: только заполненные строки, вид и название, описание с оформлением', async () => {
    const { setLang } = await import('../src/shared/i18n');
    setLang('ru');
    const { announcementText } = await import('../src/shared/schedule');
    const g = game({ start: at(2026, 10, 18, 10), minutes: 240, repeat: 'none', title: 'Без дураков', kind: 'oneshot', players: '4–5', price: 'Сколько не жалко', gm: '@weesps', place: 'бар Небелка', system: 'D&D 5e (2014)', level: '3', description: 'В деревнях **странный** недуг.' });
    const text = announcementText({ game: g, start: g.start, key: 'k' }, { a: { name: 'Ann', answer: 'yes', at: 1 } }, 'ru');
    expect(text).toBe(
      [
        '📅 18.10.2026 (вс)\n🕙 10:00–14:00\n👥 Количество участников: 4–5\n💰 Цена: Сколько не жалко\n💬 Мастер: @weesps\n📍 Адрес: бар Небелка\n🎲 Система: D&amp;D 5e (2014)\n⚔️ Уровень персонажей: 3',
        '📌 Ваншот «Без дураков»',
        '📝 В деревнях <b>странный</b> недуг.',
        '✅ Участвуют (1/5): Ann',
      ].join('\n\n')
    );
    const bare = announcementText({ game: game({ title: 'Игра', start: at(2026, 10, 22, 19) }), start: at(2026, 10, 22, 19), key: 'k' }, undefined, 'ru');
    expect(bare).toBe('📅 22.10.2026 (чт)\n🕖 19:00–23:00\n\n📌 <b>Игра</b>');
  });

  it('циферблат по времени, полчаса — свой', async () => {
    const { clockEmoji } = await import('../src/shared/schedule');
    expect(clockEmoji(new Date(2026, 0, 1, 10, 30).getTime())).toBe('🕥');
    expect(clockEmoji(new Date(2026, 0, 1, 0, 0).getTime())).toBe('🕛');
    expect(clockEmoji(new Date(2026, 0, 1, 18, 50).getTime())).toBe('🕖');
  });

  it('что изменилось и сообщение об этом; сдвиг времени уносит ответы и анонсы', async () => {
    const { announceDiff, changesText, rekey, EMPTY_SCHEDULE } = await import('../src/shared/schedule');
    const before = game({ place: 'бар', price: '500' });
    const after = { ...before, place: 'клуб', price: '', start: before.start + 3600000 };
    expect(announceDiff(before, after)).toEqual(['start', 'price', 'place']);
    expect(announceDiff(before, { ...before })).toEqual([]);
    const msg = changesText({ game: after, start: after.start, key: 'k' }, ['place', 'price'], 'ru');
    expect(msg).toContain('📍 Адрес: клуб');
    expect(msg).toContain('Цена: больше нет');
    const k = occKey(before, at(2026, 10, 29));
    const data = { ...EMPTY_SCHEDULE, answers: { [k]: { a: { name: 'Ann', answer: 'yes' as const, at: 1 } } }, reminded: { [k]: ['day' as const] } };
    const moved = rekey(data, before, after);
    const nk = occKey(after, at(2026, 10, 29) + 3600000);
    expect(Object.keys(moved.answers)).toEqual([nk]);
    expect(moved.reminded).toEqual({});
  });
});
