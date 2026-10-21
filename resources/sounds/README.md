# Built-in sounds

Sounds and ambience the app has out of the box (the Sounds block, ambience in Music, the tray's "+" button). The files
are read-only; in the state their paths are `sound:sfx/…` and `sound:ambience/…`. The file name is the sound's id;
its title in the app comes from the dictionary (`builtinSoundTitle` in `src/shared/sounds.ts`). Formats: .ogg — as in
the source, .m4a — re-encoded (AAC; effects from WAV — 128 kbit/s, ambience from 320 kbit/s MP3 — 112 kbit/s); the
BigSoundBank sounds are also cut and levelled (see below).

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

## BigSoundBank (`ambience/` and `sfx/`)

Recorded by **Joseph Sardin**, [BigSoundBank.com](https://bigsoundbank.com), license
[CC0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain; credit is not required — thank you!).
Taken as MP3 and changed: ambience — a 90 s stretch (or the whole recording) made into a seamless loop (its last 3 s
cross-fade into the start), levelled to about −26 dBFS RMS; effects — levelled to a −1 dBFS peak, the long ones cut to
15–20 s with a 1 s fade-out. Encoded to AAC (ambience 112 kbit/s, effects 128 kbit/s).

Ambience:

| File | BigSoundBank |
|---|---|
| Таверна | Walla Group: Strong Discussions — https://bigsoundbank.com/search?q=0685 (#0685) |
| Рынок | Outdoor Market #1 — https://bigsoundbank.com/search?q=2728 (#2728) |
| Пещера | Cave #1 — https://bigsoundbank.com/search?q=2135 (#2135) |
| Дом с привидениями | Halloween Soundscape #1 — https://bigsoundbank.com/search?q=2129 (#2129) |
| Склеп | Halloween Soundscape #2 — https://bigsoundbank.com/search?q=2130 (#2130) |
| Кузница | Anvil #1 — https://bigsoundbank.com/search?q=3589 (#3589) |
| Ночь в поле | Campaign at Night #4 — https://bigsoundbank.com/search?q=1880 (#1880) |
| Камин | Fireplace #3 — https://bigsoundbank.com/search?q=2855 (#2855) |
| Храм | Office cathedral of Chartres — https://bigsoundbank.com/search?q=0506 (#0506) |
| Пастбище | Flock of Sheep and Cows — https://bigsoundbank.com/search?q=3220 (#3220) |
| Ветер в трубе | Whistling of the Wind #2 — https://bigsoundbank.com/search?q=0155 (#0155) |

Effects:

| File | BigSoundBank |
|---|---|
| Колокол | Church Bell — https://bigsoundbank.com/search?q=0135 (#0135) |
| Набат | 4 church bells — https://bigsoundbank.com/search?q=0829 (#0829) |
| Боевой рог | Horn #5 — https://bigsoundbank.com/search?q=2524 (#2524) |
| Взрыв | Explosion far Away #1 — https://bigsoundbank.com/search?q=1023 (#1023) |
| Цепи | Heavy chain — https://bigsoundbank.com/search?q=0359 (#0359) |
| Стрелы в мишень | An arrow on a target — https://bigsoundbank.com/search?q=0548 (#0548) |
| Кнут | Complete whip #1 — https://bigsoundbank.com/search?q=2961 (#2961) |
| Удар | Punch #5 — https://bigsoundbank.com/search?q=2460 (#2460) |
| Падение тела | Body Fall #1 — https://bigsoundbank.com/search?q=2452 (#2452) |
| Точильный камень | Whetstone — https://bigsoundbank.com/search?q=0832 (#0832) |
| Вой призрака | Ghost #2 — https://bigsoundbank.com/search?q=2047 (#2047) |
| Стон нежити | Zombie #1 — https://bigsoundbank.com/search?q=2106 (#2106) |
| Ржание коня | Neighing Horse #2 — https://bigsoundbank.com/search?q=0859 (#0859) |
| Галоп | Horse gallop, tall grass — https://bigsoundbank.com/search?q=1850 (#1850) |
| Вороны | Crows #2 — https://bigsoundbank.com/search?q=0956 (#0956) |
| Сова | Tawny Owl #2 — https://bigsoundbank.com/search?q=1764 (#1764) |
| Сердцебиение | Heart Beat — https://bigsoundbank.com/search?q=0218 (#0218) |
| Безумный смех | Delirious Laughter #3 — https://bigsoundbank.com/search?q=2093 (#2093) |
| Скрип половиц | Floating Floor Squeaks — https://bigsoundbank.com/search?q=0518 (#0518) |
| Лай собак | Pack of Dogs — https://bigsoundbank.com/search?q=2953 (#2953) |
