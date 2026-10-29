// Events as text: the event in its language (with [[links]]), the D&D check, and several events as Markdown.
import { en as tavernEn } from '../../../../modules/tools/tavern/content/en';
import { ru as tavernRu } from '../../../../modules/tools/tavern/content/ru';
import { dict } from '../../stats';
import { COMPLICATIONS, EVENTS, RUMOR_INTROS } from './events';
import type { GeneratedEvent } from './generate';

export type EventLang = 'en' | 'ru';
export const RUMORS: Record<EventLang, string[]> = { en: tavernEn.rumors, ru: tavernRu.rumors };
export const eventLang = (lang: string): EventLang => (lang === 'ru' ? 'ru' : 'en');

export function eventText(g: GeneratedEvent, lang: EventLang): string {
  if (g.kind === 'rumor') return (RUMOR_INTROS[lang][g.intro ?? 0] ?? '{rumor}').replace('{rumor}', RUMORS[lang][g.index] ?? '');
  return EVENTS[g.index]?.[lang] ?? '';
}
export const complicationText = (g: GeneratedEvent, lang: EventLang) => (g.complication === undefined ? '' : (COMPLICATIONS[lang][g.complication] ?? ''));

// «Survival, DC 12» / «Выживание, СЛ 12», «WIS save, DC 13» — the skill or save in the interface language.
export function checkText(g: GeneratedEvent, uiLang: string, format: (what: string, dc: number) => string, save: (ability: string) => string): string {
  const c = g.kind === 'rumor' ? undefined : EVENTS[g.index]?.check;
  if (!c) return '';
  const l = dict(uiLang);
  const [what, dc] = c;
  const name = what.startsWith('save:') ? save(l.abilities[what.slice(5) as keyof typeof l.abilities] ?? what.slice(5)) : (l.skills[what] ?? what);
  return format(name, dc);
}

// Links as plain text: «a pack of wolves».
export const plain = (text: string) => text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');
