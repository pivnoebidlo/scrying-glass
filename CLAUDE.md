# Scrying Glass

Electron-приложение для мастера D&D: окно управления у мастера и экран игроков на втором мониторе
(портреты, фон, карты с туманом войны, музыка и атмосфера, сцены, трекер инициативы).

## Общение и стиль
- Пользователь говорит по-русски, обращаться на «ты».
- Since 0.27.0 the project is going multilingual (decided 2026-10-16):
  - commit messages — in English (title + list of changes + the `Co-Authored-By` line, see git log);
  - code comments — in English for new and changed code (old Russian comments are not rewritten en masse);
  - interface text — never hard-coded: `t('key')` (see «Локализация» below); English and Russian are written
    together; Russian UI text — на «вы»/безличные, English — plain and short;
  - README — English `README.md` + Russian `README.ru.md`; a feature change updates both.
- Интерфейс в духе Obsidian.

## Локализация
- Core — `src/shared/i18n/core.ts`: languages `LANGS` (en, ru), `resolveLang` ('auto' → OS language if we have it,
  else **English**), plural forms through `Intl.PluralRules` (`{ one, few, many, other }`, picked by `params.count`),
  `{placeholders}`. Messages: `src/shared/i18n/app.ts` (shell, module titles, tile actions, badges) — `en` is the
  source of truth, `ru: Messages<typeof en>` (a missing key fails the type check); merged in `shared/i18n/index.ts`
  (`tr(lang, key, params)`, non-reactive `t` for the main process and plain code).
- Dictionaries by part: `shared/i18n/app.ts`, `modules/<module>/i18n.ts` (key prefix — the module or a short form:
  `adv.`, `init.`, `cmpui.`, `best.`…), `systems/i18n.ts` (`dnd.`, `fcore.`, `sys.`), `main/i18n.ts` (`core.` —
  system dialogs, errors, default file names). New dictionary — import and spread into `en` / `ru` in
  `shared/i18n/index.ts`.
- Windows: `t` from `renderer/lib/i18n.svelte.ts` (reactive `locale.lang`, set by `store.svelte.ts` from
  `vault.lang`). Module titles and file actions in `control.ts` are getters (`get title() { return t(…) }`).
  Shared code (`shared/`, `systems/`, module `main.ts`, anything the main process or tests import) uses the shared
  `t` from `shared/i18n`; it is still reactive in the windows: `trackLang` makes it read `locale.lang`.
- Label tables in shared code are getters, not values: `labels(keys, prefix)` (record of getters — abilities,
  ladders, ratings), `get title()` in object literals. Never spread a getter (`...obj` evaluates it once).
- What is not translated: data (names, folder names, entry files, select options of compendium fields, conditions
  already set on a combatant), stat block labels (`systems/dnd5e/stats.ts` `dict(card.lang)` — the card language),
  spellcasting text of a card (`spells.ts`). Tests that check Russian text call `setLang('ru')` in `beforeAll`.
- Updates: `main/updates.ts` (GitHub `/releases/latest`), compare — `shared/updates.ts` (`isNewer`); setting
  `settings.updates` (`check`, `skip`), IPC `updates:*`; on launch (5 s later) — event `updates:available` →
  `renderer/control/UpdateBanner.svelte`; the General settings section has the switch and «Check now».
- Theme of the control window: `settings.theme` ('auto' | 'dark' | 'light' | 'parchment' | 'space' | 'neon', `THEMES` in shared/vault.ts),
  action `vault/setTheme`, state `vault.theme`; the core sets `nativeTheme.themeSource` and the window background
  (`applyTheme`), the window — `<html data-theme>` (`applyTheme` in store.svelte.ts, the last one cached in
  localStorage for the next launch). Colours — only tokens in `renderer/lib/theme.css` (incl. `--warning`,
  `--success`, `--on-accent` — text on an accent background: dark on the cyan of space); hard-coded colours only on pictures and on the player screen.
- About: `shared/about.ts` (addresses, `CREDITS` — attribution the CC BY licenses require; only these links open,
  IPC `app:openLink`), section `renderer/control/About.svelte` (settings section `about`). The app menu — `main/menu.ts`
  (`buildMenu`, in the interface language, rebuilt on a language change; «About» / «Settings…» → event
  `app:openSettings`; the macOS About panel — `setAboutPanelOptions`).
- Setting: `settings.language` in settings.json ('auto' | lang), action `vault/setLanguage`, state `vault.language`
  (setting) and `vault.lang` (resolved); section «General / Общие» in the settings window (`Settings.svelte`).
- Migration plan: 1) foundation + shell (done); 2) modules, systems, main process (done); 3) built-in content in English (done: compendium
  SRD, random tables, Fate; the bestiary was bilingual already); 4) README in English + README.ru.md (done).
- Built-in content by language: compendium books `resources/compendium/<system>.<lang>.json` (a window shows the
  interface language, else English; `en` / `ru` — the title in the other language, found by search and [[links]]),
  built-in sounds — the file name is the id, the title is `builtinSoundTitle` (`shared/sounds.ts`, keys `sounds.builtin.*`).

## Команды
    npm run dev        # разработка (окна перезагружаются при сохранении)
    npm run build      # сборка в out/
    npm start          # запуск собранной версии
    npm run typecheck  # svelte-check: проверка типов .ts и .svelte
    npm test           # тесты ядра (vitest, tests/*.test.ts): кубы, порядок, инициатива, карты, хранилище
    npm run import-srd # пересобрать встроенный бестиарий resources/srd/ из SRD (нужен интернет)
    npm run import-compendium # пересобрать встроенный справочник resources/compendium/ (нужен интернет)
    npm run build-fate # встроенный справочник Fate: resources/compendium/fate-core.<lang>.json из scripts/fate-core.<lang>.md
    npm run dist       # установщик для своей системы в dist/ (настройки — electron-builder.yml)
    npm run icon       # build/icon.png из build/icon.svg (рисует Electron: ImageMagick не умеет градиенты SVG)

Перед коммитом: `npm run typecheck`, `npm test` и `npm run build` без ошибок. Тесты — для чистых функций и
действий модулей (`tests/helpers.ts`: контекст без Electron, дерево хранилища из путей, вызов действия); Electron
и окна в них не поднимаются. Vitest 3.2 — он работает поверх Vite 7, который нужен electron-vite.

## Выпуск
- GitHub, публичный репозиторий, лицензия GPL-3.0-or-later. Сборки только 64-битные: macOS arm64 и x64 (dmg),
  Windows x64 (nsis), Linux x64 (deb, rpm, AppImage). Тег `v<версия>` (равна version в package.json) запускает
  `.github/workflows/release.yml` → черновик релиза. `check.yml` — типы, тесты и сборка на каждый push в main.
- Не подписываем (пользователь решил пока так): macOS — ad-hoc подпись (`identity: '-'`), без нотаризации.
- В package-lock.json однажды оказалась испорченная версия caniuse-lite (`1.0.4.001815` вместо `1.0.30001815`):
  локально всё ставилось из кэша, а `npm ci` на GitHub упал с 404. Если npm пишет EINVALIDTAGNAME или 404 на
  странную версию — чинить запись в lock-файле, а не обходить через `overrides`.

## Стек и версии (не обновлять вслепую)
- Electron 44, electron-vite 5 (требует Vite ≤ 7), Svelte 5 + @sveltejs/vite-plugin-svelte 6, Lucide (@lucide/svelte).
- TypeScript 6, а не 7: svelte-check пока не поддерживает TS 7 (у него нет старого JS API).
- Electron 44 не скачивает бинарник при установке, это делает `postinstall` (`node node_modules/electron/install.js`).

## Устройство
- `src/main/` — ядро: единое состояние, хранилище (vault), сохранение, окна (`windows.ts`), отдача файлов
  по протоколу `sg-asset://v/<путь>` с поддержкой Range (`assets.ts`), перенос данных 0.3 (`migrate.ts`).
  `?w=<ширина>` — миниатюра (`thumbs.ts`, кэш в `<userData>/thumbs`, адрес даёт `thumb()` из `shared/vault.ts`):
  в плитках и списках окна мастера; на экране игроков — только полные картинки.
