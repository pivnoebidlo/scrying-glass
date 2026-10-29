// Systems described by packs (shared/syspack.ts) next to the built-in ones: each pack becomes a SystemDef in
// `systems` and a family in FAMILIES. The core registers the packs it read, the windows — the ones that came with
// the state (vault.systems). Built-in systems keep their ids: a pack can't take one.
import type { CardKind, CombatStats } from '../shared/cards';
import type { Combatant } from '../modules/initiative/types';
import { getLang, t } from '../shared/i18n';
import { die } from '../shared/dice';
import { blankStats, evalFormula, fieldMap, loc, packCombat, packSubtitle, type SystemPack } from '../shared/syspack';
import type { CombatField, TrackerDef } from './tracker';
import { FAMILIES, systems, type SystemDef } from '.';

const packs = new Map<string, SystemPack>();
const families = new Set<string>();
let registered: SystemPack[] | null = null;

export const packOf = (id: string) => packs.get(id);
export const isPackFamily = (family: string) => families.has(family);

export function registerPacks(list: SystemPack[] | undefined) {
  if (!list || list === registered) return;
  registered = list;
  for (const id of packs.keys()) {
    const i = systems.findIndex((s) => s.id === id);
    if (i >= 0) systems.splice(i, 1);
  }
  for (const f of families) {
    const i = FAMILIES.findIndex((x) => x.id === f);
    if (i >= 0) FAMILIES.splice(i, 1);
  }
  packs.clear();
  families.clear();
  for (const p of list) {
    if (systems.some((s) => s.id === p.id)) continue;
    packs.set(p.id, p);
    systems.push(systemOfPack(p));
    const family = p.family ?? p.id;
    if (!FAMILIES.some((f) => f.id === family)) {
      families.add(family);
      FAMILIES.push({
        id: family,
        get title() {
          return loc(p.title, getLang());
        },
      });
    }
  }
}

function systemOfPack(p: SystemPack): SystemDef {
  return {
    id: p.id,
    get title() {
      return loc(p.title, getLang());
    },
    family: p.family ?? p.id,
    get about() {
      return p.about ? loc(p.about, getLang()) : undefined;
    },
    subtitle: (s, lang) => packSubtitle(p, s ?? {}, lang),
    rank: (s) => (p.rank ? evalFormula(p, s ?? {}, p.rank) : null),
    combat: (s) => packCombat(p, s ?? {}),
    blank: (kind?: CardKind) => blankStats(p, kind ?? 'monster'),
    tracker: packTracker(p),
  };
}

const boxes = (n: number, filled = 0) => Array.from({ length: Math.max(0, Math.min(40, Math.round(n))) }, (_, i) => i < filled);

// The tracker of a pack: the order of turns as the pack says, health, the tracks and numbers it shows.
export function packTracker(p: SystemPack): TrackerDef {
  const fields = fieldMap(p);
  const init = p.tracker.init;
  const title = (key: string) => loc(fields.get(key)?.title, getLang());
  const hp: CombatField[] = p.tracker.hp
    ? [
        {
          key: 'hp',
          get label() {
            return title(p.tracker.hp!);
          },
          get title() {
            return title(p.tracker.hp!);
          },
          get: (c) => c.maxHp,
          set: (v) => ({ hp: v, maxHp: v }),
        },
      ]
    : [];
  // Text cells (consequences) are written in the tracker itself, not entered on adding.
  const cells: CombatField[] = (p.tracker.cells ?? [])
    .filter((k) => k !== p.tracker.hp && !['text', 'textarea'].includes(fields.get(k)?.type ?? ''))
    .map((key) => {
      const track = fields.get(key)?.type === 'track';
      return {
        key,
        get label() {
          return title(key);
        },
        get title() {
          return title(key);
        },
        get: (c: Combatant) => (track ? (c.stress?.find((s) => s.id === key)?.boxes.length ?? null) : (c.attrs?.find((a) => a.id === key)?.max ?? null)),
        set: (v: number | null, c?: Combatant) =>
          track
            ? { stress: [...(c?.stress ?? []).filter((s) => s.id !== key), { id: key, boxes: boxes(v ?? 0, c?.stress?.find((s) => s.id === key)?.boxes.filter(Boolean).length ?? 0) }] }
            : { attrs: [...(c?.attrs ?? []).filter((a) => a.id !== key), { id: key, value: v ?? 0, max: v ?? 0 }] },
      };
    });
  const roll = init.type === 'roll' ? /^\s*(\d*)\s*[dк]\s*(\d+)/i.exec(init.dice) : null;
  return {
    init: {
      get label() {
        return t('pack.tr.init');
      },
      get title() {
        return t('pack.tr.initTitle');
      },
    },
    bonus: {
      get label() {
        return t('pack.tr.bonus');
      },
      get short() {
        return t('pack.tr.bonusShort');
      },
      get title() {
        return t('pack.tr.bonusTitle');
      },
    },
    roll: {
      get label() {
        return t('pack.tr.roll');
      },
      get title() {
        return t('pack.tr.rollTitle');
      },
      // A roll: the dice plus the bonus; a value: the bonus is the value; none: no button.
      value: (bonus) => {
        if (!roll) return bonus;
        let sum = bonus;
        for (let i = 0; i < Number(roll[1] || 1); i++) sum += die(Number(roll[2]));
        return sum;
      },
      ...(init.type === 'none' ? { none: true } : {}),
    },
    conditions: {
      get label() {
        return t('pack.tr.conditions');
      },
      get list() {
        return (p.tracker.conditions?.list ?? []).map((c) => loc(c, getLang()));
      },
      free: p.tracker.conditions?.free ?? !(p.tracker.conditions?.list ?? []).length,
      get add() {
        return t('pack.tr.addCondition');
      },
      // A condition with an entry of the same name in the pack's compendium opens it.
      ...(p.compendium?.length
        ? { entry: (c: string) => (p.compendium!.some((e) => loc(e.title, getLang()).toLowerCase() === c.toLowerCase()) ? [c] : []) }
        : {}),
    },
    fields: [...hp, ...cells],
    fromCard(s: CombatStats) {
      return {
        bonus: s.initiative,
        hp: s.hp,
        maxHp: s.hp,
        ac: null,
        stress: (s.stress ?? []).map((x) => ({ id: x.id, boxes: boxes(x.boxes) })),
        attrs: (s.attrs ?? []).map((a) => ({ id: a.id, value: a.value, max: a.value })),
      };
    },
  };
}
