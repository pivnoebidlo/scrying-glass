// Weather generator: a few days of weather for a terrain and a season. Pure functions; the words are in the
// dictionary (weather.*), so a day is codes, not text. Days follow each other: the temperature drifts around the
// season's mean, rain and wind tend to last.

export const TERRAINS = ['forest', 'plains', 'city', 'coast', 'mountains', 'swamp', 'jungle', 'desert', 'arctic', 'underground'] as const;
export type Terrain = (typeof TERRAINS)[number];
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export type Sky = 'clear' | 'cloudy' | 'overcast' | 'fog';
export type Precip = 'none' | 'light' | 'heavy';
export type PrecipKind = 'rain' | 'snow' | 'sleet' | 'sand';
export type Wind = 'calm' | 'breeze' | 'strong' | 'gale';
// D&D weather rules (SRD): extreme cold and heat, strong wind, heavy precipitation, fog.
export type Effect = 'extremeCold' | 'extremeHeat' | 'strongWind' | 'heavyPrecip' | 'fog' | 'sandstorm';

export interface Day {
  // Degrees Celsius.
  temp: number;
  sky: Sky;
  precip: Precip;
  kind: PrecipKind;
  storm: boolean;
  wind: Wind;
  // A rare event: an index into weather.event.<terrain>.<n> (the dictionary has a few per terrain).
  event: number | null;
}

interface Climate {
  // Mean day temperature by season, °C.
  mean: Record<Season, number>;
  // How much a day can differ.
  spread: number;
  // Chance of rain/snow on a day, by season.
  wet: Record<Season, number>;
  fog: number;
  // 0 — calm place, 1 — windy.
  windy: number;
}

const CLIMATE: Record<Terrain, Climate> = {
  forest: { mean: { spring: 10, summer: 21, autumn: 9, winter: -4 }, spread: 5, wet: { spring: 0.4, summer: 0.3, autumn: 0.45, winter: 0.35 }, fog: 0.15, windy: 0.2 },
  plains: { mean: { spring: 11, summer: 24, autumn: 10, winter: -5 }, spread: 6, wet: { spring: 0.35, summer: 0.25, autumn: 0.35, winter: 0.3 }, fog: 0.08, windy: 0.6 },
  city: { mean: { spring: 12, summer: 23, autumn: 11, winter: -2 }, spread: 5, wet: { spring: 0.35, summer: 0.3, autumn: 0.4, winter: 0.3 }, fog: 0.1, windy: 0.3 },
  coast: { mean: { spring: 11, summer: 20, autumn: 13, winter: 3 }, spread: 4, wet: { spring: 0.4, summer: 0.3, autumn: 0.5, winter: 0.45 }, fog: 0.2, windy: 0.8 },
  mountains: { mean: { spring: 2, summer: 13, autumn: 2, winter: -12 }, spread: 7, wet: { spring: 0.45, summer: 0.35, autumn: 0.45, winter: 0.45 }, fog: 0.2, windy: 0.9 },
  swamp: { mean: { spring: 13, summer: 25, autumn: 13, winter: 3 }, spread: 4, wet: { spring: 0.5, summer: 0.45, autumn: 0.5, winter: 0.4 }, fog: 0.35, windy: 0.1 },
  jungle: { mean: { spring: 27, summer: 29, autumn: 27, winter: 25 }, spread: 3, wet: { spring: 0.6, summer: 0.75, autumn: 0.6, winter: 0.4 }, fog: 0.2, windy: 0.1 },
  desert: { mean: { spring: 28, summer: 40, autumn: 27, winter: 15 }, spread: 6, wet: { spring: 0.05, summer: 0.02, autumn: 0.05, winter: 0.1 }, fog: 0, windy: 0.6 },
  arctic: { mean: { spring: -15, summer: 2, autumn: -12, winter: -30 }, spread: 7, wet: { spring: 0.3, summer: 0.3, autumn: 0.35, winter: 0.3 }, fog: 0.15, windy: 0.8 },
  underground: { mean: { spring: 12, summer: 12, autumn: 12, winter: 12 }, spread: 1, wet: { spring: 0, summer: 0, autumn: 0, winter: 0 }, fog: 0, windy: 0 },
};

