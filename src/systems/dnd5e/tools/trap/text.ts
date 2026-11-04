// A trap as text in one language: its parts and the whole as Markdown (for the journal, the dice are {rollable}).
import { BYPASSES, COMPLICATIONS, DAMAGE, MAKERS, MECHANISMS, REMAINS, TRIGGERS, type Mechanism } from './content';
import { trapDice, type Trap } from './generate';

export type TrapLang = 'en' | 'ru';
const at = (lang: TrapLang) => (lang === 'ru' ? 1 : 0);

export const mechanismOf = (x: Trap): Mechanism | undefined => MECHANISMS[x.mechanism];
export const trapName = (x: Trap, lang: TrapLang) => mechanismOf(x)?.name[at(lang)] ?? '';
export const damageType = (x: Trap, lang: TrapLang) => {
  const d = mechanismOf(x)?.damage;
  return d ? DAMAGE[d][at(lang)] : '';
};
export const trapTexts = (x: Trap, lang: TrapLang) => {
  const i = at(lang);
  const m = mechanismOf(x);
  return {
    effect: m?.effect[i] ?? '',
    clue: m?.clue[i] ?? '',
    disarm: m?.disarm[i] ?? '',
    trigger: TRIGGERS[x.kind]?.[x.place]?.[x.trigger]?.[i] ?? '',
    bypass: BYPASSES[x.bypass]?.[i] ?? '',
    complication: COMPLICATIONS[x.complication]?.[i] ?? '',
    maker: MAKERS[x.maker]?.[i] ?? '',
    remains: REMAINS[x.remains]?.[i] ?? '',
  };
};

export interface TrapLabels {
  // Kind, place, level and severity on one line.
  subtitle: string;
  trigger: string;
  effect: string;
  detect: string;
  disarm: string;
  bypass: string;
  complication: string;
  story: string;
  // The rule line of the effect with these dice; the checks to notice and to disarm.
  rule: (x: Trap, dice: string) => string;
  detectCheck: (x: Trap) => string;
  disarmCheck: (x: Trap) => string;
}

export function trapMarkdown(x: Trap, lang: TrapLang, l: TrapLabels, o: { heading: boolean; rollable: boolean }): string {
  const s = trapTexts(x, lang);
  const dice = trapDice(x);
  return [
    ...(o.heading ? [`# ${trapName(x, lang)}`, ''] : []),
    `*${l.subtitle}*`,
    '',
    `**${l.trigger}:** ${s.trigger}`,
    '',
    `**${l.effect}:** ${s.effect}`,
    '',
    `*${l.rule(x, o.rollable ? `{${dice}}` : dice)}*`,
    '',
    `**${l.detect}:** ${s.clue} *${l.detectCheck(x)}*`,
    '',
    `**${l.disarm}:** ${s.disarm} *${l.disarmCheck(x)}*`,
    '',
    `**${l.bypass}:** ${s.bypass}`,
    '',
    `**${l.complication}:** ${s.complication}`,
    '',
    `**${l.story}:** ${s.maker} ${s.remains}`,
  ].join('\n');
}
