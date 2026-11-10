// Calendars to start from, in the language of the interface: their names become data of the GM's calendar.
import type { Calendar } from './calendar';

export const PRESETS = ['fantasy', 'earth', 'simple'] as const;
export type Preset = (typeof PRESETS)[number];

const FANTASY = {
  en: {
    months: ['Frostmoot', 'Thawing', 'Seedtide', 'Blossom', 'Greenleaf', 'Highsun', 'Embertide', 'Harvest', 'Goldfall', 'Mistmoon', 'Deepfrost', 'Longnight'],
    weekdays: ['Moonday', 'Ironday', 'Windsday', 'Thornday', 'Hearthday', 'Starday', 'Sunday'],
    moons: ['White Moon', 'Red Moon'],
    holidays: [['Thaw Feast', 1, 1], ['Midsummer', 6, 15], ['Harvest Home', 8, 30], ['Night of Lanterns', 12, 30]] as const,
    era: 'AF',
  },
  ru: {
    months: ['Стужень', 'Капель', 'Сеятель', 'Цветень', 'Зеленец', 'Солнцестой', 'Жарень', 'Жатва', 'Златопад', 'Туманник', 'Студень', 'Долгоночь'],
    of: ['стуженя', 'капели', 'сеятеля', 'цветня', 'зеленца', 'солнцестоя', 'жарня', 'жатвы', 'златопада', 'туманника', 'студеня', 'долгоночи'],
    weekdays: ['Лунник', 'Железник', 'Ветреник', 'Терновник', 'Очажник', 'Звездник', 'Солнечник'],
    moons: ['Белая луна', 'Красная луна'],
    holidays: [['Праздник оттепели', 1, 1], ['Солнцеворот', 6, 15], ['Дожинки', 8, 30], ['Ночь фонарей', 12, 30]] as const,
    era: 'от Основания',
  },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function presetCalendar(preset: Preset, lang: string): Calendar {
  const ru = lang === 'ru';
  if (preset === 'fantasy') {
    const f = ru ? FANTASY.ru : FANTASY.en;
    return {
      months: f.months.map((name, i) => ({ name, days: 30, ...('of' in f ? { of: f.of[i]! } : {}) })),
      weekdays: [...f.weekdays],
      year: 1012,
      month: 0,
      day: 1,
      era: f.era,
      moons: [
        { name: f.moons[0]!, cycle: 30, offset: 0 },
        { name: f.moons[1]!, cycle: 47, offset: 12 },
      ],
      holidays: f.holidays.map(([name, month, day]) => ({ name, month: month - 1, day })),
    };
  }
  if (preset === 'earth') {
    // Month and weekday names from the system, standalone forms («январь», «понедельник»).
    const month = new Intl.DateTimeFormat(lang, { month: 'long' });
    // In a date the month may change its form: «15 января».
    const inDate = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' });
    const weekday = new Intl.DateTimeFormat(lang, { weekday: 'long' });
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return {
      months: days.map((d, i) => {
        const name = cap(month.formatToParts(new Date(2001, i, 1)).find((p) => p.type === 'month')?.value ?? String(i + 1));
        const of = inDate.formatToParts(new Date(2001, i, 15)).find((p) => p.type === 'month')?.value;
        return { name, days: d, ...(of && of.toLowerCase() !== name.toLowerCase() ? { of } : {}) };
      }),
      // 1 January 2001 was a Monday.
      weekdays: Array.from({ length: 7 }, (_, i) => cap(weekday.format(new Date(2001, 0, 1 + i)))),
      year: 1,
      month: 0,
      day: 1,
      moons: [{ name: ru ? 'Луна' : 'Moon', cycle: 29.53, offset: 0 }],
    };
  }
  return {
    months: Array.from({ length: 12 }, (_, i) => ({ name: ru ? `Месяц ${i + 1}` : `Month ${i + 1}`, days: 30 })),
    year: 1,
    month: 0,
    day: 1,
  };
}
