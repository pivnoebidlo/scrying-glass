// The spell filter of the compendium list (as on dnd.su): level, class, school, casting time, concentration, ritual.
import { t } from '../../shared/i18n';
import { searchKey, type FieldValue } from '../../shared/compendium';

export type CastingKind = 'action' | 'bonus' | 'reaction' | 'long';
export const castingTitle = (k: CastingKind) => t(`cmp.casting.${k}`);
export const CASTING_KINDS: CastingKind[] = ['action', 'bonus', 'reaction', 'long'];

// «Бонусное действие» -> bonus, «1 минута» -> long. Пусто — неизвестно.
export function castingKind(v: FieldValue | undefined): CastingKind | null {
  const t = typeof v === 'string' ? searchKey(v) : '';
  if (!t) return null;
  if (/бонусн|bonus/.test(t)) return 'bonus';
  if (/реакци|reaction/.test(t)) return 'reaction';
  if (/^(1 )?(действие|action)\b/.test(t)) return 'action';
  return 'long';
}

export interface SpellFilter {
  levels: number[];
  classes: string[];
  schools: string[];
  times: CastingKind[];
  concentration: 'any' | 'yes' | 'no';
  ritual: 'any' | 'yes' | 'no';
}

export const NO_SPELL_FILTER: SpellFilter = { levels: [], classes: [], schools: [], times: [], concentration: 'any', ritual: 'any' };

export const spellFilterOn = (f: SpellFilter) =>
  !!(f.levels.length || f.classes.length || f.schools.length || f.times.length || f.concentration !== 'any' || f.ritual !== 'any');

const listOf = (v: FieldValue | undefined) => (Array.isArray(v) ? v : typeof v === 'string' && v ? v.split(',') : []).map((x) => searchKey(String(x).trim()));

// Подходит ли заклинание: внутри одного признака — любое из выбранного, между признаками — все сразу.
export function spellMatches(fields: Record<string, FieldValue>, f: SpellFilter): boolean {
  if (f.levels.length && !f.levels.includes(Number(fields['level'] ?? -1))) return false;
  if (f.classes.length) {
    const own = listOf(fields['classes']);
    if (!f.classes.some((c) => own.includes(searchKey(c)))) return false;
  }
  if (f.schools.length && !f.schools.some((s) => searchKey(s) === searchKey(String(fields['school'] ?? '')))) return false;
  if (f.times.length) {
    const k = castingKind(fields['casting_time']);
    if (!k || !f.times.includes(k)) return false;
  }
  if (f.concentration !== 'any' && !!fields['concentration'] !== (f.concentration === 'yes')) return false;
  if (f.ritual !== 'any' && !!fields['ritual'] !== (f.ritual === 'yes')) return false;
  return true;
}

// Подпись уровня: «Заговоры», «1 уровень».
export const levelTitle = (level: number) => (level === 0 ? t('cmp.sub.cantrips') : t('cmp.sub.level', { n: level }));
