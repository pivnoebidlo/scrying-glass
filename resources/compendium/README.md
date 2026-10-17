# Built-in compendium / Встроенный справочник

Files are `<system>.<lang>.json`; the app shows the book in the interface language, or else the English one.

- `fate-core.<lang>.json` (Fate Core rules and skills) — built by `scripts/build-fate.ts` (`npm run build-fate`) from
  `scripts/fate-core.<lang>.md`; the texts are edited there.
- `dnd5e-2014.<lang>.json` and `dnd5e-2024.<lang>.json` (spells, magic items, feats, conditions, rules glossary) —
  built by `scripts/import-compendium.ts` (`npm run import-compendium`) from the Markdown of OmnisGM-Rules (English
  originals and the Russian translation). Do not edit them by hand: changes are lost on the next build.

## Credits and licenses

This work includes material from the System Reference Document 5.1 ("SRD 5.1") and the System Reference
Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd.
Both are licensed under the Creative Commons Attribution 4.0 International License,
https://creativecommons.org/licenses/by/4.0/legalcode.

The Markdown of the English originals and the Russian translation of SRD 5.1 and SRD 5.2.1 — OmnisGM,
https://rules.omnisgm.com (https://github.com/OmnisGM-App/OmnisGM-Rules), CC BY 4.0. / Русский перевод SRD 5.1 и
SRD 5.2.1 — OmnisGM, лицензия CC BY 4.0.

The text is split into entries and fields (level, school, casting time and so on); the lines "school, level,
classes" and "kind, rarity, attunement" are composed by the app. The meaning of the rules is unchanged.

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
