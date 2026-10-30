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
cross-fade into the start), levelled to about −26 dBFS RMS; effects — silence at the start trimmed, levelled to a −1 dBFS
peak, the long ones cut to 6–20 s with a 1 s fade-out. Encoded to AAC (ambience 112 kbit/s, effects 128 kbit/s).

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
| Толпа на площади | Outside Talks #1 — https://bigsoundbank.com/search?q=2968 (#2968) |
| Ферма | 100 Meters from the Stall — https://bigsoundbank.com/search?q=0934 (#0934) |
| Сельская округа | Countryside — https://bigsoundbank.com/search?q=0097 (#0097) |
| Ветер в кронах | Strong wind and trees #1 — https://bigsoundbank.com/search?q=1450 (#1450) |
| Ручей | Mountain stream #1 — https://bigsoundbank.com/search?q=2754 (#2754) |
| Пруд | Pond in a Field — https://bigsoundbank.com/search?q=0691 (#0691) |
| Кипящий котёл | Boiling water — https://bigsoundbank.com/search?q=0149 (#0149) |
| Порт | Small fishing port #1 — https://bigsoundbank.com/search?q=2571 (#2571) |

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
| Звон клинков | Sword — https://bigsoundbank.com/search?q=0129 (#0129) |
| Рубящий удар | Sword That Cuts — https://bigsoundbank.com/search?q=0127 (#0127) |
| Выстрел из лука | Archery — https://bigsoundbank.com/search?q=0549 (#0549) |
| Крик боли | Cry of Pain — https://bigsoundbank.com/search?q=2361 (#2361) |
| Марш | Marching in #2 — https://bigsoundbank.com/search?q=3024 (#3024) |
| Пушечный выстрел | Explosion #2 — https://bigsoundbank.com/search?q=1808 (#1808) |
| Волшебный перезвон | Chimes "Dream" #1 — https://bigsoundbank.com/search?q=2079 (#2079) |
| Феи | Chimes "butterfly" #1 — https://bigsoundbank.com/search?q=2087 (#2087) |
| Вспышка пламени | Gasoline fire #1 — https://bigsoundbank.com/search?q=1340 (#1340) |
| Гонг | Gong, very strong — https://bigsoundbank.com/search?q=1485 (#1485) |
| Рёв дракона | Cat roar #1 — https://bigsoundbank.com/search?q=1881 (#1881) (slowed down 2.5×) |
| Петух | Rooster — https://bigsoundbank.com/search?q=0104 (#0104) |
| Куры | Henhouse — https://bigsoundbank.com/search?q=0282 (#0282) |
| Свинья | Grumpy Pig, with the Mouth #2 — https://bigsoundbank.com/search?q=1659 (#1659) |
| Корова | Cow Moos #1 — https://bigsoundbank.com/search?q=0546 (#0546) |
| Коза | Bleating Goat #1 — https://bigsoundbank.com/search?q=0279 (#0279) |
| Кошка | Meow Cat #2 — https://bigsoundbank.com/search?q=1890 (#1890) |
| Злая кошка | Growling cat #3 — https://bigsoundbank.com/search?q=1887 (#1887) |
| Летучие мыши | Cries of bats — https://bigsoundbank.com/search?q=0458 (#0458) |
| Крыса | Rat nibbling — https://bigsoundbank.com/search?q=0185 (#0185) |
| Писк мыши | Mouse screams — https://bigsoundbank.com/search?q=0459 (#0459) |
| Хлопанье крыльев | Flight of a pigeon — https://bigsoundbank.com/search?q=0476 (#0476) |
| Мухи | Solitary Bees or Flies — https://bigsoundbank.com/search?q=0101 (#0101) |
| Аплодисменты | Applause about 25-50 people #1 — https://bigsoundbank.com/search?q=0812 (#0812) |
| Детский смех | Laughter of Children — https://bigsoundbank.com/search?q=1660 (#1660) |
| Смех ведьмы | Strident Laughter — https://bigsoundbank.com/search?q=0489 (#0489) |
| Хохот огра | Laughter — https://bigsoundbank.com/search?q=0490 (#0490) |
| Стук в дверь | Door — https://bigsoundbank.com/search?q=0015 (#0015) |
| Звон бокалов | Cheers, big red wine glass #2 — https://bigsoundbank.com/search?q=1333 (#1333) |
| Наливают пиво | Beer service #2 — https://bigsoundbank.com/search?q=1933 (#1933) |
| Молоток судьи | Gavel, 3 Blows — https://bigsoundbank.com/search?q=1590 (#1590) |
| Барабанная дробь | Drum Roll 1 L — https://bigsoundbank.com/search?q=2402 (#2402) |
| Фейерверк | Fireworks #2 — https://bigsoundbank.com/search?q=2672 (#2672) |
| Хруст | Raw carrot crunched #1 — https://bigsoundbank.com/search?q=1594 (#1594) |
| Шёпот | Whisper #1 — https://bigsoundbank.com/search?q=3255 (#3255) |
| Топор по дереву | Ax on Wood — https://bigsoundbank.com/search?q=0536 (#0536) |
| Пила | Saw — https://bigsoundbank.com/search?q=0016 (#0016) |
| Ворота амбара | Wooden barn door — https://bigsoundbank.com/search?q=0538 (#0538) |
| Скрип решётки | Creaking metallic door — https://bigsoundbank.com/search?q=0616 (#0616) |
| Скрип верёвки | Big rope — https://bigsoundbank.com/search?q=3426 (#3426) |
| Всплеск | Splash, Big #3 — https://bigsoundbank.com/search?q=1521 (#1521) |
| Шаги по листве | Feet in Leaves #1 — https://bigsoundbank.com/search?q=0137 (#0137) |
| Шаги по доскам | Man Footsteps on the Wooden Floor — https://bigsoundbank.com/search?q=0165 (#0165) |
| Треск веток | Broken twigs #1 — https://bigsoundbank.com/search?q=1299 (#1299) |
