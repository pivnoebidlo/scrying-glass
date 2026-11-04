// A wilderness encounter as text in one language; the whole as Markdown (creatures as [[links]]).
import { complicationsOf, GROUND, SCENES, WILD_FOES } from './content';
import { motives, type Foe, type Skirmish } from './generate';

export type SkirmishLang = 'en' | 'ru';
const at = (lang: SkirmishLang) => (lang === 'ru' ? 1 : 0);

export const foeName = (f: Foe, lang: SkirmishLang) => WILD_FOES[f.index]?.[at(lang)] ?? '';
export const foeLine = (f: Foe, lang: SkirmishLang) => `${foeName(f, lang)}${f.count > 1 ? ` ×${f.count}` : ''}`;
export const foesLine = (x: Pick<Skirmish, 'foes'>, lang: SkirmishLang) => x.foes.map((f) => foeLine(f, lang)).join(', ');
export function skirmishTexts(x: Skirmish, lang: SkirmishLang) {
  const s = SCENES[x.scene]!;
  return {
    title: s.title[at(lang)],
    text: (x.terrain === 'town' && s.inTown ? s.inTown : s.text)[at(lang)],
    start: s.start[at(lang)],
    motive: motives(x.foes)[x.motive]?.[at(lang)] ?? '',
    complication: complicationsOf(x.terrain)[x.complication]?.[at(lang)] ?? '',
    ground: GROUND[x.terrain][at(lang)],
  };
}

export interface SkirmishLabels {
  place: string;
  foes: string;
  worth: string;
  start: string;
  motive: string;
  complication: string;
  ground: string;
}
export function skirmishMarkdown(x: Skirmish, lang: SkirmishLang, l: SkirmishLabels, heading = true): string {
  const o = skirmishTexts(x, lang);
  const out = heading ? [`# ${o.title} (${l.place})`, ''] : [];
  out.push(
    `> ${o.text}`,
    '',
    `- **${l.foes}:** ${x.foes.map((f) => `[[${foeName(f, lang)}]]${f.count > 1 ? ` ×${f.count}` : ''}`).join(', ')} (${l.worth})`,
    `- **${l.start}:** ${o.start}`,
    `- **${l.motive}:** ${o.motive}`,
    `- **${l.complication}:** ${o.complication}`,
    `- **${l.ground}:** ${o.ground}`,
  );
  return out.join('\n');
}
