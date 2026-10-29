# Pathfinder 2e — data of the system

Downloadable data for the Pathfinder 2e family (`shared/content.ts`), built by `scripts/import-pf2e.ts`
(`npm run import-pf2e`) from the data of the pf2e system for Foundry VTT (https://github.com/foundryvtt/pf2e; code
Apache 2.0). Only entries whose `publication.license` is ORC are taken; English only (there is no open Russian
translation). `npm run build-content` packs it; the official author publishes it.

- `bestiary/pf2e.json` — the creatures of Pathfinder Monster Core: stat blocks only (their lore — Golarion — is not
  open: Reserved Material of the ORC License).
- `compendium/pf2e.en.json` — conditions, spells and actions of Pathfinder Player Core and Player Core 2, the monster
  abilities glossary of Monster Core (types `pf2e-condition`, `pf2e-spell`, `pf2e-action`, `pf2e-ability`).
- `content.json` — the manifest; raise `release` when the files change.

To do (a smaller set first, by the GM's decision): equipment, feats, ancestries, backgrounds, classes, more books
(GM Core hazards, NPC Core, Howl of the Wild…), Pathfinder character sheets and the Pathbuilder import.

## License

This product is licensed under the ORC License held in the Library of Congress at TX 9-307-067 and available online at
various locations including paizo.com/orclicense, azoralaw.com/orclicense, and others. All warranties are disclaimed as
set forth therein. Attribution: This product is based on the following Licensed Material: Pathfinder Player Core © 2023
Paizo Inc.; Pathfinder Player Core 2 © 2024 Paizo Inc.; Pathfinder Monster Core © 2024 Paizo Inc.

Scrying Glass uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy
(paizo.com/licenses/communityuse). We are expressly prohibited from charging you to use or access this content.
Scrying Glass is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and
Paizo products, visit paizo.com.
