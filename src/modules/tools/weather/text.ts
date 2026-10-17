// A day of weather as words (the dictionary, weather.*): a summary line, a line to read aloud, the rules; and several
// days as Markdown. tr — the translation function (the window's reactive t or the shared one in tests).
import type { Key } from '../../../shared/i18n';
import { effectsOf, fahrenheit, type Day, type Terrain } from './generate';

type Tr = (key: Key, params?: Record<string, string | number>) => string;
const k = (s: string) => s as Key;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function tempWord(c: number): string {
  return c <= -18 ? 'bitter' : c <= -5 ? 'freezing' : c <= 5 ? 'cold' : c <= 14 ? 'cool' : c <= 24 ? 'mild' : c <= 32 ? 'hot' : 'scorching';
}

// «+12 °C» in Russian, «54 °F (12 °C)» in English.
export function tempText(c: number, lang: string): string {
  return lang === 'en' ? `${fahrenheit(c)} °F (${c} °C)` : `${c > 0 ? '+' : c < 0 ? '−' : ''}${Math.abs(c)} °C`;
}

// «Overcast, light rain, a breeze. 54 °F (12 °C), cool.»
export function daySummary(d: Day, terrain: Terrain, lang: string, tr: Tr): string {
  const temp = `${tempText(d.temp, lang)}, ${tr(k(`weather.temp.${tempWord(d.temp)}`))}.`;
  if (terrain === 'underground') return cap(temp);
  const parts = [tr(k(`weather.sky.${d.sky}`))];
  if (d.precip !== 'none') parts.push(tr(k(`weather.p.${d.kind}.${d.precip}`)));
  if (d.storm) parts.push(tr('weather.storm'));
  parts.push(tr(k(`weather.w.${d.wind}`)));
  return `${parts.join(', ')}. ${cap(temp)}`;
}

export function dayFlavor(d: Day, terrain: Terrain, tr: Tr): string {
  const f = (id: string) => tr(k(`weather.f.${id}`));
  if (terrain === 'underground') return f('underground');
  if (d.storm) return f('storm');
  if (d.precip !== 'none') return d.kind === 'sand' ? f('sand') : d.kind === 'snow' ? f(d.precip === 'heavy' ? 'snow' : 'snowLight') : d.kind === 'sleet' ? f('sleet') : d.precip === 'heavy' ? f('rain') : f('drizzle');
  if (d.sky === 'fog') return f('fog');
  if (d.wind === 'strong' || d.wind === 'gale') return f('windy');
  if (d.sky === 'clear') return d.temp >= 30 ? f('clearHot') : d.temp <= -10 ? f('clearCold') : f('clear');
  return f(d.sky);
}

export const dayEvent = (d: Day, terrain: Terrain, tr: Tr) => (d.event === null ? '' : tr(k(`weather.event.${terrain}.${d.event}`)));
export const dayRules = (d: Day, tr: Tr) => effectsOf(d).map((e) => tr(k(`weather.e.${e}`)));

export function weatherMarkdown(days: Day[], terrain: Terrain, lang: string, rules: boolean, tr: Tr, title: string): string {
  const out = [`# ${title}`, ''];
  days.forEach((d, i) => {
    if (days.length > 1) out.push(`## ${tr('weather.day', { n: i + 1 })}`, '');
    out.push(daySummary(d, terrain, lang, tr), '', `> ${dayFlavor(d, terrain, tr)}`, '');
    const ev = dayEvent(d, terrain, tr);
    if (ev) out.push(`**${tr('weather.event')}:** ${ev}`, '');
    if (rules) for (const r of dayRules(d, tr)) out.push(`- ${r}`);
    if (rules && dayRules(d, tr).length) out.push('');
  });
  return out.join('\n');
}
