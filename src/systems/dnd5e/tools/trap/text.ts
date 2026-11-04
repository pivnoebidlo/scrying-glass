// A trap as text in one language: its parts, rule lines and the whole as Markdown (for the journal, the dice are
// {rollable}). The dungeon generator shows its traps through the same functions.
import { t } from '../../../../shared/i18n';
import { dict } from '../../stats';
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
  trigger: string;
  effect: string;
  detect: string;
  disarm: string;
  bypass: string;
  complication: string;
  story: string;
  // The rule line of the effect with these dice; the checks to notice and to disarm. '' — no rules (not D&D).
  rule: (x: Trap, dice: string) => string;
  detectCheck: (x: Trap) => string;
  disarmCheck: (x: Trap) => string;
}

export function trapLabels(lang: TrapLang, rules = true): TrapLabels {
  const words = dict(lang);
  const check = (skill: string | undefined, dc: number) =>
    rules && skill ? t('trap.check', { skill: (words.skills as Record<string, string>)[skill] ?? skill, dc }) : '';
  return {
    trigger: t('trap.part.trigger'),
    effect: t('trap.effect'),
    detect: t('trap.detect'),
    disarm: t('trap.disarm'),
    bypass: t('trap.part.bypass'),
    complication: t('trap.part.complication'),
    story: t('trap.part.story'),
    rule(x, dice) {
      const m = mechanismOf(x);
      if (!rules || !m) return '';
      const type = damageType(x, lang);
      if (!m.save) return t('trap.rule.attack', { bonus: x.attack, dice, type });
      const save = words.abilities[m.save];
      if (!m.damage) return t('trap.rule.save', { save, dc: x.saveDc });
      return t(m.success === 'half' ? 'trap.rule.half' : 'trap.rule.none', { save, dc: x.saveDc, dice, type });
    },
    detectCheck: (x) => check(mechanismOf(x)?.detect, x.detectDc),
    disarmCheck: (x) => check(mechanismOf(x)?.disable, x.disarmDc),
  };
}

// What to do with it, as labelled lines: the same in the trap generator's Markdown and in a dungeon room.
export function trapFacts(x: Trap, lang: TrapLang, l: TrapLabels) {
  const s = trapTexts(x, lang);
  return [
    { label: l.trigger, text: s.trigger, check: '' },
    { label: l.detect, text: s.clue, check: l.detectCheck(x) },
    { label: l.disarm, text: s.disarm, check: l.disarmCheck(x) },
    { label: l.bypass, text: s.bypass, check: '' },
    { label: l.complication, text: s.complication, check: '' },
  ];
}

// The effect and the facts as Markdown paragraphs.
export function trapLines(x: Trap, lang: TrapLang, l: TrapLabels, rollable: boolean): string[] {
  const dice = trapDice(x);
  const rule = l.rule(x, rollable ? `{${dice}}` : dice);
  const facts = trapFacts(x, lang, l).map((f) => `**${f.label}:** ${f.text}${f.check ? ` *${f.check}*` : ''}`);
  return [`**${l.effect}:** ${trapTexts(x, lang).effect}`, ...(rule ? [`*${rule}*`] : []), ...facts];
}

export function trapMarkdown(x: Trap, lang: TrapLang, l: TrapLabels, subtitle: string, o: { heading: boolean; rollable: boolean }): string {
  const s = trapTexts(x, lang);
  const out = [...(o.heading ? [`# ${trapName(x, lang)}`] : []), `*${subtitle}*`, ...trapLines(x, lang, l, o.rollable), `**${l.story}:** ${s.maker} ${s.remains}`];
  return out.join('\n\n');
}