- `src/preload/` — `window.api`. `src/shared/` — типы; `AppState` и типы действий выводятся из списка модулей.
- `src/renderer/control/` — оболочка окна управления (полоса модулей, боковая панель, вкладки, правая панель
  «Экран игроков», настройки ⌘,). `src/renderer/display/` — окно игроков. `src/renderer/lib/` — общее:
  `store.svelte.ts`, `Stage.svelte` (сцена игроков, она же превью), `ImageCard`, `Slider`, `contrib.ts`, `nav.ts`.
  Плитки картинок и записок по щелчку игрокам ничего не показывают (только кнопки на плитке; подписи кнопок — свои
  `.tip`, сразу при наведении); двойной щелчок по картинке — просмотр крупно у мастера: `viewImage(путь, плитка)` из
  `lib/view-image.svelte.ts` (соседние — элементы `data-view` той же сетки), окно — `Lightbox.svelte` в `App.svelte`
  (← →, Esc, те же `imageActions`; короткие подписи кнопок — `FileAction.tip`). Двойной щелчок по записке —
  редактор. Подборка правой панели по щелчку по-прежнему показывает.
  Название под плиткой — `lib/NameField.svelte` (правка на месте). Переименование файла — IPC `vault:rename`
  (`renameFile`): `renamePath` (shared/vault.ts) правит путь в состоянии всех модулей синхронно, до того как
  наблюдатель увидит пропажу, и `renameVaultImage` — портреты карточек. Портрет: есть своя карточка — меняется её
  название (`bestiary.rename`), иначе файл (`portraits/ui/rename.ts`); `portraits.names` (ручные подписи) больше не
  пополняются, старые показываются и стираются при переименовании. `prettyName` не трогает регистр имени, где уже
  есть заглавные. Вид подписи у игроков — `portraits.plate` (тень, лента, свиток, табличка; цвет; шрифт из
  `NOTE_FONTS`), рисует `portraits/ui/NamePlate.svelte` (размеры в em — и на экране, и образцом в настройках; у игроков — во всю ширину
  картинки: `--pw` от `imageWidth` в `Layer.svelte`).
  Стрелки в списках боковой панели — действие `listNav` (`lib/listnav.ts`) на всей панели: модуль только помечает
  пункты `data-nav` (+ `data-depth` в деревьях, `aria-expanded` у папок; ↑ ↓ выбирают щелчком, папку — только
  наводят). Дерево «Файлов» обрабатывает стрелки само (`Tree.svelte`, пункты без `data-nav`).
- `src/modules/<имя>/`:
  - `main.ts` — `defineModule`: состояние, действия, хуки `init` / `onTreeChange`, `persist`.
  - `control.ts` — `defineControl`: иконка, `view`, `sidebar`, `screen` (блок в правой панели) и `screenEmpty`
    (строка «нет» — пустой блок свёрнут; свёрнутые мастером блоки помнит `workspace.screenClosed`), `settings`,
    `imageActions` / `audioActions`, `background` (невидимый компонент: проигрыватель, горячие клавиши).
  - `display.ts` — `defineDisplay`: слой экрана игроков с `order` (фон 10, карта 15, портреты 20, раздатка 25, инициатива 30).
  - `ui/` — Svelte-компоненты.
- Новый модуль: папка + одна строка в `src/modules/index.ts`; `control.ts` / `display.ts` подхватываются сами.
- Карточки (монстры, NPC, позже персонажи): формат в `src/shared/cards.ts` — общая обёртка (`system`, `lang`,
  `origin` — перевод/вариант, портреты, заметки) + блок `stats`, который описывает система (`src/systems/<система>/`:
  типы, подписи на разных языках, статблок; реестры `systems/index.ts` и `systems/ui.ts`). Неизвестная система
  показывается как «поле — значение». Одна карточка — один язык, перевод — отдельная карточка с `origin`.
- Где карточки: встроенный SRD `resources/srd/*.json` (только чтение, собирает `scripts/import-srd.ts` из
  5e-bits/5e-database + русского перевода OmnisGM, оба под CC BY 4.0, авторство — `resources/srd/README.md`),
  библиотека `<userData>/library/cards/`, в хранилище — *.json в папках бестиария (роль `bestiary`: monsters / монстры /
  bestiary / …) любого приключения; картинки с диска копируются рядом с карточкой. Место своей карточки — `Place`
  (библиотека или папка бестиария), выбирается в окне `PlacePicker`. Карточки NPC лежат в папках characters рядом
  с портретом; карточка привязана к портрету, если он у неё основной (`bestiary.cardFor`). Добавление в инициативу —
  `bestiary/ui/combat.ts` (портреты карточки раздаются по очереди; у участника своя картинка, сменить — `AvatarPick`). Портреты из characters вместе с карточкой не удаляются (это файлы пользователя).
  Портреты встроенных карточек — в `<библиотека>/srd.json` (ключ — оригинал, общий для переводов), картинки в
  `images/` библиотеки; поэтому корень SRD для картинок = корень библиотеки (`scopeRoot`, `cardAsset`).
  Правка встроенной карточки (как у справочника): `saveCard('srd', …)` пишет карточку библиотеки с полем
  `overrides: <id SRD>` (портреты — по-прежнему в srd.json); `loadLibrary` убирает такие файлы из карточек
  библиотеки в `overrides`, `applySrd` подставляет их содержимое под ссылкой `srd:<id>` (origin и source — от
  встроенной), в списке — `edited`. «Вернуть как в SRD» — `revertSrd` (IPC `cards:revertSrd`, файл — в корзину).
  Редактор встроенной — `Draft.scope = 'srd'`, картинки — через `imageScope`. Перенос .sgpack правки не берёт. Ядро держит их в
  `src/main/cards.ts` вне `AppState` (их сотни, а состояние рассылается после каждого действия); окна берут
  краткий список и полную карточку через `window.api.listCards()` / `getCard(ref)`, пишут через `saveCard` и др.
  id своей карточки хранится в файле (нет или повторяется — производный от пути), файл называется по названию
  карточки. Карточки 0.9 из `.scrying-glass/cards` переносятся в `monsters/` в корне (`migrateHiddenCards`). Картинки карточек: пути от корня библиотеки (`sg-asset://l/…`) или хранилища.
  Вкладка модуля bestiary называется «Карточки» (в ней и NPC, и персонажи партии); «бестиарий» — роль папок и SRD.
  Редактор: `modules/bestiary/ui/CardEditor.svelte` (общая часть) + редактор системы из `systems/ui.ts`.
  Просмотр карточки — `CardView.svelte` (сам грузит карточку по ссылке): во вкладке бестиария и в выдвижной панели
  `CardDrawer` (`bestiary.show(ref)` — открыть её откуда угодно; рисует фоновый компонент бестиария).
- Колдовство в статблоке D&D: `Dnd5eStats.spellcasting` (`systems/dnd5e/spells.ts`: характеристика, СЛ и атака —
  пусто = от характеристики и БМ, группы «заговоры» / «по желанию» / «N/день» / «уровень и ячейки»). Статблок
  показывает его последним блоком особенностей или действий (`spellBlock`, курсивные названия → ссылки `spellLinks`,
  кнопка атаки), редактор — `SpellEditor.svelte` (подсказки названий — `knownSpells` из `entry/peek.svelte.ts`;
  колдовство, записанное текстом, как в SRD, переносит `parseSpellcasting`). Встроенные карточки SRD не переделаны:
  у них колдовство — текстом (в английском SRD 2024 списки дописывает `import-srd.ts` из структуры `spellcasting`
  базы 5e-database — `spellLines`; в `desc` там только вступление).
- Броски: `shared/dice.ts` (разбор «2d6+5», к20 с преимуществом/помехой, крит, 4dF — `rollFate`; лестница Fate —
  `systems/fate/ladder.ts`), журнал `renderer/lib/rolls.svelte.ts`
  + `RollLog.svelte` — только в окне управления, вне `AppState` (игрокам не показываются). Кнопки — в `StatBlock` и
  `CharacterSheet` (атака — `Block.attack`, у персонажа бонус и урон разбираются из строк листа).
- Картинки вне хранилища (библиотека карточек) в портретах и инициативе — строки «library:<путь>», адрес даёт
  `assetUrl` из `shared/vault.ts`. Переводы карточек группируются по `origin.id` между местами хранения.
