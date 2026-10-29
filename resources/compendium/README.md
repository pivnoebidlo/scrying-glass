# Built-in compendium / Встроенный справочник

Files are `<system>.<lang>.json`; the app shows the book in the interface language, or else the English one.

- `fate-core.<lang>.json` (Fate Core rules and skills) — built by `scripts/build-fate.ts` (`npm run build-fate`) from
  `scripts/fate-core.<lang>.md`; the texts are edited there.
- `fitd.<lang>.json` (Forged in the Dark rules and special abilities) — built by `scripts/build-fitd.ts`
  (`npm run build-fitd`) from `scripts/fitd.<lang>.md`; the texts are edited there.
- D&D 5e SRD books are downloadable content now: `content/dnd5e-srd/compendium/` (see its README).

## Credits and licenses

### Fate Core

This work is based on Fate Core System and Fate Accelerated Edition (found at http://www.faterpg.com/), products of
Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan
Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under
the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).

The English text (`fate-core.en.json`) is a retelling of the Fate Core SRD (https://fate-srd.com/fate-core) written
for Scrying Glass; the stunt examples are new.

Русский текст (`fate-core.ru.json`) — пересказ и перевод Fate Core SRD (https://fate-srd.com/fate-core), сделанный для
Scrying Glass; примеры трюков написаны заново. Подписи ступеней лестницы и названия навыков — свои (открытого
русского перевода Fate Core нет).

### Mausritter

This work is based on Mausritter (https://mausritter.com), a product of Losing Games and Isaac Williams, and is licensed
for use under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence.

`mausritter.en.json` and `mausritter.ru.json` are built by `scripts/build-mausritter.ts` (`npm run build-mausritter`) from the Mausritter SRD 2.3.1
(`scripts/mausritter-srd.en.md`, https://mausritter.com/srd) and its Russian translation made for Scrying Glass
(`scripts/mausritter-srd.ru.md`; the SRD licence allows translation). / Русский перевод Mausritter SRD сделан для
Scrying Glass. The text is split into entries and cards; headings and
links are adjusted, stat blocks are split into fields. The meaning of the rules is unchanged. This is not an official
Mausritter product and is not endorsed by Losing Games.

### Forged in the Dark

This work is based on Blades in the Dark (found at http://www.bladesinthedark.com/), product of One Seven Design, developed and authored by John Harper, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).

The English text (`fitd.en.json`) is a retelling of the Blades in the Dark SRD (https://bladesinthedark.com/basics)
written for Scrying Glass; the setting of Blades in the Dark (Duskwall and the rest) is not used. This is not an
official product and is not endorsed by One Seven Design.

Русский текст (`fitd.ru.json`) — пересказ и перевод SRD Blades in the Dark, сделанный для Scrying Glass, без мира
оригинальной игры. Термины — свои (открытого русского перевода нет).
