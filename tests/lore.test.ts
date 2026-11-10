import { describe, expect, it } from 'vitest';
import { generate, loreMarkdown, reroll, rerollOne, type Helpers } from '../src/modules/tools/lore/engine';
import { en as shipEn } from '../src/modules/tools/lore/ships/en';
import { ru as shipRu } from '../src/modules/tools/lore/ships/ru';
import { shipParts } from '../src/modules/tools/lore/ships/parts';
import { en as orgEn } from '../src/modules/tools/lore/orgs/en';
import { ru as orgRu } from '../src/modules/tools/lore/orgs/ru';
import { cultParts, guildParts } from '../src/modules/tools/lore/orgs/parts';

const help: Helpers = { person: () => ({ name: 'Mira Stone', occupation: 'miller', trait: 'never smiles' }) };
const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length]!;
};

describe('ships', () => {
  it('kinds pair across languages, crews make sense', () => {
    expect(shipRu.kinds.length).toBe(shipEn.kinds.length);
    shipEn.kinds.forEach((k, i) => expect(shipRu.kinds[i]!.crew).toEqual(k.crew));
    for (const k of shipEn.kinds) expect(k.crew[0]).toBeLessThanOrEqual(k.crew[1]);
  });
  it('a Russian name agrees in gender', () => {
    // «Чёрный» with «Вдова» (feminine), «Сердце» (neuter).
    const name = (noun: number) => generate(shipParts, shipRu, help, seq(0, noun / shipRu.nouns.length + 0.001, 0))['name'];
    expect(name(1)).toBe('«Чёрная Вдова»');
    expect(name(2)).toBe('«Чёрное Сердце»');
    expect(name(0)).toBe('«Чёрный Ворон»');
  });
  it('every part fills its lines; the crew follows the kind', () => {
    for (const c of [shipEn, shipRu]) {
      const r = generate(shipParts, c, help);
      for (const k of ['kindName', 'name', 'captain', 'crewSize', 'crewMood', 'cargo', 'quirk', 'secret', 'trouble']) expect(r[k]).toBeTruthy();
      const [lo, hi] = c.kinds[Number(r['kind'])]!.crew;
      expect(Number(r['crewSize'])).toBeGreaterThanOrEqual(lo);
      expect(Number(r['crewSize'])).toBeLessThanOrEqual(hi);
    }
  });
  it('pinned parts stay, one part rerolls alone', () => {
    const r = generate(shipParts, shipEn, help, seq(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7));
    const next = reroll(shipParts, r, ['name', 'cargo'], shipEn, help, seq(0.9, 0.95, 0.85));
    expect([next['name'], next['cargo']]).toEqual([r['name'], r['cargo']]);
    const one = rerollOne(shipParts, 'quirk', r, shipEn, help, seq(0.99));
    expect(one['name']).toBe(r['name']);
    expect(one['quirk']).toBe(shipEn.quirks.at(-1));
  });
});

describe('guilds and cults', () => {
  it('trades and entities pair across languages with the same number of lines', () => {
    expect(orgRu.trades.length).toBe(orgEn.trades.length);
    expect(orgRu.entities.length).toBe(orgEn.entities.length);
    orgEn.trades.forEach((t, i) => {
      const r = orgRu.trades[i]!;
      expect([r.names.length, r.goals.length, r.offers.length]).toEqual([t.names.length, t.goals.length, t.offers.length]);
    });
    orgEn.entities.forEach((e, i) => expect([orgRu.entities[i]!.names.length, orgRu.entities[i]!.rites.length]).toEqual([e.names.length, e.rites.length]));
    for (const k of ['seats', 'customs', 'rivals', 'guildSecrets', 'signs', 'fronts', 'members', 'cultGoals', 'cultSecrets', 'omens'] as const) expect(orgRu[k].length).toBe(orgEn[k].length);
  });
  it('a guild takes its name, goal and offer from its trade; a cult its name and rite from its entity', () => {
    const g = generate(guildParts, orgEn, help);
    const trade = orgEn.trades[Number(g['what'])]!;
    expect(trade.names).toContain(g['name']);
    expect(trade.goals).toContain(g['goal']);
    expect(trade.offers).toContain(g['offer']);
    const c = generate(cultParts, orgRu, help);
    const ent = orgRu.entities[Number(c['what'])]!;
    expect(ent.names).toContain(c['name']);
    expect(ent.rites).toContain(c['rite']);
    expect(c['omens']).not.toBe(c['omens2']);
    expect(c['leader']).toBe('Mira Stone — говорит от имени верных');
  });
  it('reads as Markdown', () => {
    expect(loreMarkdown('Grey Cloaks', [{ label: 'Leader', lines: ['Mira'] }, { label: 'Omens', lines: ['a', 'b'] }], 'Guild')).toBe(
      '# Guild\n\n**Grey Cloaks**\n\n- **Leader:** Mira\n- **Omens:**\n  - a\n  - b',
    );
  });
});
