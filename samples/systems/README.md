# System packs of the project

System packs (`src/shared/syspack.ts`) made for Scrying Glass. They don't ship with the app: they are published in the
official repository of the Community, where any GM can install them (Find adventures → Systems). To change one: Tools
→ System builder → Import…, then «Publish…» from the builder.

- `yz-pool.json` — Pool of Sixes, in the style of the Year Zero Engine: attributes and skills roll a pool of d6, sixes
  count, a roll can be pushed; health and mind as tracks; a small compendium of conditions.
- `d100-horror.json` — Percentile Horror: d100 under characteristics and skills, with hard and extreme successes.
- `fate-core.json` — Fate Core (it used to be built into the app): aspects, skills on the ladder, stunts, stress and
  consequences; the aspects & fate points module and the Fate compendium stay in the app.
- `mausritter.json` — Mausritter (it used to be built into the app): the stat block, saves, attacks, a mouse's sheet
  with inventory slots; its built-in creatures (resources/srd/mausritter.json) are written with these fields.

Their covers are `<id>.jpg`, drawn by `covers.cjs` (`npx electron samples/systems/covers.cjs`). They are published
under the author «Scrying Glass» (its key is kept by the project's owner, not in git).

No rules text of other games is in them — only the structure of a card and the dice. `tests/syspack.test.ts` checks
that every pack here is valid and that its formulas name its own fields.
