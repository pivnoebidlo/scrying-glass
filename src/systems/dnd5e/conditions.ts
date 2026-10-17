// D&D 5e conditions for the initiative tracker and how to find them in the compendium.
import { LANGS, t, tr, type Key, type Lang } from '../../shared/i18n';

const IDS = [
  'unconscious', 'frightened', 'exhaustion', 'invisible', 'incapacitated', 'deafened', 'petrified', 'restrained',
  'blinded', 'poisoned', 'charmed', 'paralyzed', 'prone', 'grappled', 'stunned', 'concentration',
] as const;
type ConditionId = (typeof IDS)[number];

// Full names as in the rules (Russian translation and English) — the built-in compendium entries.
const ENTRY: Record<ConditionId, [string, string]> = {
  unconscious: ['Без сознания', 'Unconscious'],
  frightened: ['Испуганный', 'Frightened'],
  exhaustion: ['Истощение', 'Exhaustion'],
  invisible: ['Невидимый', 'Invisible'],
  incapacitated: ['Недееспособный', 'Incapacitated'],
  deafened: ['Оглохший', 'Deafened'],
  petrified: ['Окаменевший', 'Petrified'],
  restrained: ['Опутанный', 'Restrained'],
  blinded: ['Ослеплённый', 'Blinded'],
  poisoned: ['Отравленный', 'Poisoned'],
  charmed: ['Очарованный', 'Charmed'],
  paralyzed: ['Парализованный', 'Paralyzed'],
  prone: ['Лежащий', 'Prone'],
  grappled: ['Схваченный', 'Grappled'],
  stunned: ['Ошеломлённый', 'Stunned'],
  concentration: ['Концентрация', 'Concentration'],
};

const key = (id: ConditionId) => `dnd.cond.${id}` as Key;

// Conditions offered in the tracker, in the interface language. A participant keeps the text it got, so conditions
// set in another language stay as they were.
export const conditionList = () => IDS.map((id) => t(key(id)));

// What to look for in the compendium: the condition as written and its full names in any language we know.
export function conditionEntry(c: string): string[] {
  const id = IDS.find((x) => (Object.keys(LANGS) as Lang[]).some((l) => tr(l, key(x)) === c));
  return id ? [c, ...ENTRY[id]] : [c];
}