- Персонажи игроков: карточка `kind: 'character'`, в `stats` — лист (`systems/dnd5e/character.ts`, вид
  `CharacterSheet.svelte`); система различает лист и статблок по форме (`isCharacter`). Лежат в папках роли
  `party`, сторона «партия». Импорт из Long Story Short — `systems/dnd5e/lss.ts` (тексты LSS — документы
  TipTap/ProseMirror), повторный импорт и «Обновить из LSS…» у карточки
  обновляют её через окно «Что изменилось» (`bestiary/ui/LssUpdate.svelte`, разница листов — `systems/dnd5e/diff.ts`; как слияние в git — галочки у
  изменений и строк списков, итог — `mergeCharacter`, уходит в `updateFromLss(…, merged)`; заклинания-карточки LSS
  в экспорте — только id: названия — из таблицы мастера `<библиотека>/lss-spells.json` (`collectLssSpells` находит
  заклинания в любом сохранённом ответе API LSS, IPC `lssSpells:*`, раздел в настройках «Карточки»; в репозиторий
  её не кладём — это данные LSS), ненайденные — в `warnings` `fromLss`):
  `importCards` не трогает персонажа, у которого есть карточка (`lssMatch`: `links.lss` — id LSS есть только в адресе
  аватарки, иначе то же имя в той же папке), а возвращает `matches`; `updateFromLss` (IPC `cards:updateFromLss`,
  `cards:pickLss`, `cards:readLss`) пишет новый лист, прежний файл — в корзину. Редактор листа —
  `CharacterEditor.svelte` (смена вида карточки в редакторе переключает статблок и лист).
- Обмен карточками: один JSON `{ scryingGlass: 'cards', version: 1, cards, images }` с картинками в base64
  (`exportCards` / `importCards` в `main/cards.ts`); при импорте id новые, `origin` внутри файла переписывается.
- Хранилище — папка пользователя с деревом любой глубины. Назначение папок по названию: characters, party, backgrounds,
  handouts, maps, music, bestiary. Названия по умолчанию — `DEFAULT_ROLES` в `shared/vault.ts`; свои пользователь задаёт
  в настройках «Файлы» (`settings.roles` в settings.json приложения, общие для всех хранилищ, действие `vault/setRoles`).
  `folderRole()` читает текущие названия из `setRoleNames`: ядро ставит их из настроек, окна — из `vault.roles` при
  каждом обновлении состояния. Первое название роли — основное: с ним приложение создаёт папки. В подсказках писать
  названия через `RoleFolderNames.svelte`, а не вручную.
  Данные приложения — `<хранилище>/.scrying-glass/state.json`, пути относительные. Файлы пользователя приложение
  само не меняет и не удаляет. Исключения: файлы карточек (их создаёт и правит редактор) и удаление по явной
  команде пользователя — только в корзину приложения, с подтверждением (действие `vault/trash`).
- Корзина приложения, как в Obsidian (`main/trash.ts`, типы — `shared/trash.ts`): удалённое переезжает в скрытую
  `.trash` своего места — хранилища или библиотеки (`.trash/<id>/.meta.json` + файлы по прежним путям); системная
  корзина не используется. Туда идут файлы хранилища (`vault/trash`), записи справочника библиотеки (`library:trash`),
  карточки с их картинками (`deleteCard`; при переносе карточки — насовсем) и приключения (`adventures:delete`:
  в `data` — его сцены, заготовки, разметка карт, порядок, подписи; `trash:restore` возвращает их, `remap` при
  занятом названии). Окно — «Файлы» → «Корзина» (`vault/ui/TrashView.svelte`, список — `trash.svelte.ts`, событие
  `trash:changed`). Снимки и полные копии `.trash` не берут (скрытые папки пропускаются). Удалять — через `discard`:
  он смотрит настройки (`settings.trash` в settings.json, `TrashSettings`: `keep: false` — сразу насовсем, `days` —
  автоочистка `pruneTrash` при открытии хранилища, смене настроек и раз в час); тексты подтверждений — `deleteWords`.
  Настройки — «Файлы» → «Корзина» (`TrashSettings.svelte`), IPC `trash:settings` / `trash:setSettings`.
- Приключения (`modules/adventures`, правила — `shared/adventures.ts`): отмеченные папки первого уровня и текущее
  приключение (в `state.json`). Вкладки фильтруют содержимое через `visibleIn` (своё приключение + «общее» вне
  приключений), подписи групп — `placeTitle`; «Файлы» показывают всё (дерево — стрелки в `Tree.svelte`; выбор папки
  приключения или папки внутри него делает его текущим — `followAdventure` в `vault/ui/ui.svelte.ts`). Стандартные папки (`STANDARD_FOLDERS`, на
  английском) создаёт действие `ensureFolders` при открытии хранилища. Сцена хранит `adventure` (нет — общая) и части `include` (фон, карта, портреты, раздатка, музыка, атмосфера;
  старые сцены дополняет `init` модуля scenes).
  Переключатель — `header` модуля, оболочка рисует его над любой боковой панелью.
- Ролевая система: у приключения своя (`adventures.systems`, ключ — папка, '' — всё хранилище и общее; нет —
  `DEFAULT_SYSTEM`), выбор — `SystemSelect` в меню приключения и при создании. Системы и семейства (`family`: редакции
  D&D 2014/2024 — одно семейство) — `systems/index.ts` (`FAMILIES`, `familyOf`, `isDnd`); правила —
  `systemFor` / `currentSystem` / `inCurrentFamily` в `shared/adventures.ts`. По семейству текущего приключения
  фильтруются: карточки бестиария (фильтр — только редакции семейства), подсказки боя и меток (`suggest`), ⌘K,
  справочник (`fitsHere`: поле `system` записи, иначе `family` типа — заклинания и т. п. D&D, правила и заметки —
  любые; встроенный SRD — только в D&D, `srdHere`; типы — `typesHere`). Инструменты D&D (сложность боя, покупка
  характеристик) и плашка сложности — только в D&D. Система уходит в .sgpack (`manifest.system`) и в корзину с
  приключением.
  Встроенный справочник Fate — `resources/compendium/fate-core.<lang>.json` (`npm run build-fate` из
  `scripts/fate-core.<lang>.md`, тексты свои по Fate Core SRD, CC BY 3.0; тип `skill` — семейство fate); встроенные записи показываются по семейству
  системы приключения (`editionShown` в store справочника), выбор редакции SRD — только у D&D.
  Fate Core: карточка — `systems/fate/stats.ts` (`FateStats`: `tier`, концепция, проблема, аспекты, навыки
  текстом с числом, трюки, восстановление; стресс и последствия — по правилам `stressOf` / `consequencesOf`, если не
  заданы явно; очерёдность — Внимательность или `initiativeSkill`), вид `Sheet.svelte` (броски `rolls.fate`),
  редактор `Editor.svelte`; один вид для всех `kind`. Чужой блок stats у карточки Fate — общий вид (`fits` в `systems/ui.ts`).
- Mausritter (третья система, в работе; SRD 2.3.1, CC BY 4.0 — атрибуция дословно в `about.credit.mausritter`):
  `systems/mausritter/` — `stats.ts` (`MausStats`: hp — Hit Protection, str/dex/wil, armour, attacks `d6/d8`,
  critical, abilities, wants, `warband`; у мыши `sheet` — уровень, XP, пипсы, 10 клеток `slots` (лапы 2, тело 2,
  рюкзак 6; сверх — перегружена), состояния в клетках, `grit`; `parseStatBlock` — статблок SRD текстом), `Sheet.svelte`
  (щелчок по СИЛ/ЛОВ/ВОЛ — спасбросок `rolls.save` / `rollSave`: к20 ≤ хар., преимущество — меньший), `Editor.svelte`,
  трекер `tracker.ts` + `TrackerCells.svelte`: у участника `attrs` (сейчас / максимум), урон сверх защиты уходит в
  СИЛ (`changeHp`), `setAttr`; выбыл при СИЛ 0 (`down`); очерёдность 2 / 1 (противники) / 0, бонус — ЛОВ
  (`bonus.from`: отдельного поля нет); состояния ведут в запись «Conditions».
  Встроенное: `npm run build-mausritter` (`scripts/build-mausritter.ts` из `scripts/mausritter-srd.<lang>.md` — SRD
  2.3.1 целиком, CC BY 4.0, и наш перевод) → `resources/srd/mausritter.json` (11 существ × 2 языка, русские —
  `<id>.ru` с `origin`, числа и кубы — из английского статблока; таблицы вариантов — в `description` жирными
  строками: заголовков разметка карточек не знает) и `resources/compendium/mausritter.<lang>.json` (главы →
  `category`, разделы `##` → записи, у главы — запись-оглавление; заклинания — тип `mspell` с `recharge`; «Terms of
  use» не копируется). Русский файл повторяет заголовки оригинала один в один: пары записей — по порядку (`en` / `ru`),
  скрипт сверяет число записей и существ. Глоссарий перевода: защита (ЗЩ), СИЛ/ЛОВ/ВОЛ, пипсы (п), ход / раунд /
  стража, состояния «Измотан / Напуган / Голоден / Ранен / Опустошён», к6, [СУММА] / [КУБЫ]. У русской карточки кубы
  показываются «к8» (`Sheet.svelte`). [[Ссылка]] на карточку по имени —
  `bestiary.named` (сначала системы приключения: «Owl» есть и в D&D).
