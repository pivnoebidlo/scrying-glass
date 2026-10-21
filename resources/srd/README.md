# Built-in bestiary

The files `dnd5e-2014.json` and `dnd5e-2024.json` (each card in English and Russian) are built by
`scripts/import-srd.ts` (`npm run import-srd`). Do not edit them by hand: changes are lost on the next build.

## Credits and licenses

This work includes material from the System Reference Document 5.1 ("SRD 5.1") and the System Reference
Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd.
Both are licensed under the Creative Commons Attribution 4.0 International License,
https://creativecommons.org/licenses/by/4.0/legalcode.

Structured data (numbers, attacks) and the English text come from the 5e-bits/5e-database project
(https://github.com/5e-bits/5e-database, code — MIT).

The Russian translation of SRD 5.1 and SRD 5.2.1 is by OmnisGM, https://rules.omnisgm.com
(https://github.com/OmnisGM-App/OmnisGM-Rules), licensed CC BY 4.0. / Русский перевод SRD 5.1 и SRD 5.2.1 —
OmnisGM, лицензия CC BY 4.0.

The text is converted to the Scrying Glass card format: split into fields; units and labels are added by the app.
The meaning of the rules is unchanged.

### Mausritter

This work is based on Mausritter (https://mausritter.com), a product of Losing Games and Isaac Williams, and is licensed
for use under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence.

`resources/srd/mausritter.json` is built by `scripts/build-mausritter.ts` (`npm run build-mausritter`) from the Mausritter SRD 2.3.1
(`scripts/mausritter-srd.en.md`, https://mausritter.com/srd) and its Russian translation made for Scrying Glass
(`scripts/mausritter-srd.ru.md`; the SRD licence allows translation). / Русский перевод Mausritter SRD сделан для
Scrying Glass. The text is split into entries and cards; headings and
links are adjusted, stat blocks are split into fields. The meaning of the rules is unchanged. This is not an official
Mausritter product and is not endorsed by Losing Games.
