# Sample system packs

System packs (`src/shared/syspack.ts`) made for Scrying Glass. They don't ship with the app: they are published in the
official repository of the Community, where any GM can install them (Find adventures → Systems). To change one: Tools
→ System builder → Import…, then «Publish…» from the builder.

- `yz-pool.json` — Pool of Sixes, in the style of the Year Zero Engine: attributes and skills roll a pool of d6, sixes
  count, a roll can be pushed; health and mind as tracks; a small compendium of conditions.
- `d100-horror.json` — Percentile Horror: d100 under characteristics and skills, with hard and extreme successes.

No rules text of other games is in them — only the structure of a card and the dice. `tests/syspack.test.ts` checks
that every pack here is valid and that its formulas name its own fields.