- Аспекты сцены и жетоны судьбы — модуль `modules/fate` (состояние: `aspects` с `invokes` / `hidden`, `holders` —
  персонажи с `points` / `refresh`, `gm` — запас мастера, `show`). Блок правой панели `OnScreen.svelte` и слой игроков
  `Layer.svelte` (order 32; угол — `place`, выбор — `CornerPick.svelte`, в одном углу встают друг под другом) — только в приключениях Fate (`fateHere`; блок
  прячет `screenWhen` из контрибуции). «Партия» — `ui/party.ts` (карточки Fate в папках партии, восстановление из
  карточки), «Новая сессия» — до восстановления, «Новая сцена» у мастера — по жетону на персонажа.
  Ненужные системы отключаются в настройках — раздел «Ролевые системы» модуля приключений (`settingsTitle` в `contrib.ts`, `adventures/ui/Settings.svelte`): `settings.systemsOff` в
  settings.json приложения → `vault.systemsOff` → `setSystemsOff` в `systems/index.ts` (ядро — из настроек, окна — в
  `store.svelte.ts`, как названия ролей; все отключить нельзя). Контента отключённой системы не видно нигде:
  `SystemSelect` её не предлагает (`enabledSystems`), `inCurrentFamily` скрывает карточки, справочник — редакции SRD
  (`editionsHere` / `editionNow`). Приключение с отключённой системой скрыто целиком (`adventureHidden`,
  `shownAdventures`): переключатель, дерево «Файлов», `visibleIn` (и во «Всём хранилище»), `scenesFor`, заготовки,
  списки выбора приключения; открытое — `Ensure.svelte` переключает на всё хранилище. Приключение без своей системы —
  с системой хранилища, а без неё — `DEFAULT_SYSTEM` (старые приключения — D&D); само «Всё хранилище» с отключённой
  системой берёт `defaultSystem()` (первую включённую). Ядро (экспорт, снимки) ничего не скрывает.
- Трекер системы (`SystemDef.tracker`, тип — `systems/tracker.ts`; `dnd5e/tracker.ts`, `fate/tracker.ts`): подписи
  очерёдности и бонуса, кнопка «Бросить за NPC» (`roll.value` — действие `rollNpcs` получает `system`), состояния
  (список D&D или свободные аспекты Fate), числа участника `fields` (быстрое добавление и заготовка; складывать —
  `fromFields`), участник из карточки — `fromCard`. Ячейки строки боя — компонент `trackerCells` из `systems/ui.ts`
  (рисует свои `<td>`, `head` — `<th>`; стили таблицы в `View.svelte` поэтому `:global`). У участника Fate —
  `stress` (дорожки клеток), `consequences`, `out`; действия `toggleStress`, `setConsequence`. Выбыл и насколько
  ранен — `down` / `woundOf` в `initiative/order.ts` (полоса игроков и жетоны), новый бой — `refreshed`.
- Карты (`modules/maps`): у карты (`MapData`, по пути) туман операциями, обзор игроков, сетка и метки `pins`
  (доли размера карты; `shown` — видят игроки, заметка только у мастера; старые сохранения дополняет `init`).
  Рисование — `render.ts` (`drawMap`, `drawPins`) общее для редактора и экрана игроков; метки у игроков поверх
  тумана. Панель меток в редакторе — `PinPanel.svelte`, выбранная метка — `ui.pin`. Значки меток — контуры Lucide
  в `maps/icons.ts` (собраны из файлов @lucide/svelte: canvas нужны строки путей). `cards` метки — ссылки на
  карточки (`PinCards.svelte`, поиск — `suggest` из инициативы). Жетоны `tokens` (`maps/tokens.ts`): копия
  участника боя + `combatant`, живые имя/портрет/ход/ранения берёт `tokenViews` из `app.initiative`; рисуются в
  `drawMap` через `underFog` (у игроков туман их прячет), привязка к сетке — `snap`, панель — `TokenPanel.svelte`.
  Форма сетки — `Grid.shape` (квадраты / гексы вершиной или гранью вверх; геометрия — `maps/grid.ts`: шаг — расстояние между центрами соседей, сдвиг `ox` / `oy` — доля периода узора `periodOf`, у гексов по одной оси √3 шага; `gridPath` рисует для редактора и игроков, `nearestHex` — привязка жетонов). Вид сетки — `Grid.width` / `color` / `alpha` (`GRID_STYLE` по умолчанию, панелька под кнопкой-палитрой в редакторе).
  Масштаб жетонов карты — `tokenScale` (`tokenCell`); жетоны не из боя — по карточке (`CardSearch.svelte`, общий
  с метками) и «Партия»; место — `placeTokens` в редакторе (свободные клетки вокруг середины обзора).
- Инициатива: текущий бой (`combatants`) и заготовки боёв (`encounters`, у каждой `adventure`). Действия `add` /
  `update` / `remove` принимают `encounter` — тогда меняют заготовку; `startEncounter` копирует участников в бой.
  Какая заготовка открыта — `initiative/ui/ui.svelte.ts` (не в состоянии). Быстрое добавление и «Партия» —
  `QuickAdd.svelte` + `quick.ts`, общие для боя и заготовки. `window.prompt` в Electron не работает.
  Стороны: партия, союзник, нейтрал, противник (`CardSide`, подписи — `SIDE_TITLES`). Полоса на экране игроков —
  `initiative/ui/Layer.svelte`, вид — `display` в состоянии (размер, имена, ранения, положение; старые сохранения
  дополняет `init`), быстрые кнопки — `StripControls.svelte`; `hideWounds` у участника скрывает его ранения. Превью в правой панели при
  закрытом экране затемнено: для снимка снять класс `closed` у `.preview` и увеличить `.stage-box`.
