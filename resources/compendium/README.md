# Встроенный справочник

`fate-core.json` (правила и навыки Fate Core) собирает `scripts/build-fate.ts` (`npm run build-fate`) из
`scripts/fate-core.md` — тексты правятся там.

Файлы `dnd5e-2014.json` и `dnd5e-2024.json` (заклинания, магические предметы, черты, состояния, глоссарий правил)
собирает скрипт `scripts/import-compendium.ts` (`npm run import-compendium`). Руками их не править: изменения
пропадут при следующей сборке.

## Авторство и лицензии

This work includes material from the System Reference Document 5.1 ("SRD 5.1") and the System Reference
Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd.
Both are licensed under the Creative Commons Attribution 4.0 International License,
https://creativecommons.org/licenses/by/4.0/legalcode.

Русский перевод SRD 5.1 и SRD 5.2.1 — OmnisGM, https://rules.omnisgm.com
(https://github.com/OmnisGM-App/OmnisGM-Rules), лицензия CC BY 4.0.

Текст разбит на записи и поля (уровень, школа, время накладывания и т. п.); строки «школа, уровень, классы» и
«вид, редкость, настройка» выводятся приложением. Смысл правил не изменялся.

### Fate Core

This work is based on Fate Core System and Fate Accelerated Edition (found at http://www.faterpg.com/), products of
Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard, Jeremy Keller, Ryan
Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue, and licensed for our use under
the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).

Русский текст (`fate-core.json`) — пересказ и перевод Fate Core SRD (https://fate-srd.com/fate-core), сделанный для
Scrying Glass; примеры трюков написаны заново. Подписи ступеней лестницы и названия навыков — свои (открытого
русского перевода Fate Core нет).
