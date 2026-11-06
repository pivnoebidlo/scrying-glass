import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FEATURES, freshFeatures, newFeatures, offeredFeatures, oldEntryTypes, oldUses } from '../src/shared/features';
import { forSaving, PACK_FORMAT, validatePack, type SystemPack } from '../src/shared/syspack';
import { usesHere } from '../src/shared/adventures';
import { usesOf } from '../src/systems';
import { registerPacks } from '../src/systems/packs';
import type { AdventuresState } from '../src/shared/adventures';
import { en, ru } from '../src/modules/tools/syspack/i18n';

const raw = (more: object = {}) => ({ scryingGlass: 'system', version: 1, id: 'super-rp', title: 'SuperRoleplay', tracker: {}, sections: [{ id: 'main', title: 'Main', fields: [{ key: 'hp', title: 'HP', type: 'number' }] }], ...more });
const packOf = (id: string) => validatePack(JSON.parse(readFileSync(`content/${id}/system/${id}.json`, 'utf8'))) as SystemPack;

describe('features of the core', () => {
  it('an old pack gets what it had by its family; any other — time in the game', () => {
    expect((validatePack(raw()) as SystemPack).uses).toEqual(['worldtime']);
    expect((validatePack(raw({ family: 'fate' })) as SystemPack).uses).toEqual(oldUses('fate'));
    expect(oldUses('mausritter')).not.toContain('worldtime');
  });

  it('the packages say the same as the old table, so nothing moved', () => {
    for (const [id, family] of [['fate-core', 'fate'], ['fitd', 'fitd'], ['mausritter', 'mausritter']] as const) {
      expect(packOf(id).format).toBe(PACK_FORMAT);
      expect(packOf(id).uses).toEqual(expect.arrayContaining(oldUses(family)));
      expect(packOf(id).entryTypes!.map((t) => t.id)).toEqual((oldEntryTypes(family) as { id: string }[]).map((t) => t.id));
    }
  });

  it('the ids of tools that left for data stay in the package: 0.83 still shows its own', () => {
    expect(packOf('mausritter').uses).toEqual(expect.arrayContaining(['mouse', 'mausTables', 'mausShop', 'build']));
    expect((validatePack(raw({ family: 'fate' })) as SystemPack).entryTypes![0]!.id).toBe('skill');
  });

  it('a list is taken as it is: nothing added, unknown ids kept for a newer app', () => {
    expect((validatePack(raw({ format: 2, uses: [] })) as SystemPack).uses).toEqual([]);
    expect((validatePack(raw({ format: 2, uses: ['clocks', 'fromTheFuture', 'clocks', 7, '../x'] })) as SystemPack).uses).toEqual(['clocks', 'fromTheFuture']);
  });

  it('SuperRoleplay: a new feature is offered to an old pack, and saving settles it', () => {
    const old = validatePack(raw()) as SystemPack;
    const offered = newFeatures(old.format).map((f) => f.id);
    expect(offered).toContain('clocks');
    const next = forSaving({ ...old, uses: [...old.uses!, 'clocks'] }) as SystemPack;
    expect(next.uses).toEqual(['worldtime', 'clocks']);
    expect(newFeatures(next.format)).toEqual([]);
    // What is on already is not marked.
    expect(freshFeatures(1, ['clocks']).map((f) => f.id)).not.toContain('clocks');
    // A feature of a later format would be new again for this pack.
    expect(FEATURES.every((f) => f.since <= PACK_FORMAT)).toBe(true);
  });

  it('every feature the builder offers has its words in both languages', () => {
    for (const f of offeredFeatures()) for (const d of [en, ru] as Record<string, string>[]) for (const k of [`sb.feat.${f.id}`, `sb.feat.${f.id}.desc`]) expect(d[k], k).toBeTruthy();
  });

  it('what is written for one game is kept, not offered', () => {
    expect(offeredFeatures().map((f) => f.id)).not.toContain('mouse');
    const p = validatePack(raw({ format: 2, uses: ['mouse'] })) as SystemPack;
    expect(p.uses).toEqual(['mouse']);
  });

  it('the current system answers, a pack or a plugin', () => {
    registerPacks([validatePack(raw({ format: 2, uses: ['clocks'] })) as SystemPack]);
    expect(usesOf('super-rp')).toEqual(['clocks']);
    expect(usesOf('dnd5e-2024')).toContain('worldtime');
    expect(usesOf('no-such-system')).toEqual([]);
    const adv = { current: 'A', list: ['A'], systems: { A: 'super-rp' } } as unknown as AdventuresState;
    expect(usesHere(adv, 'clocks')).toBe(true);
    expect(usesHere(adv, 'worldtime')).toBe(false);
    registerPacks([]);
  });
});