- Инструменты (`modules/tools`, без своего состояния): мастерская для подготовки к игре, первый инструмент — записки.
  Список инструментов — `tools/ui/registry.svelte.ts` (`TOOLS`: id, значок, название, `families` — системы; без них —
  общий). Боковая панель рисует по разделам: записки, общие, раздел семейства приключения, «Другие системы» (включённые
  вручную — `extra`, localStorage окна, раздел настроек `tools/ui/Settings.svelte`); страница — `PAGES` в `View.svelte`,
  скрытый в этой системе инструмент открывает записки (`shown`). Новый инструмент — строка в `TOOLS` и в `PAGES`.
  Записка — файл `….note.json` в папке раздатки (формат и подписи — `shared/notes.ts`, `FileKind` 'note'), ядро
  читает и пишет её через `main/notes.ts` (IPC `notes:*`, после записи — пересканирование хранилища и событие
  `vault:rescanned`, по нему окна перечитывают записки — `renderer/lib/note/notes.svelte.ts`). Вид — `NotePaper.svelte`
  (бумага SVG-фильтрами, размеры в cqw — одинаково на плитке и у игроков), разметка — `note/markup.ts`; следы
  (`marks`: кровь, отпечатки, подпалины, дыры… — виды и цвета `NOTE_MARKS` / `NOTE_TINTS`) и складки (`crease`) рисует
  `note/marks.ts` SVG-строками по зерну (слои multiply и normal поверх текста; дыры — CSS-маска `data:`, поэтому в CSP
  окон `img-src … data:`); ставят и двигают их в редакторе (проп `edit` у `NotePaper`). Печать и штамп — тоже следы
  (`text`, `emblem` — знаки из `shared/emblems.ts`, собраны из Lucide; `broken`), печать — в слое `top` без обрезки
  краем; старые поля `seal` / `sealLetter` `parseNote` превращает в след. Неровный почерк `shaky` — буквы в
  inline-block с поворотом (`shake` в `NotePaper`), шрифты (OFL,
  с кириллицей; готические шрифты Google Fonts — только латиница) — `note/fonts/` + `fonts.css`. Игрокам записку
  показывает раздатка: ядро кладёт её содержимое в `handouts.note` (окно игроков файлов не читает). Плитка —
  `tools/ui/NoteCard.svelte` (в «Раздатке», «Файлах» и «Инструментах»), редактор — `NoteEditor.svelte`, сохраняет сам.
  Таблицы случайностей сняты (0.33): их заменили генераторы; роли папок `tables` больше нет, файлы пользователя
  в таких папках и в `<библиотека>/tables` приложение не трогает (просто не показывает). Место для копии записки —
  `ui/CopyToMenu.svelte`.
  Сложность боя: бюджеты 2024 (SRD 5.2) — `systems/dnd5e/difficulty.ts`, расчёт по участникам — `initiative/difficulty.ts`
  (партия: из боя → приключения → `initiative.party` из настроек), опыт монстра — `CombatStats.xp`, уровень героя —
  `rank` карточки (`initiative/ui/heroes.ts`). Плашка — `initiative/ui/Difficulty.svelte` (в бою и заготовке),
  подробности — `DifficultyDetails.svelte`, калькулятор — `tools/difficulty/Calculator.svelte` (набросок — `calc.svelte.ts`).
  Генератор имён: правила и генерация — `shared/names.ts` (`parseListName`: файл `раса_пол_вид.txt`, `generateNames`,
  фильтры `lengthOf` / `soundOf`), страница — `tools/names/NameGenerator.svelte`, окно — `names/store.svelte.ts`
  (настройки и история — localStorage окна, избранное — `<библиотека>/names.json`). Встроенные списки —
  `tools/names/builtin/<lang>/*.txt` (написаны для приложения); свои — `<библиотека>/names/<lang>/` (`main/names.ts`, IPC
  `names:*`), в репозиторий не кладём — это могут быть списки чужих сайтов (папка `/names/` в корне — в .gitignore).
  Выгрузка TXT / CSV — общий IPC `files:saveText`.
  Путь (только D&D): `tools/travel/rules.ts` (`travel` — темп и `PACE_RATE`, таблица местности 2024 `TERRAIN_TABLE`,
  дороги, 2014 — трудная местность вдвое, долгий марш — СЛ 11, 12…, корабли `VESSEL_MPH`), `TravelCalculator.svelte`
  (редакция — по системе приключения).
  Генераторы → заготовка боя: `tools/encounter.ts` (`findCard` — карточка по названию: язык текста, система
  приключения, свои важнее встроенных; `toEncounter` — `createEncounter` + `addToInitiative`, открывает «Инициативу»;
  без числа — `groupSize` по ПО). Кнопки — у комнат подземелья и у встреч в «Случайных событиях».
  Генератор подземелий: `tools/dungeon/` — `content.ts` (en и ru парами; существа — названия карточек SRD обеих
  редакций с ПО и видами подземелий, тест проверяет; ловушки — спасбросок и тип урона), `generate.ts` (всё — индексы,
  поэтому текст на языке интерфейса; роли комнат «пяти комнат», ПО рядовых и босса по уровню, урон ловушек
  `TRAP_DICE` по SRD, клад — `generateTreasure`), `text.ts`, `DungeonGenerator.svelte`.
  Генератор магических предметов: `tools/relic/` — `content.ts` (en и ru парами; по-русски название «предмет +
  владелец в родительном», в текстах предмет — «вещь», чтобы не согласовывать род), `generate.ts` (`pickBase` —
  предмет справочника по редкости силы и категории вида), `RelicGenerator.svelte`.
  Генератор лавок: `tools/shop/` — `content.ts` (en и ru парами, товары с ценой в медяках по SRD), `generate.ts`
  (`shopGoods`: потолок цены по достатку, магические — из справочника по `MAGIC_VALUE` SRD 5.2, зелья — `isConsumable`),
  страница `ShopGenerator.svelte`; хозяин — `helpers` из store генератора поселений, цены — `coins` таверн.
  Генератор поселений: `tools/settlement/` — как NPC (`types.ts`, `generate.ts`, `content/{en,ru}.ts` — русские
  названия из основы и суффикса `fitsSuffix` или «прилагательное + существительное» по родам, `text.ts`,
  `store.svelte.ts`); таверна и жители — через `Helpers` из генераторов таверн и NPC.
  Сокровища: `tools/treasure/` — `generate.ts` (монеты, ценности, вещи, редкости магических предметов по источнику
  и уровню; `pickItems` берёт предметы из `allEntries()` справочника по `rarityOf`), тексты `content.ts` (en и ru
  парами), `text.ts`. Вне D&D — диковины из генератора NPC, без цен.
  Случайные события: `tools/events/` — один двуязычный список `events.ts` (метки: вид, местность, время, опасность,
  проверка `[навык | save:хар, СЛ]`; [[ссылки]] на карточки SRD — названия как в SRD своего языка, тест проверяет),
  генерация `generate.ts` (веса видов по опасности, слухи — из генератора таверн), текст `text.ts`.
  Генератор погоды: `tools/weather/` — модель `generate.ts` (климат по местности и сезону, дни связаны: температура
  тянется к среднему, дождь затягивается; день — коды, слова — в словаре `weather.*`), текст `text.ts` (`daySummary`,
  `dayFlavor`, `dayRules` — правила SRD только в D&D), страница `WeatherGenerator.svelte` (последняя погода — localStorage).
  Генератор мыши (только Mausritter, `ui.tool = 'mouse'`): `tools/mouse/` — `tables.ts` (таблицы SRD en/ru: прошлое по
  ЗЩ × пипсы, знаки, шёрстка, приметы; извлечены из `scripts/mausritter-srd.<lang>.md`), `content.ts` (оружие, имена —
  свои), `generate.ts` (мышь — индексы; `extraFor` — слабая мышь, `swap`), `text.ts` (правила вещи — по английской
  строке: броня, кубы, наёмник; `mouseSlots` раскладывает инвентарь, `mouseCard` → `bestiary.create(…, { system, stats })`),
  `MouseGenerator.svelte`, `store.svelte.ts` (последняя мышь — localStorage окна).
  Таблицы Mausritter (только Mausritter, `ui.tool = 'mausTables'`): `tools/maus/` — `srd.ts` (48 таблиц SRD en/ru,
  собирает `build-mausritter`: все таблицы файлов по порядку, нужные — по пути заголовков оригинала, `WANT`),
  `generate.ts` (результат — ячейки `{ table, row, col }`, текст — по языку интерфейса; `rangeOf` / `rowFor` по первому
  столбцу английской таблицы; поселение, гекс, место с комнатами, сокровища, мышь мастера, завязка, погода, реакция),
  `text.ts` (`lineText`, Markdown), `MausTables.svelte`, `store.svelte.ts` (localStorage окна).
  Фракции и счётчик исследования Mausritter — модуль `modules/mausritter` (`byAdventure[приключение | '']`: `factions`
  с целями `FactionGoal` (`marks`, `progress`, `relevant`, `rival`), `session` — итог «между сессиями» (`betweenSessions`:
  к6 + relevant − rival, 4–5 +1, 6+ +2), `clock` — ход / стража / день, `last` — бросок встречи; у бросающих действий
  четвёртый аргумент — куб, для тестов). Страница «Фракции» в «Инструментах» (`ui/Factions.svelte`, примеры SRD —
  `EXAMPLE_FACTIONS` в `tools/maus/srd.ts`), блок «Исследование» в правой панели (`ui/Clock.svelte`, `mausHere`). Данные
  приключения уходят в `.sgpack` (`PackSlices.mausritter`) и в корзину (`AdventureData.mausritter`). Наёмники — в
  «Таблицах Mausritter» (`hirelings`).
  Генератор NPC: `tools/npc/` — как таверны (`types.ts`, `generate.ts`, `content/{en,ru}.ts` — занятия и черты берёт у
  таверн, `text.ts` — Markdown и карточка, `store.svelte.ts` — с историей); «Создать карточку» — `bestiary.create(place,
  prefill)`.
  Генератор таверн: `tools/tavern/` — типы `types.ts`, генерация `generate.ts` (части `TAVERN_PARTS`, переброска с
  закреплёнными, `withPeople` — события и просьбы с именами здешних людей), содержимое `content/{en,ru}.ts` (написано
  для приложения; по-русски черты и секреты — в настоящем времени, чтобы подходили любому полу; прилагательные
  названия — по родам), Markdown для журнала — `markdown.ts`, окно — `store.svelte.ts` (таверна и закреплённое —
  localStorage окна), имена — `fullBook` из генератора имён.
  Telegram — модуль `modules/telegram` (без состояния): ядро `main/telegram.ts` (свой бот мастера, Bot API напрямую;
  токен — `settings.telegram`, шифруется `safeStorage`; опрос `getUpdates` узнаёт чаты — /start игрока, бот в группе;
  новый чат выключен, включает мастер; отправка — `sendPhoto` / `sendDocument` больше 10 МБ / `sendMessage` HTML),
  IPC `telegram:*` (снимок части окна — `capturePage`: записка картинкой — `SendDialog` на миг рисует её крупно поверх окна), чистые функции — `shared/telegram.ts`
  (`markdownToTelegram` — ещё ~~s~~, __u__, _i_, ||спойлер||; `safeTgHtml` — показ своего `html` в окне; `sortChats` —
  группы первыми; `splitMessage`, `entryToTelegram`). Входящие: опрос отдаёт `message` в `receive` —
  `incoming` (shared, только включённые чаты, без команд и ботов) → `<userData>/telegram/inbox.json` (`addToInbox`,
  последние `INBOX_MAX`; фото — `getFile`, размер `photoSize`, файлом рядом, в окно — data: URL `telegram:photo`);
  группа, ставшая супергруппой (новый id): `migrate_to_chat_id` / `migrate_from_chat_id` в обновлениях и
  `parameters.migrate_to_chat_id` в ошибке отправки (`Migrated`) — чат переезжает (`migrateChats`, `migrateInbox`),
  отправка повторяется; отправленное тоже пишется туда (`mine`, `tgIds` — номера сообщений в Telegram для `deleteSent` → `deleteMessage`,
  48 часов; картинка — уменьшенная копия `previewOf` через nativeImage); событие `telegram:inbox`, IPC
  `telegram:inbox` / `markRead` / `clearInbox` / `delete` / `hide` / `sendBytes` (вставленная или перетащенная
  картинка; при «Все» — задание `image` окна отправки). Клавиша отправки — `prefs.enterSends` (localStorage окна,
  настройки Telegram); `use:markdownKeys={{ enter, telegram }}` уступает Enter полю, где Enter отправляет, и
  добавляет клавиши Telegram Desktop (⌘U, ⌘⇧M, ⌘⇧P). Столы: `TgTable` в `settings.telegram.tables`, у чата `table`
  (`setTables` / IPC `telegram:setTables`, `withTables`); текущий стол и стол приключения — localStorage окна
  (`table`, `setTable`, `followAdventure` в tg.svelte.ts, ключ «хранилище|приключение», следит `Background.svelte`);
  видимые чаты — `chatsAt` (его и без стола) через `enabledChats` / `visibleChat`.
  Окно: `ui/tg.svelte.ts` (`sendToTelegram(job)`, `tg.inbox`, `unread`, `tg.toast`), фон модуля `Background.svelte`
  (`SendDialog.svelte` + `Toast.svelte`), `Settings.svelte`, `Compose.svelte` (страница в «Инструментах» — переписка
  с выбором чата, ответ — `reply_parameters`, «Все» — через окно отправки); кнопка на
  картинках — `imageActions` с `visible` (новое поле `FileAction`); открыть раздел настроек — `openSettings` из nav.ts.
  Расписание — модуль `modules/schedule` (без состояния; правила — `shared/schedule.ts`: `Game` с повтором `week` /
  `2weeks`, `until`, `skip`, `occurrences` по местным дням, ключ игры `occKey`, `reminderDue`, `tally`), ядро —
  `main/schedule.ts` (`<userData>/schedule.json`, общий для хранилищ; анонс — `sendButtons` с callback `rsvp:<ключ>:<ответ>`,
  ответ — `pressed` из `callback_query` бота, анонсы правятся `editButtons`; напоминания — раз в минуту, `tableChats`),
  IPC `schedule:*`. Анонс собирает `announcementText` (shared: строки по заполненным полям, `clockEmoji`, описание —
  `markdownToTelegram`; с картинкой — подпись к фото до 1024 знаков, иначе фото и текст отдельно; `Announced.caption`);
  снимок анонсированной игры — `announcedAs`, что изменилось — `announceDiff`, правка — `updateAnnouncement`
  (`editMessageCaption` / `editMessageText`, с `notify` — ответ `changesText`); смена времени — `rekey` в `saveGames`.
  Окно: страница `SchedulePage.svelte` в «Инструментах» (блока в правой панели нет — на игре он не нужен),
  загрузка — фоновый `Load.svelte`, «Начать игру» — `startGame` (приключение, `setTable`, `journal/pin`, вкладка сцен).
  Таймер — свой модуль `modules/timer` (без вкладки: блок в правой панели, слой игроков order 35, фоновый `Chime` —
  сигнал WebAudio на устройство вывода музыки); время — от часов ядра (`endsAt` идёт / `remaining` на паузе, `timeLeft`),
  окна только пересчитывают остаток по `setInterval`. Страница в «Инструментах» — `timer/ui/TimerTool.svelte`.
  Покупка характеристик: правила, расы SRD 2014 и проверка готовых значений (перебор допустимых бонусов) —
  `systems/dnd5e/pointbuy.ts` (расы — раса + подрасы, `combine`), страница — `tools/pointbuy/PointBuy.svelte`
  (набросок — `state.svelte.ts`); свои расы и подрасы — `races.svelte.ts` + `RaceEditor.svelte`, файл
  `<библиотека>/pointbuy.json` (IPC `library:readData` / `writeData`, имена файлов — по списку в main/index.ts).