// How many rare events each terrain has in the dictionary (weather.event.<terrain>.0…).
export const EVENTS: Record<Terrain, number> = {
  forest: 4, plains: 4, city: 4, coast: 4, mountains: 4, swamp: 4, jungle: 4, desert: 4, arctic: 4, underground: 4,
};

type Random = () => number;
const gauss = (r: Random) => (r() + r() + r() - 1.5) / 1.5;

export interface WeatherOptions {
  terrain: Terrain;
  season: Season;
  days: number;
}

export function generateWeather(o: WeatherOptions, r: Random = Math.random): Day[] {
  const c = CLIMATE[o.terrain];
  const mean = c.mean[o.season];
  const out: Day[] = [];
  let temp = mean + gauss(r) * c.spread;
  let wetYesterday = false;
  for (let i = 0; i < Math.max(1, Math.min(o.days, 14)); i++) {
    if (i > 0) temp = mean + 0.6 * (temp - mean) + gauss(r) * c.spread * 0.7;
    const t = Math.round(temp);
    if (o.terrain === 'underground') {
      out.push({ temp: t, sky: 'clear', precip: 'none', kind: 'rain', storm: false, wind: 'calm', event: r() < 0.15 ? Math.floor(r() * EVENTS.underground) : null });
      continue;
    }
    // Rain tends to last: a wet day makes the next one wetter.
    const rainy: boolean = r() < Math.min(0.9, c.wet[o.season] + (wetYesterday ? 0.2 : 0));
    wetYesterday = rainy;
    const heavy = rainy && r() < 0.3;
    const kind: PrecipKind = o.terrain === 'desert' ? (heavy || r() < 0.5 ? 'sand' : 'rain') : t <= -1 ? 'snow' : t <= 2 ? 'sleet' : 'rain';
    const fog = !rainy && r() < c.fog;
    const sky: Sky = fog ? 'fog' : rainy ? (heavy ? 'overcast' : r() < 0.5 ? 'overcast' : 'cloudy') : r() < 0.45 ? 'clear' : r() < 0.6 ? 'cloudy' : 'overcast';
    const w = r() * (0.6 + c.windy) + (heavy ? 0.3 : 0) + (kind === 'sand' && rainy ? 0.6 : 0);
    const wind: Wind = fog ? 'calm' : w < 0.35 ? 'calm' : w < 0.95 ? 'breeze' : w < 1.35 ? 'strong' : 'gale';
    out.push({
      temp: t,
      sky,
      precip: rainy ? (heavy ? 'heavy' : 'light') : 'none',
      kind,
      // A thunderstorm: heavy rain in a warm season.
      storm: heavy && kind === 'rain' && t >= 12 && r() < 0.6,
      wind,
      event: r() < 0.06 ? Math.floor(r() * EVENTS[o.terrain]) : null,
    });
  }
  return out;
}

// SRD weather rules that apply to a day (D&D 5e): ≤ −18 °C (0 °F) — extreme cold, ≥ 38 °C (100 °F) — extreme heat.
export function effectsOf(d: Day): Effect[] {
  const out: Effect[] = [];
  if (d.temp <= -18) out.push('extremeCold');
  if (d.temp >= 38) out.push('extremeHeat');
  if (d.precip !== 'none' && d.kind === 'sand') out.push('sandstorm');
  else if (d.precip === 'heavy') out.push('heavyPrecip');
  if (d.wind === 'strong' || d.wind === 'gale') out.push('strongWind');
  if (d.sky === 'fog') out.push('fog');
  return out;
}

export const fahrenheit = (c: number) => Math.round((c * 9) / 5 + 32);
