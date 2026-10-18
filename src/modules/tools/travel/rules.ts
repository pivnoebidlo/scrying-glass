// Overland travel by the SRD: pace (5.2 «Travel Pace», 5.1 the same distances), the 2024 Travel Terrain table
// (maximum pace, encounter distance, DCs), good roads, difficult terrain (2014: half speed), extended travel beyond
// 8 hours (a CON save, DC 10 + hours past 8) and waterborne vehicles (their speed, up to 24 hours a day).
export const PACES = ['slow', 'normal', 'fast'] as const;
export type Pace = (typeof PACES)[number];
export const TERRAINS = ['arctic', 'coastal', 'desert', 'forest', 'grassland', 'hill', 'mountain', 'swamp', 'underdark', 'urban'] as const;
export type TravelTerrain = (typeof TERRAINS)[number];
export const VESSELS = ['airship', 'galley', 'keelboat', 'longship', 'rowboat', 'sailingShip', 'warship'] as const;
export type Vessel = (typeof VESSELS)[number];
export type Edition = '2014' | '2024';

// Miles per hour and per (8-hour) day.
export const PACE_RATE: Record<Pace, { hour: number; day: number; minute: number }> = {
  slow: { minute: 200, hour: 2, day: 18 },
  normal: { minute: 300, hour: 3, day: 24 },
  fast: { minute: 400, hour: 4, day: 30 },
};

export interface TerrainRow {
  max: Pace;
  encounter: string;
  foraging: number;
  navigation: number;
  search: number;
}
export const TERRAIN_TABLE: Record<TravelTerrain, TerrainRow> = {
  arctic: { max: 'fast', encounter: '6d6 × 10', foraging: 20, navigation: 10, search: 10 },
  coastal: { max: 'normal', encounter: '2d10 × 10', foraging: 10, navigation: 5, search: 15 },
  desert: { max: 'normal', encounter: '6d6 × 10', foraging: 20, navigation: 10, search: 10 },
  forest: { max: 'normal', encounter: '2d8 × 10', foraging: 10, navigation: 15, search: 15 },
  grassland: { max: 'fast', encounter: '6d6 × 10', foraging: 15, navigation: 5, search: 15 },
  hill: { max: 'normal', encounter: '2d10 × 10', foraging: 15, navigation: 10, search: 15 },
  mountain: { max: 'slow', encounter: '4d10 × 10', foraging: 20, navigation: 15, search: 20 },
  swamp: { max: 'slow', encounter: '2d8 × 10', foraging: 10, navigation: 15, search: 20 },
  underdark: { max: 'normal', encounter: '2d6 × 10', foraging: 20, navigation: 10, search: 20 },
  urban: { max: 'normal', encounter: '2d6 × 10', foraging: 20, navigation: 15, search: 15 },
};
// Speed in miles per hour (SRD 5.2 «Airborne and Waterborne Vehicles»).
export const VESSEL_MPH: Record<Vessel, number> = { airship: 8, galley: 4, keelboat: 1, longship: 3, rowboat: 1.5, sailingShip: 2, warship: 2.5 };

export interface TravelInput {
  edition: Edition;
  distance: number;
  // On foot / mounted / in a land vehicle, or aboard a vessel.
  by: 'land' | Vessel;
  pace: Pace;
  terrain: TravelTerrain;
  road: boolean;
  // 2014: the way is difficult terrain (half the distance).
  difficult: boolean;
  hours: number;
}

export interface TravelResult {
  // The pace actually kept (after the terrain's maximum and roads); null aboard a vessel.
  pace: Pace | null;
  // The terrain lowered the chosen pace.
  capped: boolean;
  perHour: number;
  perDay: number;
  // Time to cover the distance: whole travel days and the hours of the last one.
  days: number;
  hours: number;
  // Extended travel: the save DC at the end of each hour past 8.
  saves: number[];
}

const step = (p: Pace, d: number): Pace => PACES[Math.max(0, Math.min(2, PACES.indexOf(p) + d))]!;

export function travel(i: TravelInput): TravelResult {
  const hoursPerDay = Math.max(1, Math.min(24, Math.round(i.hours)));
  let pace: Pace | null = null;
  let capped = false;
  let perHour: number;
  let perDay: number;
  if (i.by === 'land') {
    pace = i.pace;
    if (i.edition === '2024') {
      const max = i.road ? step(TERRAIN_TABLE[i.terrain].max, 1) : TERRAIN_TABLE[i.terrain].max;
      if (PACES.indexOf(pace) > PACES.indexOf(max)) {
        pace = max;
        capped = true;
      }
    }
    const half = i.edition === '2014' && i.difficult ? 0.5 : 1;
    const rate = PACE_RATE[pace];
    perHour = rate.hour * half;
    // The table day is 8 hours; shorter days — by the hour, longer ones — the day plus an hour's distance per hour.
    perDay = (hoursPerDay >= 8 ? rate.day + (hoursPerDay - 8) * rate.hour : rate.hour * hoursPerDay) * half;
  } else {
    perHour = VESSEL_MPH[i.by];
    perDay = perHour * hoursPerDay;
  }
  const distance = Math.max(0, i.distance);
  const fullDays = perDay > 0 ? Math.floor(distance / perDay + 1e-9) : 0;
  const rest = distance - fullDays * perDay;
  // The last day's hours by the day's average (the table day is not always 8 × the hour: slow 18, fast 30).
  const hours = rest > 1e-9 ? Math.min(hoursPerDay, Math.ceil(rest / (perDay / hoursPerDay) - 1e-9)) : 0;
  // Forced march applies to walkers and riders, not to a crewed vessel.
  const saves = i.by === 'land' ? Array.from({ length: Math.max(0, hoursPerDay - 8) }, (_, k) => 11 + k) : [];
  return { pace, capped, perHour, perDay, days: fullDays, hours, saves };
}