- Резервные копии: снимки данных приложения — `main/backups.ts` (`<userData>/backups/<время>/`: state.json, записки,
  карточки хранилища, библиотека без `images/`, settings.json; без изменений — не делается; хранятся
  последние 20 + по одному на день за 30 дней + ручные). Когда — `snapshotNow` в main/index.ts: при открытии
  хранилища, раз в 30 минут, при выходе, вручную, перед восстановлением. Восстановление пишет файлы поверх (новые не
  трогает) и перечитывает хранилище (`openVault`) и библиотеку. Раздел настроек — модуль `backup` (без состояния).
  Приключение одним файлом: `main/packs.ts` (.sgpack = ZIP через fflate, потоком: manifest.json, state.json — срезы
  сцен/карт/заготовок/порядка/подписей, files/<приключение>/…, library/ — общие карточки по ссылкам), IPC
  `packs:export` / `packs:pick` + `packs:import` в main/index.ts (импорт в два шага: название из manifest.json без
  распаковки — `readEntry`, занято — окно в `Switcher` спрашивает другое; потом распаковка в `.scrying-glass/import-*`,
  `remap` путей, новые id сцен и заготовок, слияние в состояние модулей, `adventures/mark`). Меню —
  `adventures/ui/Switcher.svelte`. Удаление приключения — IPC `adventures:delete` (подтверждение, снимок, папка — в
  Корзину, чистка сцен / заготовок / карт / порядка / подписей, `adventures/unmark`).
  Папка снимков — `settings.backups` (`backupsDir()`; IPC `backups:dir` / `backups:chooseDir`, снимки переезжают).
  Полная копия одним файлом: `main/archive.ts` (.sgbackup: settings.json, library/… целиком,
  vault/… — структура папок всегда, файлы приложения всегда, картинки и музыка по `media`), IPC `archive:*`;
  восстановление — в текущее хранилище или выбранную папку (`placeFiles`, затем `openVault`), из настроек — только
  роли папок. Партия: «Экспорт партии…» / «Импорт персонажей…» в `Switcher.svelte` — через `exportCards` и
  `bestiary.importFiles` в папку партии приключения. ZIP потоком — общий `main/zip.ts` (`writeZip`, `readZip` с проверкой путей, `folderFiles`, `folderDirs`).
