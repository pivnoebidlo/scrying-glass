import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { addList, parseList, parseListName, RACES, type NameBook } from '../src/shared/names';
import { en } from '../src/modules/tools/npc/content/en';
import { ru } from '../src/modules/tools/npc/content/ru';
import { generateNpc, npcName, rerollNpc } from '../src/modules/tools/npc/generate';
import { npcCard, npcMarkdown } from '../src/modules/tools/npc/text';
import { IMPORTANCE, type NpcContent } from '../src/modules/tools/npc/types';

const names = (lang: string): NameBook => {
  const dir = path.join(__dirname, '../src/modules/tools/names/builtin', lang);
  const book: NameBook = {};
  for (const f of fs.readdirSync(dir)) addList(book, parseListName(f)!, parseList(fs.readFileSync(path.join(dir, f), 'utf8')));
  return book;
};
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const labels = { race: (r: string) => r, appearance: 'A', trait: 'T', manner: 'M', desire: 'D', secret: 'S', item: 'I', fame: 'F', quote: (s: string) => `"${s}"` };

describe('генератор NPC', () => {
  for (const [lang, c] of [['en', en], ['ru', ru]] as [string, NpcContent][]) {
    it(`${lang}: все части, без пустых; важность добавляет подробности`, () => {
      const book = names(lang);
      for (let i = 1; i < 40; i++) {
        const importance = IMPORTANCE[i % IMPORTANCE.length]!;
        const n = generateNpc(c, book, { race: RACES[i % RACES.length]!, gender: i % 2 ? 'male' : 'female', importance }, seeded(i));
        expect(n.name).not.toBe('?');
        expect(n.race).toBe(RACES[i % RACES.length]);
        for (const k of ['occupation', 'trait', 'manner', 'desire', 'secret', 'item'] as const) expect(n[k], k).toBeTruthy();
        expect(n.appearance.length).toBe(IMPORTANCE.indexOf(importance) >= 2 ? 2 : 1);
        if (IMPORTANCE.indexOf(importance) >= 3) expect(n.epithet).toBeTruthy();
        if (importance === 'common') expect(n.fame).toBe('');
        if (importance === 'unique') expect(c.magicItems).toContain(n.item);
        const md = npcMarkdown(n, labels);
        expect(md).not.toMatch(/undefined|\{/);
        expect(npcCard(n, labels).notes).toContain('**S:**');
      }
    });
  }

  it('случайная раса и пол; переброска не трогает закреплённое', () => {
    const book = names('en');
    const n = generateNpc(en, book, { race: '', gender: 'random', importance: 'rare' }, seeded(5));
    expect(RACES).toContain(n.race as never);
    const next = rerollNpc(n, ['name', 'secret'], en, book, seeded(77));
    expect(npcName(next, (s) => s)).toBe(npcName(n, (s) => s));
    expect(next.secret).toBe(n.secret);
    expect(next.race).toBe(n.race);
  });
});
