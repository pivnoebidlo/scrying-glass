# Built-in sounds

Sounds and ambience the app has out of the box (the Sounds block, ambience in Music, the tray's "+" button). The files
are read-only; in the state their paths are `sound:sfx/…` and `sound:ambience/…`. The file name is the sound's id;
its title in the app comes from the dictionary (`builtinSoundTitle` in `src/shared/sounds.ts`). Formats: .ogg — as in
the source, .m4a — re-encoded (AAC; effects from WAV — 128 kbit/s, ambience from 320 kbit/s MP3 — 112 kbit/s), with
no other changes.

## Ambience (`ambience/`)

All 12 loops are **Nature Ambient Pack Vol 1** by **JC Sounds**, license
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: https://opengameart.org/node/180349

| File | Source |
|---|---|
| Лес днём | Forest Enviroments — Forest Day |
| Лес ночью | Forest Enviroments — Forest Night |
| Жуткий лес | Forest Enviroments — Spooky Forest |
| Костёр | Fire & Elemental — Campfire Crackling |
| Факел | Fire & Elemental — Torch Flame |
| Подземная река | Water Enviroments — Underground River |
| Море | Water Enviroments — Ocean Waves |
| Болото | Water Enviroments — Swamp |
| Дождь | Weather — Light Rain |
| Гроза | Weather — Heavy Thunderstorm |
| Зимний ветер | Weather — Winter Wind |
| Пустынный ветер | Weather — Desert Wind |

## Effects (`sfx/`)

All are [CC0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain; credit is not required, but we
thank the authors).

| File | Source |
|---|---|
| Гром | **100 CC0 SFX #2**, rubberduck — `sfx100v2_thunder_01.ogg`. https://opengameart.org/content/100-cc0-sfx-2 |
| Рычаг | same pack — `sfx100v2_switch_01.ogg` |
| Замок открылся | same pack — `sfx100v2_lock_open_01.ogg` |
| Разбилось стекло | same pack — `sfx100v2_glass_02.ogg` |
| Осыпались камни | same pack — `sfx100v2_stones_02.ogg` |
| Дверь открылась | **RPG Audio**, Kenney (kenney.nl) — `doorOpen_2.ogg`. https://kenney.nl/assets/rpg-audio |
| Дверь захлопнулась | same pack — `doorClose_1.ogg` |
| Монеты | same pack — `handleCoins.ogg` |
| Страницы книги | same pack — `bookFlip1.ogg` |
| Скрип двери | **RPG Sound Pack**, artisticdude — `world/door.wav`. https://opengameart.org/node/5311 |
| Меч из ножен | same pack — `battle/sword-unsheathe.wav` |
| Взмах оружия | same pack — `battle/swing.wav` |
| Заклинание | same pack — `battle/spell.wav` |
| Магия | same pack — `battle/magic1.wav` |
| Рык чудовища | same pack — `NPC/gutteral beast/mnstr14.wav` |
| Призрак | same pack — `NPC/shade/shade8.wav` |
| Великан | same pack — `NPC/giant/giant1.wav` |
| Вой оборотня | same pack — `NPC/misc/wolfman.wav` |