- Справочник (`modules/compendium`, без состояния): запись — Markdown с YAML-шапкой (`shared/compendium.ts`: свой
  разбор подмножества YAML — скаляры, «[a, b]», списки «- a»; ключи полей английские, подписи и типы — `TYPES`;
  название = имя файла). Роль папок `compendium`, `FileKind` 'entry' (.md только в таких папках, `main/scan.ts`).
  Ядро — `main/compendium.ts` поверх общего `main/textstore.ts` (он же у журнала: чтение, запись, создание,
  переименование, список библиотеки), IPC `compendium:*`, библиотека — `<библиотека>/compendium` («library:compendium/…»,
  событие `compendium:changed`). Окно — `compendium/ui/store.svelte.ts` (`resolveEntry` для [[ссылок]]: приключение →
  общее → библиотека; не нашлось — карточка по имени), `ui.svelte.ts` (`openEntry` — открыть откуда угодно).
  Вид записи — `renderer/lib/entry/EntryCard.svelte` (у игроков — `players`, шрифт уменьшается до помещения),
  разметка — `entry/markup.ts`. Игрокам — через раздатку: `handouts/toggleEntry` кладёт запись целиком в
  `handouts.entry` (запись может лежать в библиотеке), `updateEntry` — после правки, `move` — после переименования.
  Встроенные записи — `resources/compendium/<система>.<lang>.json` (SRD 5.1 / 5.2.1: английский оригинал и
  перевод OmnisGM, собирает `scripts/import-compendium.ts` из Markdown OmnisGM-Rules; статблоки существ внутри предметов остаются в тексте
  предмета). Ядро отдаёт их целиком (`compendium:builtin`), пути «srd:<система>/<тип>/<название>». Сами файлы
  не меняются: «Править» сохраняет правку — запись библиотеки с полем `overrides: <система>/<тип>/<название>`
  (`OVERRIDES`, `overrideOf` в store), она заменяет встроенную в `allEntries` / `entryAt` и видна с её редакцией;
  удалить её — «Вернуть как в SRD». «Копия в…» убирает `overrides` (отдельная запись), у записи есть `en` (английское название — для поиска и ссылок). Редакция — фильтр
  `srd.edition` в store (localStorage окна, по умолчанию 2024); ссылка находит встроенную и в скрытой редакции.
  Связи: общее состояние — `renderer/lib/entry/peek.svelte.ts` (`peekEntry(названия)` / `peekEntryAt(путь)` —
  выдвижная панель записи откуда угодно; указатель названий заклинаний `setSpellIndex`). Действие `use:spellLinks`
  (`entry/links.ts`): 'em' — курсив с названием заклинания в `StatBlock`, 'text' — названия в `.spells` листа;
  MutationObserver пересобирает ссылки после перерисовки. Фоновый компонент справочника `EntryDrawer.svelte` грузит
  записи, заполняет указатель и рисует панель (с панелью карточки — одна из двух, «назад» к карточке), в нём же
  `QuickSearch.svelte` (⌘K: записи + `bestiary.all`). Состояния трекера → записи — `CONDITION_ENTRY` в
  `systems/dnd5e/conditions.ts` (через `tracker.conditions.entry`). Другие названия — поле `aliases` (`altNames` в store: английское + aliases).
  Картинка записи — поле `image` (`IMAGE_FIELD`, `entryImage`; путь хранилища, выбор — `FilePicker` в `EntryEditor`), у игроков — вместе с текстом.
  Свои типы: `CustomType` (id = значение `type:` в файле, поля `FieldDef` с `subtitle` — значение в строке под
  названием), разбор и проверка — `parseCustomTypes`, ключ из подписи — `keyFrom` (транслитерация); файл
  `<библиотека>/compendium-types.json` (IPC `library:readData` / `writeData`). В окне — `renderer/lib/entry/types.svelte.ts`
  (`typeDef` вместо `typeOf` там, где нужны свои типы; `serializeEntry` / `entrySubtitle` принимают описание типа);
  страница «Типы записей» — `TypesEditor.svelte` (`ui.page = 'types'`, кнопка в боковой панели). Окно игроков
  библиотеку не читает: запись уходит в раздатку через `forPlayers` — со снимком описания своего типа в `entry.def`.
  Фильтр заклинаний (как на dnd.su) — `SpellFilters.svelte` в боковой панели при типе «Заклинания»: уровень, класс,
  школа, время (`castingKind`), концентрация, ритуал; правила — `spellMatches` в `shared/compendium.ts`, состояние —
  `ui.spells` / `ui.byLevel` (по уровням — с заголовками групп).
  Приключение одним файлом (.sgpack) свои типы не переносит — записи там покажутся как «поле — значение».
- Журнал мастера (`modules/journal`): заметки к приключению — Markdown в папках роли `journal` (`FileKind` 'page',
  `main/scan.ts`), название = имя файла, папки внутри — свои. Ядро — `main/journal.ts` поверх `textstore.ts` (у него
  же `move` и `mkdir`), IPC `journal:*`; переименование и перенос — ещё и действие `journal/move` (закреплённая
  заметка); папки внутри журнала — `renameFolder` (`journal:renameFolder`, саму папку роли — нельзя) и перенос папки
  перетаскиванием (`movePage`). Чистые функции — `shared/journal.ts` (свойства Obsidian `splitProps`, флажки `toggleTask`), разметка —
  общая со справочником `entryHtml(текст, { tasks, dice })`: цитата «>» — текст для зачитывания, «- [ ]» —
  `data-task` (номер задачи по порядку), {1d20} — кнопка броска (`rolls.damage`). Окно — `journal/ui/store.svelte.ts`
  (тексты всех видимых заметок, перечитываются по `notes.rev`), вид — `PageBody.svelte` ([[ссылка]]: карточка системы
  приключения → заметка → `peekEntry` (запись или любая карточка)), правка — `PageEditor.svelte` (сохраняет сам). Клавиши Markdown-полей (журнал, `EntryEditor` справочника, текстовые поля редакторов карточек) — действие
  `use:markdownKeys` (`renderer/lib/markdownKeys.ts`): Enter продолжает «>», списки, задачи и номера — `continueMarkup`,
  ⌘B / ⌘I / ⌘⇧X — `toggleWrap` из `shared/journal.ts`, Tab — отступ; правки через `execCommand('insertText')` — ⌘Z работает. В состоянии — только
  `pinned` (приключение → путь): блок правой панели `OnScreen.svelte`. Заметки — в ⌘K (`QuickSearch` справочника).
  Сам журнал игрокам не показывается; в .sgpack файлы уходят с папкой приключения, `pinned` — тоже
  (`PackSlices.pinned`, и в корзину — `AdventureData.pinned`).
- Подборка правой панели (`modules/scenes/tray.ts`, вид — `scenes/ui/Tray.svelte` в блоках фона, карты, портретов и
  раздатки, `TrayChips.svelte` + `renderer/lib/ListPicker.svelte` — в музыке (плейлисты и треки; трек — действие
  `music/playTrack`, тогда `playlist` — путь трека) и инициативе (id заготовок; `Combatant.encounter` от
  `startEncounter` — какой бой идёт; из панели — `replace`: бой вместо идущего, повторный щелчок — `stopEncounter`));
  записки в подборке — `TrayNote.svelte` (лист в миниатюре), записи справочника с картинкой — картинкой; «Сохранить текущее» передаёт подборку в `scenes/create` (`tray`),
  выход из сцены — `markActive` null; порядок — `use:sortable` с `onmove` (действие `traySet`); звёздочка в музыке —
  основная музыка сцены (`music` + `include.music` сцены); имя новой сцены и переименование — поле в `QuickBar`;
  атмосфера — часть `ambience` в блоке музыки; звуки — модуль `modules/sounds` (без вкладки: команда `play` растёт
  `last.seq`, играет фоновый `Sfx.svelte` на устройство вывода музыки, что звучит — `ui/playing.svelte.ts`), часть
  `sounds` (сыгранный попадает в подборку по смене `seq`); встроенные звуки — `resources/sounds/{sfx,ambience}`
  (источники и лицензии — README там; название файла = подпись), пути «sound:…» (`shared/sounds.ts`, `assetUrl` →
  `sg-asset://s/…`, ядро — `main/sounds.ts`, IPC `sounds:builtin`, окно — `sounds/ui/builtin.svelte.ts`); очистка
  музыки и подборок их не трогает: у сцены `tray`, без включённой сцены — `scenes.trays[приключение]` ('' — всё хранилище); чья —
  `trayOwner` (включённая сцена, если видна в приключении). Показанное на экран попадает туда само — хук ядра
  `afterAction` модуля (действие другого модуля, состояние до и после; выполняется в очереди модуля-хозяина хука);
  поэтому `activate` сцены сначала `markActive`. Перетаскивание из вкладок — `file` в `use:sortable` (`draggedFile`),
  «+» — общий `renderer/lib/FilePicker.svelte` (`multi`). Подборка приключения уходит в .sgpack (`slices.tray`) и в
  корзину (`AdventureData.tray`).
