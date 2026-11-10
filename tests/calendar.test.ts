import { describe, expect, it } from 'vitest';
import { dateOf, dateText, holidaysOfText, monthsOfText, moonsOfText, phaseOf, textOfHolidays, textOfMonths, validCalendar, type Calendar } from '../src/modules/worldtime/calendar';
import { presetCalendar, PRESETS } from '../src/modules/worldtime/presets';
import worldtime from '../src/modules/worldtime/main';
import type { WorldTimeState } from '../src/modules/worldtime/types';
import { renameAdventurePaths } from '../src/shared/adventures';
import { run } from './helpers';

const cal: Calendar = {
  months: [{ name: 'Hammer', days: 30 }, { name: 'Alturiak', days: 30 }, { name: 'Midwinter', days: 1 }],
  weekdays: ['One', 'Two', 'Three'],
  year: 1492,
  month: 1,
  day: 29,
  era: 'DR',
  moons: [{ name: 'Selûne', cycle: 8, offset: 0 }],
  holidays: [{ month: 2, day: 1, name: 'Midwinter' }],
};

describe('the calendar of a world', () => {
  it('day 1 is the start; days run over months and years', () => {
    expect(dateText(cal, dateOf(cal, 1))).toBe('29 Alturiak 1492 DR');
    const d3 = dateOf(cal, 3);
    expect([d3.monthName, d3.day, d3.holidays]).toEqual(['Midwinter', 1, ['Midwinter']]);
    expect(dateText(cal, dateOf(cal, 4))).toBe('1 Hammer 1493 DR');
    expect(dateOf(cal, 1 + 61).year).toBe(1493);
  });
  it('weekdays and moon phases go round from day 1', () => {
    expect([1, 2, 3, 4].map((d) => dateOf(cal, d).weekday)).toEqual(['One', 'Two', 'Three', 'One']);
    expect([0, 2, 4, 6, 8].map((e) => phaseOf(cal.moons![0]!, e))).toEqual(['new', 'firstQuarter', 'full', 'lastQuarter', 'new']);
    expect(phaseOf({ name: 'M', cycle: 29.53, offset: 0 }, 15)).toBe('full');
  });
  it('the GM writes it as text', () => {
    const months = monthsOfText('Hammer | 30\n\nbad line\nAlturiak|30\nZero | 0');
    expect(months).toEqual([{ name: 'Hammer', days: 30 }, { name: 'Alturiak', days: 30 }]);
    expect(textOfMonths(months)).toBe('Hammer | 30\nAlturiak | 30');
    expect(moonsOfText('Selûne | 29,5 | 3\nNo cycle')).toEqual([{ name: 'Selûne', cycle: 29.5, offset: 3 }]);
    const h = holidaysOfText('Feast | hammer | 2\nLate | 2 | 30\nNope | 2 | 31', months);
    expect(h).toEqual([{ name: 'Feast', month: 0, day: 2 }, { name: 'Late', month: 1, day: 30 }]);
    expect(textOfHolidays(h, months)).toBe('Feast | Hammer | 2\nLate | Alturiak | 30');
  });
  it('a stranger\'s calendar keeps only what makes sense', () => {
    expect(validCalendar({ months: [] })).toBeNull();
    const c = validCalendar({ months: [{ name: 'A', days: 9999 }, { name: '', days: 3 }], month: 7, day: 999, holidays: [{ month: 0, day: 500, name: 'x' }], moons: [{ name: 'm', cycle: 0 }] })!;
    expect(c).toEqual({ months: [{ name: 'A', days: 400 }], year: 1, month: 0, day: 400 });
  });
  it('every sample is a valid calendar, in both languages', () => {
    for (const p of PRESETS) for (const lang of ['en', 'ru']) expect(validCalendar(presetCalendar(p, lang))).toEqual(presetCalendar(p, lang));
    expect(presetCalendar('earth', 'ru').months[0]!.name).toBe('Январь');
    expect(presetCalendar('earth', 'ru').weekdays![0]).toBe('Понедельник');
  });
  it('an adventure keeps its calendar apart from its time, and a rename moves it', () => {
    let s = run(worldtime, { byAdventure: {}, place: 'top-left' } as WorldTimeState, 'setCalendar', { adventure: 'A', calendar: cal });
    s = run(worldtime, s, 'reset', { adventure: 'A' });
    expect(s.calendars?.['A']?.year).toBe(1492);
    expect(Object.keys(renameAdventurePaths(s, 'A', 'B').calendars!)).toEqual(['B']);
    s = run(worldtime, s, 'setCalendar', { adventure: 'A', calendar: null });
    expect(s.calendars).toEqual({});
  });
});

describe('a month in a date', () => {
  it('may have another form: «15 января»', () => {
    const months = monthsOfText('Январь / января | 31\nФевраль|28');
    expect(months).toEqual([{ name: 'Январь', of: 'января', days: 31 }, { name: 'Февраль', days: 28 }]);
    expect(textOfMonths(months)).toBe('Январь / января | 31\nФевраль | 28');
    const earth = presetCalendar('earth', 'ru');
    expect(dateText(earth, dateOf(earth, 15))).toBe('15 января 1');
    expect(dateOf(earth, 15).monthName).toBe('Январь');
    expect(presetCalendar('earth', 'en').months[0]).toEqual({ name: 'January', days: 31 });
  });
});
it('the fantasy sample speaks Russian dates', () => {
  const f = presetCalendar('fantasy', 'ru');
  expect(dateText(f, dateOf(f, 45))).toBe('15 капели 1012 от Основания');
});