- Порядок плиток, заданный перетаскиванием («Персонажи», «Фоны», «Раздатка», «Файлы»): модуль `order` (ключ — группа: путь папки
  или `monsters:<папка>`, значение — id плиток), `applyOrder` в `shared/order.ts`, перетаскивание — действие
  `use:sortable` (`renderer/lib/sortable.ts`), только внутри группы. «Файлы» пишут в те же ключи (путь папки,
  `monsters:<папка>` для карточек), но видят папку без вложенных — `sortable` дописывает остальные сохранённые id следом.
- Любое изменение состояния — через действие модуля: `dispatch(модуль, действие, данные)`. Действия одного модуля
  выполняются по очереди. Состояние целиком рассылается во все окна после каждого действия.

## Грабли, на которые уже наступали
- Модули не импортируют `renderer/control/workspace.svelte.ts`: он зависит от реестра модулей, получается цикл
  и ошибка «Cannot access … before initialization». Для связи с оболочкой — `renderer/lib/nav.ts`.
- Проп компонента нельзя называть `state` (конфликт с руной `$state`), поэтому в модулях он называется `app`.
- Переходы Svelte 5 локальные: внутри `{#key}` нужен `transition:…|global`, иначе не сработают.
- `requestAnimationFrame` стоит в перекрытых/свёрнутых окнах: анимации нужен гарантированный последний кадр
  по таймеру; громкость звука плавно меняется через `setInterval`. У обоих окон `backgroundThrottling: false`.
- macOS не различает регистр: `player.svelte.ts` и `Player.svelte` — одно и то же имя для импорта.
- `offsetX` у программных событий неточен — координаты мыши считать от `clientX` и `getBoundingClientRect()`.
- Svelte 5 ловит события делегированием: в тестах события должны всплывать (`bubbles: true`).
- Через IPC нельзя передать реактивный прокси Svelte (`$state`): «An object could not be cloned». То, что уходит
  в `window.api`, держать в `$state.raw` или передавать `$state.snapshot(...)`.
- Системные диалоги через AppleScript: `keystroke` печатает в текущей раскладке (у пользователя бывает русская) —
  для сочетаний использовать `key code` (G = 5, V = 9), путь вставлять через буфер (`pbcopy`, ⌘⇧G, ⌘V).
- `npx electron` запускать из папки проекта: из другой папки подхватывается глобальный Electron (Homebrew) другой
  версии — в нём, например, не работает буфер обмена.
- `$effect`, который читает `app.…` в компоненте модуля, перезапускается после каждого действия (проп `app`
  каждый раз новый): нужное значение сначала взять в `$derived`.
- В Electron 44 буфер обмена асинхронный, как в браузере: `clipboard.read()` → `ClipboardItem` с `types` и
  `getType()`; `readImage` и `read(формат)` больше нет. Картинка — `image/png`, файл из Finder — `text/uri-list`
  (`clipboardImage` в `main/files.ts`). Проверять: картинку в буфер — `osascript -e 'set the clipboard to (read
  (POSIX file "…") as «class PNGf»)'`, файл как из Finder — JXA с `NSPasteboard.writeObjects([NSURL…])`;
  главный процесс смотреть через `--inspect=9229` и `process.mainModule.require('electron')`.
- canvas с картинками из `sg-asset://` «заражён» (другой источник): пиксели читать нельзя, и это нормально.

## Как проверять изменения
- Тестовый набор — `.dev/` в проекте (в .gitignore): `.dev/vault` — хранилище, `.dev/ud` — папка данных
  (`SG_USER_DATA=$PWD/.dev/ud`), скрипты CDP `.dev/cdp.mjs` (`eval` / `shot`), `.dev/keys2.mjs` (нажатия),
  `.dev/mouse.mjs`, `.dev/main-eval.mjs` (главный процесс через `--inspect=9229`). Перед тестом скопировать
  `.dev/vault/.scrying-glass/state.json` и `.dev/ud/settings.json`, после — вернуть.
- Пустой `SG_USER_DATA` = настоящая папка данных пользователя и его хранилище. В скриптах сначала задать путь,
  потом запускать, и проверять его (`[ -d "$S/ud" ] && …`). Состояние в `state.json` — под ключом `modules`.
- Своя папка данных, чтобы не трогать настоящую кампанию: `SG_USER_DATA=/tmp/путь npm run dev`
  (там `settings.json` с путём к хранилищу; хранилище для тестов — любая папка с подпапками characters/maps/music).
- Запуск с отладкой: `SG_USER_DATA=… npx electron . --remote-debugging-port=9333` (после `npm run build`) или
  `npx electron-vite dev --remoteDebuggingPort 9333`. Дальше через Chrome DevTools Protocol
  (`http://127.0.0.1:9333/json/list`, `Runtime.evaluate`, `Page.captureScreenshot`) — проверять DOM, состояние
  (`window.api.getState()`), вызывать действия и снимать скриншоты окон. Скриншоты экрана macOS недоступны.
- Кнопки, видные только при наведении, проверять через `Input.dispatchMouseEvent` (`mouseMoved` на координаты элемента)
  и потом `Page.captureScreenshot`.
- Тестовую музыку можно сделать так: `say -o x.aiff "…"` и `afconvert -f m4af -d aac x.aiff x.m4a`.
- Системные диалоги (sheet) нажимаются через AppleScript: `click button "…" of sheet 1 of window 1`.

## План
Сделано: хранилище, портреты, фон, музыка и атмосфера, карты с туманом, сцены, инициатива, бестиарий с визуальным
редактором карточек, приключения, NPC рядом с портретами, лист персонажа игрока с редактором и импортом из LSS,
названия папок ролей в настройках, броски из статблока и листа, перетаскивание плиток,
быстрое добавление в бой и заготовки боёв, метки на картах (значки, карточки), сдвиг сетки, жетоны,
записки, генераторы, сложность боя, таймер и покупка характеристик (раздел «Инструменты»),
справочник (заклинания, предметы, черты, правила, заметки), журнал мастера (заметки к приключению), автоматические снимки данных (резервные копии), экспорт и импорт приключения одним файлом, полная резервная копия в файл, устройство вывода музыки (`music/ui/output.svelte.ts`, в localStorage окна) и горячие клавиши (музыка — в `Player.svelte`,
⌘B — в `App.svelte`, сцены — `scenes/ui/Hotkeys.svelte`).
Карточки, изменённые снаружи: хранилище перечитывает `watchVault` (main/index.ts), библиотеку — `watchLibrary`
(main/cards.ts); открытая в редакторе — `bestiary.checkExternal` → плашка в `CardEditor` (`external`).
Записки, на потом (пожелания пользователя): больше шрифтов (например, «почерк безумного сектанта» — нужен
открытый шрифт с кириллицей). Следы, помятость, печати, штампы, неровный почерк и жуткие шрифты — сделаны.
Настоящей фрактуры с русскими буквами под OFL не нашлось (Fruktur — только кириллица других языков; Drei Fraktur —
без первоисточника).
Возможное продолжение бестиария: синхронизация чисел перевода с оригиналом, подписи статблока на других языках (сейчас ru/en, остальные —
английские).
Вторая ролевая система — Fate Core (0.18.0 и после): система у приключения, трекер, карточка, аспекты и жетоны,
отключение систем, встроенный справочник Fate.
Тексты справочника — только SRD (OmnisGM, CC BY 4.0): у ttg.club под Apache 2.0 лишь код, тексты — переводы
официальных книг без открытой лицензии; dnd.su — тоже.
На будущее: больше фэнтезийных подложек для имён портретов (сейчас тень, лента, свиток, табличка).
На будущее: другие генераторы по образцу rpgd100.ru (NPC, поселения, подземелья, магические предметы, сокровища, лавки,
таверны, события, погода) — как генератор имён: свои встроенные списки en/ru, свои списки пользователя — в библиотеку
(тексты сайта без лицензии в репозиторий не брать).
На будущее: найти ещё свободной атмосферы и звуков (нет шума таверны, эффекты короткие).
Отложено: подпись сборок (Apple Developer, сертификат Windows).
