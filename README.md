# Scrying Glass

**English** · [Русский](README.ru.md)

A game master's screen for tabletop sessions (D&D 5e, Fate Core and Mausritter). The GM has a control window; the players see a
second monitor with portraits, backgrounds, maps with fog of war, handouts and the initiative tracker. On top of
that: music and ambience, scenes, a compendium, a GM journal and a bestiary with character sheets.

On launch the app checks whether a new version is out (it asks GitHub and sends nothing else): if so, a banner at the
top of the window offers "Download" / "Skip this version". Turn it off in ⌘, → General → Updates, where "Check now" is too.

The interface is in English and Russian (⌘, → General → Language; by default — the system language if there is a
translation for it, otherwise English). The language switches at once, without a restart. The theme of the GM window — automatic
(as the system), dark, light, parchment (fantasy), space or neon (science fiction, cyberpunk) — is in the same place (⌘, → General → Theme); the player screen keeps its
own look. The built-in compendium
and the Fate compendium exist in both languages and follow the interface language.

## Installation

Ready builds are on the repository's Releases page (64-bit systems only):

- macOS (Apple Silicon): `scrying-glass-<version>-mac-arm64.dmg`, macOS (Intel): `…-mac-x64.dmg`
- Windows: `scrying-glass-<version>-windows-setup.exe`
- Linux: `.deb` (Debian, Ubuntu), `.rpm` (Fedora, openSUSE) or `.AppImage` (any distribution)

The app is not signed with Apple or Microsoft certificates, so the system warns on the first launch:

- **macOS**: "cannot verify the developer" or "the app is damaged". Drag the app to Applications and run
  `xattr -cr "/Applications/Scrying Glass.app"` in Terminal — or open System Settings → Privacy & Security and press
  "Open Anyway".
- **Windows**: SmartScreen — "More info" → "Run anyway".

## Development

    npm install
    npm run dev        # development: windows reload on save
    npm run build      # build into out/
    npm start          # run the built version
    npm test           # core tests
    npm run typecheck  # type check
    npm run import-srd # rebuild the built-in bestiary from the SRD (needs the internet)
    npm run import-compendium # rebuild the built-in SRD compendium (needs the internet)
    npm run build-fate # build the built-in Fate compendium from scripts/fate-core.<lang>.md
    npm run build-mausritter # built-in Mausritter creatures and compendium from scripts/mausritter-srd.<lang>.md
    npm run dist       # installer for your system in dist/ (electron-builder.yml)
    npm run icon       # build/icon.png from build/icon.svg

Releasing a version: bump `version` in package.json, commit, `git tag v<version>` and `git push origin v<version>`.
GitHub Actions (`.github/workflows/release.yml`) builds macOS arm64 and x64, Windows x64, Linux x64 (deb, rpm,
AppImage) and creates a draft release — it only needs checking and publishing.

Interface text lives in dictionaries (`src/shared/i18n/`, `src/modules/<module>/i18n.ts`, `src/systems/i18n.ts`,
`src/main/i18n.ts`); English is the source, a missing translation fails the type check. A new language is a new set
of dictionaries plus its code in `LANGS` (`src/shared/i18n/core.ts`).

## The vault

On the first launch the app asks you to pick a vault folder, like Obsidian. Any tree can live inside:

    D&D/
    ├── Pumpkin Festival/
    │   ├── characters/
    │   ├── monsters/                ← monster and NPC cards of this adventure
    │   └── backgrounds/
    └── Curse of Strahd/
        ├── characters/              ← characters shared by the whole campaign
        ├── Chapter 1. Village of Barovia/
        │   ├── characters/
        │   ├── maps/
        │   └── music/
        └── Chapter 2. Vallaki/

**Adventures** are top-level folders of the vault marked as adventures: "Create adventure…" in the switcher above
the side panel, or "Make an adventure" in the Files tab (on the first open, folders that already contain characters,
maps and so on become adventures). An adventure always has characters, monsters, backgrounds, maps and music folders —
missing ones are created on launch. Every tab except Files shows the current adventure and the "shared" part — what
lies outside adventures (for example, music in the vault root). Scenes belong to an adventure; scenes from older
versions are shared, and the scene editor can assign them an adventure.

**Files** shows the whole vault like a file manager: ↑ ↓ — the neighbouring folder, → — expand or enter,
← — collapse or go up (arrows work the same in every list on the left: journal, compendium, cards, tools, scenes,
maps, music). Selecting an adventure folder (or any folder inside it) opens that adventure at once; the root and
shared folders don't change the current adventure.

**Folder roles** are guessed by name: characters / npc — portraits, party / players — player characters,
backgrounds / locations — backgrounds, handouts / clues — handouts, maps — maps, music / audio — music,
monsters / bestiary / creatures — bestiary cards, compendium / reference — compendium entries,
journal / notes — the GM journal (Russian names are recognized too). Names can be changed or extended
in settings (⌘, → Files → Folder roles); the first name of a role is the one the app uses when it creates folders.
A picture from any folder can be shown to the players from Files.

**The caption under a portrait** on the player screen can be styled (⌘, → Characters): plain text with a shadow, a
ribbon, a scroll or a plaque, your own color and any of the note fonts; a sample is shown right away. The caption is
the name of the card that uses the picture as its portrait, otherwise the file name (underscores become spaces). If the players don't know a character's name yet, the "?" button by
their row in the Characters block of the right panel shows them "???" instead. The
name under any tile (portrait, background, handout, creature, a file in Files) and in the map list (double-click) can
be edited in place: a portrait with a card and a creature rename the card, everything else renames the file itself.
Scenes, trays, map markup and card portraits survive the rename.

Clicking a tile shows nothing to the players — only the buttons that appear on hover do (their labels show at once).
Double-clicking a picture opens it large: ← → — neighbours, Esc — close, the same buttons at the bottom.

## On the player screen

Any picture can be shown as a **portrait** (with a caption, several at once) or full screen as a **background**:
a location, a handout, an illustration. The background lies under the portraits and dims while they are on screen.
Both buttons appear when you hover over a picture.

**Handouts**: notes, clues, letters, treasure maps — if you'd rather not print them. The Handouts tab shows pictures
from handouts / clues folders; the tile button shows the item to the players over the map and portraits (the scene
behind it darkens), pressing again removes it. Any picture can be shown as a handout with the hover button.

**Notes** — letters, orders, notices, diaries — are made right in the app: Tools → Notes, or "New note" in Handouts.
Text (headings, italic, bold, a "---" ornament) on parchment, old or light paper or dark leather; a straight, torn or
burnt edge; a sheet, a slip or a scroll; smooth, folded, crumpled or wadded paper; a signature. Marks are placed with
a click on the sheet and dragged around: splashes and drops of blood, smears, blots, fingerprints, a mug ring, stains,
wax drops, scorches, burnt holes, claw marks, wax seals (with an emblem or a letter, whole or broken) and ink stamps
with text around the edge. Nineteen fonts with Cyrillic: handwriting, calligraphy, book faces, Old Russian, chronicle,
ancient manuscript, creepy ones (drips, distressed, beastly); "shaky handwriting" makes the letters dance. A note is a
file "Title.note.json" in the adventure's handouts folder: it sits in Handouts and Files next to the pictures and is
shown to the players the same way. It saves itself; if the players see it, edits appear at once.

## Compendium

A section of its own in the left strip: spells, items, feats, conditions, rules and notes — what you look up during
the game. An entry is a Markdown file: in the adventure's compendium / reference folder, in the shared folder of the
vault or in the library (for all campaigns); it is easy to edit in Obsidian as well. Fields are the "properties" at
the top of the file:

    ---
    type: spell
    level: 3
    school: Evocation
    casting_time: Action
    tags: [fire, damage]
    ---
    A bright streak… [[Blinded]]

**Built in**: spells, magic items, feats, conditions and the rules glossary of SRD 5.1 and SRD 5.2.1 — in English
(the original) and in the Russian translation by OmnisGM, in the interface language (the edition — one, both or
none — is chosen above the list). They can be edited: the edit is saved to the library (for all campaigns) and
replaces the built-in entry everywhere — in the list, search, links; "Restore as in SRD" removes the edit.
"Copy to…" makes a separate entry. Search also works by the name in the other language (fireball — «Огненный шар»
and back); spell links from cards find the entry in any language. Spells can be filtered by level, class, school,
casting time, concentration and ritual (the filter appears when the Spells type is selected); the list is grouped by
level or alphabetical. Source: System Reference Document 5.1 and 5.2.1 © Wizards of the Coast, CC BY 4.0; Markdown of
both versions and the translation — OmnisGM (rules.omnisgm.com), CC BY 4.0. More in `resources/compendium/README.md`.

In **Fate Core** adventures the Fate rules are built in instead of the D&D SRD (the ladder, dice, outcomes, the four
actions, aspects, invokes and compels, fate points, conflict, stress, consequences, contests, stunts, milestones, NPCs)
together with all 18 skills and sample stunts — a retelling of the Fate Core SRD in English and Russian written for
the app (Evil Hat Productions, CC BY 3.0). The texts are in `scripts/fate-core.<lang>.md`; `npm run build-fate`
builds `resources/compendium/fate-core.<lang>.json` from them.

In **Mausritter** adventures the Mausritter SRD 2.3.1 is built in, in English and Russian (the Russian text is a
translation made for the app): the rules by chapter (making
a mouse, inventory, saves, combat, magic, hirelings and warbands, gear and prices, running the game, hexcrawl and
adventure site toolboxes, useful tables), the 15 spells with their recharge, and the 11 creatures as cards (cat,
centipede, crow, faerie, frog, ghost, mouse, owl, rat, snake, spider — with their variant tables). The texts are in
`scripts/mausritter-srd.<lang>.md`; `npm run build-mausritter` builds `resources/srd/mausritter.json` and
`resources/compendium/mausritter.<lang>.json`. This work is based on Mausritter (https://mausritter.com), a product of Losing Games and Isaac Williams, and is licensed for use under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence.

The compendium is at hand from any tab:
- spells in stat blocks (in italics, as in the SRD) and in a character sheet's spell lists are links: a click opens
  the entry in a side drawer, "back" in it returns to the card;
- conditions in the initiative tracker: a click on the name — the description, the cross — remove;
- ⌘K (Ctrl+K) — search across entries, cards and journal notes: Enter — open on the side, ⌘Enter — in a tab.

Translations call the same thing differently: the "Other names" field (`aliases`, as in Obsidian) lists your own —
the entry is found by them too, including from a character sheet.

**Custom entry types** — the shapes button next to "+" in the list: for example, "Deity" with the fields "Alignment"
(a choice from a list), "Domains" (a list), "Symbol". Each field has a label, a key in the file header, a kind (text,
number, yes/no, choice, list), a hint and whether it goes into the line under the title ("Deity, lawful good, War,
Knowledge"). Types are shared by all campaigns (they live in the library); entries of custom types are created with
"+", edited and shown to the players like the rest.

Types: spell (`spell`), item (`item`), feat (`feat`), condition (`condition`), rule (`rule`), note (`note`); an entry of
an unknown type is shown as "field — value". On the left — search (by title, tags and text) and types, "+" — a new
entry (type and place); in the text — headings, lists, tables and [[links]] to other entries or monster cards,
"Back" — to the previous entry. "Show to players" puts the entry on the player screen as a sheet of paper (a long one
shrinks to fit); an entry can have a picture (an item, a place) — the players see it with the text. There too: editing with a preview (Enter,
⌘B / ⌘I / ⌘⇧X and Tab work as in the journal), a copy to another place, opening the file in another app,
deleting to trash.

## Journal

A section of its own in the left strip: the GM's notes for an adventure — a session plan, read-aloud text, game
summaries, plot ideas. A note is a plain Markdown file in the adventure's journal / notes folder (or in the vault's
shared folder), easy to edit in Obsidian too. On the left — the tree of notes: folders ("Sessions", "Locations",
"Ideas"), new note and folder — buttons on hover, order — by dragging, dragging onto a folder moves the note into it. A folder is renamed with the pencil or a double click and moved by
dragging it onto another folder.
A note opens formatted, "Edit" (⌘E) — the Markdown text, which saves itself. As in Obsidian, Enter carries a ">" quote,
a list, a task or a number on to the next line (Enter on an empty item ends the list), ⌘B / ⌘I / ⌘⇧X make the
selection bold, italic or ~~struck through~~ (again — removes it), ⌘Z undoes:

    ## Arrival in the village
    > The road brings you to a palisade. A faded
    > wreath of wheat hangs above the gate.

    The guard wakes up: Stealth {1d20+2} vs 12. The headman — [[Headman Gilbert]].
    - [x] Meeting at the gate
    - [ ] The tavern

A ">" quote is read-aloud text (a highlighted box), "- [ ]" — a task with a checkbox (a click checks it right in the
file), {1d20+2} — a roll into the roll log on click, [[Title]] — a card, another note or a compendium entry (in a side
drawer; a card wins over a note or an entry with the same name). A note can be pinned: it appears in the right panel, at hand during the game; the pin travels with the
adventure file (.sgpack) and comes back with the adventure from the trash. Notes are found by ⌘K.

## Tools

The Tools sidebar has the notes and the common tools (schedule, message to players, timer), then a section of the
current adventure's system: in D&D — the generators (names, NPCs, taverns, settlements, shops, items, dungeons,
weather, events, treasure), encounter difficulty, point buy, reshaping a stat block and travel; in Mausritter — the mouse generator, the
Mausritter tables and factions; Fate has no tools of its own yet. Tools of other systems are hidden; Settings → Tools
turns one on for a system where it is needed too (it shows in "Other systems"), remembered by the window.

**Encounter difficulty**: the current combat and every prepared encounter show a badge like "Moderate · 1,100 /
1,500 XP"; a click shows the scale and details. It follows the 2024 rules (SRD 5.2): every hero has an XP budget by
level (low, moderate, high), the enemies' XP adds up. Heroes come from the combat, or else from the adventure's player
characters (level from the sheet; a hero without a card is looked up by name); if there are no heroes anywhere — the
party from the setting in the same badge. XP comes from the enemy cards; allies and neutrals don't count. Sketch an
encounter and pick enemies in Tools → Encounter difficulty, and from there — straight "To an encounter".

**Name generator** (Tools → Name generator): race (human, elf, dwarf, gnome, halfling, dragonborn, tiefling), gender,
form — just a name or a name and surname, nickname — none, simple ("the Lame") or epic ("Bane of Giants"). Filters —
length, sound (melodic, soft, harsh) and first letters; 1, 5, 10 or 20 names at once, Space — more. Each name has
"Copy" and a "favorite" star; favorites (shared by all campaigns, in the library) and history export to TXT and CSV.
The built-in lists are written for the app, in English and Russian. Your own lists are text files, one entry per
line; the file name says what's inside: `race_gender_kind.txt` (`human_man_names.txt`, `elves_woman_nicknames.txt`,
`dwarf_surnames.txt`; kinds — names, surnames, nicknames, epithets; race `any` — for all, or your own: `orc_man_names.txt`).
"Load lists…" puts them into the library (`names/<lang>/`, the language by the letters), and they are added to the
built-in ones; built-in or own lists can be turned off.

**Treasure** (Tools → Treasure): where (pockets, a stash or a chest, a lair hoard) and the heroes' level (1–4, 5–10,
11–16, 17–20) → coins, gems and art, valuable things, pocket finds and trinkets; each part rerollable. In D&D
adventures — magic items of the right rarity from the compendium (of the shown edition, your own items included; a
click opens the entry, in the journal they are [[links]]) and prices with the total in gold; in other systems —
curiosities and no prices. Copy, to the journal or to Telegram.

**Random events** (Tools → Random events): terrain (as for the weather, the city and the underground included), day or
night, danger (calm, tense, dangerous) and 1, 3 or 6 events → encounters, discoveries, obstacles, travellers, omens and
rumors (from the tavern generator), each event rerollable. Creatures in the text are links: a click opens the SRD card
on the side (in the journal they stay [[links]]). In D&D adventures an obstacle shows its check (skill and DC); on a
dangerous road an event can come with a complication. "To an encounter" on an encounter makes an encounter preset
with its creatures (weaker ones come in groups) and opens it in Initiative. Copy or to the journal.

**Travel** (Tools → Travel, D&D only): distance in miles, on foot / mounted / by cart or a ship (airship, galley,
sailing ship…), pace, terrain, road and hours a day → the time on the way and the speed by the SRD travel rules of
the adventure's edition. In the 2024 rules the terrain caps the pace (a good road raises the cap a step) and gives the
encounter distance and the foraging, navigation and search DCs; in 2014 — difficult terrain halves the distance.
Also: what the pace gives (Perception, Stealth), the mounted gallop, and a long day past 8 hours — the Constitution
save DC for each extra hour. Ships keep their speed and can sail up to 24 hours a day.

**Dungeon generator** (Tools → Dungeon generator): kind (tomb, caves, mine, temple, fortress, wizard's tower, sewers,
ruins), the heroes' level and 5 or 8 rooms → a "five-room dungeon": a guarded entrance, a puzzle, a trap, the final
fight and the reward (eight rooms add lairs and a quiet room); who built it and what happened to it, the entrance, the
atmosphere and a hook. Creatures are SRD cards by the level (a click opens the card); in D&D adventures traps have a
save, DC and damage by the SRD, and the hoard comes from the treasure generator with magic items from the compendium.
Each part can be rerolled; copy or to the journal (creatures and items as [[links]]). "To an encounter" on a room
with creatures makes an encounter preset of the current adventure with them and opens it in Initiative.

**Magic item generator** (Tools → Magic item generator): kind (weapon, armour, jewellery, wand or staff, clothing, a
wondrous thing) and power (curio, minor, major, legendary) → a name, the look, a minor property, who made it and what
happened to it, a quirk and sometimes a curse. In D&D adventures a minor, major or legendary item stands on an SRD
item of that rarity from the compendium (of the same kind when there is one; a link to its entry). Each part can be
rerolled; copy, to the journal or to Telegram (without the curse).

**Shop generator** (Tools → Shop generator): a general store, a smith, an alchemist, a magic shop, books and maps or
an antiques dealer, poor, modest or wealthy → name and owner (from the NPC generator), the look inside and a quirk,
goods with prices and stock, and a hook. Ordinary goods are priced by the SRD equipment tables; in D&D adventures the
magic shop sells compendium items at their SRD value (consumables at half), and the names open their entries;
elsewhere it sells curiosities and prices are hidden. Copy, to the journal or to Telegram (without the hook).

**Settlement generator** (Tools → Settlement generator): a hamlet, a village, a town or a city (or random) → name,
population and peoples, who rules and the defences, a first impression to read aloud, what it is known for, places
(with a tavern named by the tavern generator), notable people (from the NPC generator) and a trouble to start an
adventure. Each part can be rerolled or pinned; to the journal or copy.

**Weather generator** (Tools → Weather generator): terrain (forest, plains, city, coast, mountains, swamp, jungle,
desert, arctic, underground), season and 1, 3 or 7 days → for each day the sky, rain or snow (sleet, sandstorm,
thunderstorm), wind and temperature (°F and °C), a line to read aloud and, rarely, something unusual (northern lights,
a waterspout, a mirage…). Days follow each other: rain tends to last, the temperature drifts. In D&D adventures — the
SRD weather rules that apply (extreme cold and heat, strong wind, heavy precipitation, fog). Copy, to the journal, or
straight to the players in Telegram (without the rules).

**NPC generator** (Tools → NPC generator): race (or random), gender, importance (common to unique) → name, trade,
appearance, character, manner of speech, what they want, what they hide and what they carry; important NPCs get a
nickname or an epithet, fame and sometimes a magic trinket. Reroll or pin any part; recent NPCs stay in the history.
"Create card" opens a new NPC card in the editor with the name, description and notes filled; "To journal" and "Copy"
as with taverns. Names come from the name generator's lists.

**Tavern generator** (Tools → Tavern generator): type (tavern, inn, roadside inn, harbor dive, hidden den, wine house),
wealth (squalid to aristocratic — prices follow the SRD food, drink and lodging table), crowd, lodging and wonders.
The result: name and sign, a read-aloud description, the owner (name, trait, catchphrase, secret), staff, patrons
with what they're doing and their secrets, a menu with prices, rooms and services, an event of the evening that uses
the tavern's own people, rumors, a request and the tavern's secret. Any part can be rerolled or pinned ("Reroll
unpinned" keeps the pinned ones); "To journal" saves the tavern as a note of the current adventure (the description
as a read-aloud quote, rumors as tasks to tick off), "Copy" — the same text. Names come from the name generator's
lists, including your own.

**Telegram**: pictures, notes, compendium entries and messages can go to the players through your own bot. Create a
bot with @BotFather (/newbot) and paste its token into ⌘, → Telegram (the token stays on this computer, encrypted; the
app talks to Telegram directly, with no server of its own). Players write /start to the bot; for the group chat, add the
bot to the group — chats appear in the settings turned off: turn on only your own and label whose player each one is.
To send: the "Telegram" button on a picture or note tile (a note goes as a large picture, as the players see it), the
paper plane in the note editor and on a compendium entry (as text), the paper plane in the Handouts block of the right
panel — what the players see right now, Tools → Message to the players — your own text. The send dialog asks
whom: the group chat and/or players privately.

Answers come back: what players write in an enabled chat (text, photos, stickers; voice messages and files — as a
note to open them in Telegram) appears in Tools → Message to the players as a conversation, next to what the app
sent, pictures included. A new message shows a toast in the corner (a click opens the conversation) and a count on
the tool. Pick a chat on the right to write to it straight away; ↩ on a message — a reply to it. Enter sends,
Shift+Enter — a new line (or ⌘Enter sends — ⌘, → Telegram). Formatting with Telegram Desktop's keys: **bold** ⌘B,
*italic* ⌘I, __underlined__ ⌘U, ~~struck~~ ⌘⇧X, `monospace` ⌘⇧M, ||spoiler|| ⌘⇧P (hidden until tapped); «- » lists,
«> » quotes.

**About** (⌘, → About, or the app menu): the version, the project's links (GitHub, report a problem, releases), the
license (GPL-3.0-or-later, no warranty) and the credits of the material by other authors the app includes. The app
menu is in the interface language; Help leads to the project's pages.

**Tables** (⌘, → Telegram → Tables): a table is the people who play together, so one adventure can be run for several
tables. Give each chat its table; in the conversation pick the table you play at now (above the chats) — the chats,
the send dialog, unread counts and toasts show only its chats and those of no table. An adventure remembers the table
it was last played with and picks it when you switch to it. A picture can be pasted (⌘V), dropped onto the box or
attached with the button — the text goes as its caption. Your own messages can be deleted for everyone (Telegram
allows it for 48 hours); any message can be hidden in the app. In a group the bot sees only replies to its
messages and mentions of it — to see everything, turn its privacy off: @BotFather → /setprivacy → Disable. The
conversation is kept on this computer (`<app data>/telegram`, the last 300 messages); the bin clears it in the app
only.

**Schedule** (Tools → Schedule): your games — date and time, length, a repeat (every week or every two, until a
day, with skipped ones), the table, the adventure and its plan (a journal note), the place (an address or a link to
the online room). The announcement has optional lines — each goes only when filled: a picture on top, the kind of game
(one-shot, campaign, session) with its title, players, price, GM, system (from the adventure), characters' level and a
description (with formatting); the editor shows a preview. The bot announces a game to its table with "Join /
Reserve / Can't" buttons (one per row); answers show under the game and in the announcement itself, one list for the
game whatever chat a player answers in. "Seats for players" (empty — the top number of "Players": "4–5" means 5) limits who takes part: once they are taken, the first
button says "No seats left" and pressing it explains that the reserve is open; when a player cancels, the bot writes
to everyone in the reserve (those who never wrote to the bot are mentioned under the announcement instead). The bot
answers while the app is open: presses made while it is closed are taken when it starts (Telegram keeps them a day). Changed the game
after announcing it? The game shows "The announcement is out of date: Address…" — "Update the announcement" edits the
sent message, "Update and tell the players" also replies to it with what changed. A moved time takes the answers
along. It reminds the table a day and two hours before (while the app is open — a
reminder whose time came while it was closed goes when it opens). "Start the game" switches to the adventure and the
table, pins the plan and opens the scenes. The schedule is common to all vaults
(`<app data>/schedule.json`).

**Timer** (Tools → Timer): an hourglass or digits on the player screen — top right, bottom right or large in the
center, with a caption ("While the torch burns"). Presets from 30 seconds to 30 minutes or your own time. When time
runs out, the timer flashes "Time's up!" and the GM hears a chime (on the music output device). Pause, ±1 minute,
"hide from players" and "remove" — there and in the right panel.

**Point buy** (Tools → Point buy): 27 points, 8 to 15 before bonuses (the budget and limits can be changed for house
rules), the cost, total and modifier of each ability, the standard array in one click. Bonuses — from the background
(2024: +2/+1 or +1/+1/+1), from the race (2014: race → subrace, for example "Halfling → Lightfoot"; the SRD races are
built in) or your own. "Custom races and subraces": a new race, or a subrace for any race including the built-in ones
("Elf → Wood"), with bonuses and "+1 of choice"; stored in the library — shared by all campaigns. "Check a character"
takes the final scores from a player's sheet, works out the bonuses itself and says whether the spread is legal and
how many points are spent, or what is broken; level increases and feats go into "Other".

**Reshape a stat block** (Tools → Reshape a stat block, or "Reshape…" on any D&D card): a creature's stat block as the
base — the headman from a commoner, a dwarf from a guard. Templates: age (child, elder), build (frail or brawny), role
(leader, seasoned fighter, skulker, healer, sage), people (human, dwarf, elf, halfling, gnome, orc, tiefling, dragonborn; age and people — only for humanoids) — abilities, size, speed, darkvision,
resistances, traits and the language; abilities can be changed by hand on top; an attack can be swapped for an SRD
weapon (the new attack is written in the card's language and edition, and its name follows into the multiattack and
gear); "Power" makes it stronger or weaker — another CR: the proficiency bonus by the rules, and AC, hit
points, attacks, damage and save DCs move as much as a typical creature's of that CR do (our own table: the medians of
the SRD creatures, smoothed). The numbers that follow the abilities are recounted: saves, skills, passive Perception, initiative, hit points
(the hit die by size), AC by the armour worn, attack rolls, damage and save DCs in the texts of the blocks. On the right
— the stat block as it comes out and the list of what changed; "Create card" opens it in the editor ("Based on: …" in
the notes). Texts of traits and actions are not rewritten.

## Maps

Pictures from maps folders (or any picture with "Show as a map"). The toolbar has two rows: the top one picks a
section — Fog, Players' view, Grid, Tokens, Pins — and the row under it holds that section's tools and settings (the
hand that moves the map is in every section; space or the middle button work too).

- **Fog** — reveal and hide with a brush or a rectangle, brush size, ⌘Z — undo, "Reveal all" / "Hide all".
- **Players' view** — what part of the map the players see: "Whole map", a frame (drag it to move; its edges and corners resize it, keeping the
  proportions of the players' screen), or "Like mine". "Like mine" stays pressed: while it is on, the players follow every move and zoom of your map — handy to set
  the picture up on the player screen before the game. Press it again to let go.
- **Grid** — no grid, squares or hexes (pointy or flat top) — icons; cells across the map, line width, opacity and colour, and
  the shift tool: cell count and offset fit the grid to the one drawn on the map; on hexes tokens stand in the centre
  of a hex.

For the players the fog is opaque with a soft edge, and the view glides when it changes. Fog and view are saved per
map: a map can be prepared in advance.

**Pins**: the pin tool puts a marker on the map — a title, a color, an icon (tavern, temple, shop, danger…) and a
note for yourself ("Borin the smith — the headman's brother"). Cards can be attached to a pin (the innkeeper, the
guard) — they open from the pin on the side. Pins can be dragged; the list of all the map's pins — "List" in the Pins section; whether new pins go to the players at once — the button next to it.
The players see only the pins the GM has shown them (the title, without the note) — even under fog: for example, when
the heroes have learned where the temple is. Pin size for the players — in the Maps settings.

**Tokens**: The Tokens section: "From combat" puts the participants of the current combat from Initiative on the map, "Party" —
the adventure's heroes, search — any card (an NPC, a monster) without a combat. New tokens take free cells in the middle
of what the players see. A token from combat takes its portrait, side (the outline color), turn (a white glow), wounds
and "hidden"; a defeated one turns grey. A hero's token already on the map isn't duplicated by "From combat" but linked
to the participant. Move them with the token tool or by hand; with the grid on, a token snaps to cells; size —
1×1…4×4, the overall token scale of the map — the "Size" slider; "List" opens the map's tokens and the search by card. Tokens lie under the fog: the players
don't see them in the unrevealed part. Layer order on the player screen: background, map, portraits.

## Scenes

A saved set of background, map, portraits, handout, music and ambience ("Tavern", "Combat!"). Set up the player
screen, save it as a scene, and during the game switch it on with one button in the right panel or ⌘1…⌘9. A scene
can include only some parts: for example, "Combat!" changes only the music and the map. A playing playlist doesn't
restart. A scene can also be created empty ("Empty" in the Scenes tab): switching it on changes nothing on screen, and
its tray in the right panel can be filled in advance. The ↻ button of a part takes it from the screen and checks it.

**The right panel "Player screen"**: blocks collapse with a click on the title. Empty blocks (nothing shown and the
tray is empty) are folded into one line: "Maps · none", "Music · silence". A folded block with something in it is
marked with a dot.

**The tray**: the Backgrounds, Handouts, Characters, Maps, Music and Initiative blocks hold what you need at hand. A
click on a tile puts it on the player screen, another click removes it; what's on screen has a frame with an eye
(several portraits can be on screen, one background, map and handout each). The tray fills three ways: everything put
on screen (from any tab) lands in it by itself; a tile can be dragged from a tab (or a map from the map list) onto a
block; "+" opens a file picker where several can be checked. The cross on a tile removes it from the tray but not from
the screen. Tiles show only the tray; what's on screen but not in it (say, left over from the previous scene) is a
separate "On screen: …" line with "to the tray" and "remove from screen" buttons. Every scene has its own tray (a new
scene starts it from its contents): you can stock a scene in advance and bring things out as needed during the game
without switching tabs. While no scene is on, the tray belongs to the adventure; it travels with the adventure (one
file, trash). "Save current" (+ in the Scenes block) takes into the new scene both what's on screen and the whole
tray: stock the panel and save it as a scene. It asks for a name first (Enter — save, Esc — cancel); rename a scene by
double-clicking it. Tiles and tray lines are reordered by dragging. The cross on the active scene leaves it: nothing
changes on screen, and the panel shows the adventure's tray again (for example, to put together the next scene).

Music in the tray is playlists (folders) and single tracks: a click plays (a track — on a loop), a click on the
playing one pauses. For example: in the tower — the tower theme, on the second floor — "Combat". The star on a line
(while a scene is on) marks the scene's main music: it starts with the scene; another click on the star — the scene
doesn't change the music. Ambience in the tray (in the Music block) is looped sound over the music (rain, tavern): a
click turns it on and off. Sounds are a block of their own: one-shot effects on a button (the lever was pulled —
thunder); a click plays the sound once over the music, on the same output device; there too — sound volume and "stop
all". Any audio file in Files can be played as a sound. Basic sounds are built in — in the "+" window they come first,
in the "Built-in" group: 38 effects (thunder, lever, doors, lock, coins, sword, spell, glass, rocks, monster roar,
ghost, giant, werewolf howl, bell and alarm bells, war horn, explosion, chains, arrows, whip, punch, body fall, ghost
wail, undead moan, horse and gallop, crows, owl, heartbeat, mad laughter, creaking floor, dogs…) and 23 ambience loops
(forest by day and night, eerie forest, campfire, torch, underground river, sea, swamp, rain, thunderstorm, winter and
desert wind, tavern, market, cave, haunted house, crypt, smithy, field at night, hearth, temple, pasture, wind in the
chimney). Sources and licenses —
`resources/sounds/README.md`. Combats in the tray are prepared encounters: a click starts that combat instead of the
running one (heroes added by hand stay) and opens Initiative (roll initiative), the running combat is highlighted, a
second click turns it off with all its participants. So the "Tower" scene can have both "Rats" and "Goblins" ready —
you start the one you need. Notes in the tray are small sheets, compendium entries with a picture — the picture.

When tabs don't fit, they shrink (the current one's title is always visible), and then the tab strip scrolls with the
wheel. A tab closes with the middle mouse button.

## Initiative

Combat participants with initiative, hit points, AC and D&D 5e conditions, "Roll for NPCs" (d20 + bonus), rounds,
damage and healing by typing "7" / "+5". Defeated enemies skip their turn. The players see a turn-order strip with
portraits and conditions on top, without hit point numbers; hidden ones (an ambush) aren't shown. The portrait outline
is the side: party gold, ally blue, neutral grey, enemy red; a portrait turns red as it takes wounds, the defeated stay
on the strip in grey (someone may revive them). The strip can sit at the top, bottom, left or right and change its size
right in the tracker header; names and wounds — in the Initiative settings. If the players can't judge some creature's
state, its wounds are hidden with the heart button in its row (the general setting doesn't change). A character with a
portrait can be added with the "to initiative" button on the picture's tile.

**Quick add** right in the tracker: start typing a name — cards of the adventure (monsters, NPCs, party), the library
and the SRD appear; picking one adds the creature with hit points, AC and pictures (×N — several at once). "Party" adds
the current adventure's heroes who aren't in the combat yet.

**Prepared encounters** (the Initiative side panel): a combat can be prepared in advance — "Rats in the Tower", "Crows
in the Field" — and when it happens, press "To combat": the participants join the current combat, the party stays. An
encounter belongs to an adventure and is kept (the fight can be repeated); the current combat can be saved as an
encounter.

## Cards

The Cards tab (bestiary): monsters and NPCs with a stat block, party characters with a sheet. All monsters of SRD 5.1
(the 2014 edition) and SRD 5.2.1 (the 2024 edition) are built in, in English and Russian. Search finds a monster in any
language ("гоблин" finds the Goblin too); filters — by edition, language and place. A monster can be added to
initiative as a batch: hit points, AC and the initiative bonus are filled in, hit points can be rolled by the formula;
from the tracker the stat block opens with one button. If a card has several pictures, they are dealt out in turn: four
bandits and four portraits — each gets their own. A participant's picture can be changed in the tracker: click their
portrait and pick another of the card's pictures.

An **NPC** is the same card but lying in a characters folder next to its portrait. In the Characters tab a portrait
with a card shows its stat block and a "to initiative" button below, a portrait without one — "Create card". The card
stores its side in combat (NPCs are allies by default, monsters — enemies); the side can be changed when adding and
right in the tracker. Below the portraits the Characters tab lists the current adventure's monsters (cards from its
monsters folders and shared ones): handy to add them to a combat in the right numbers, open the stat block and show
the portrait to the players.

**Portraits** are added right on the card page ("+" next to the portrait): from the vault, the clipboard or the disk.
This way a built-in monster can get a portrait too — it is stored in the library and shared by all of the card's
languages.

**Player characters** are cards with a D&D character sheet (abilities, skills, attacks, spells, features, equipment,
personality) in the adventure's party folder; in combat — the "party" side. The sheet is a reference for the GM, the
players don't see it. A character can be imported from Long Story Short: export the sheet to JSON, then "Import
character…" in the Characters tab (it goes to the current adventure's party folder) or "Import from file…" in the "+"
menu of the Cards tab: the avatar becomes the portrait.

The player remade their character (say, after the GM's notes)? The card has "Update from LSS…": pick the new export,
and the app shows what changed — level, abilities, hit points, AC, skills, attacks, spells, lines of equipment and
features (+ added, − gone). As in a git merge, every change and every line has a "take new" checkbox: unchecked keeps
the old value in the card (for example, take the new weapon but keep the removed rope). "Update the card" applies the
selection; portraits, notes, tags and side stay, and the previous version goes to the app's trash. Importing the same
character again (by the LSS avatar or by name in the same folder) doesn't make a copy either but shows the changes and
asks: update the card, create a new one or skip. A sheet can also be started and kept right in the app: pick the
"Player character" kind in the card editor.

**LSS spell cards.** If the spellbook in LSS is kept as cards, the character export has only spell numbers, without
names. The app takes the names from the "Long Story Short spells" table (the Cards settings); it is enough to load it
once:

1. Sign in to LSS in a browser and open the Grimoire (longstoryshort.app/spells/).
2. Open the developer tools (⌥⌘I / F12) → the Network tab and reload the page.
3. Find the request to api.longstoryshort.app with the spell list (a big response — an array by level, all the
   edition's spells at once) and save the response to a .json file (Response → right click → Save). Switch the edition
   in the Grimoire (2014 / 2024) and save the response once more.
4. In the app: the Cards settings → "Long Story Short spells" → "Load files…" and pick the saved files. The spells are
   found in them automatically; loading can be repeated — new ones are added to the old.

A player's own spells (created in LSS) aren't in the shared base: ask the player to save the response with them the
same way, or load a response saved on their character's open sheet. Whatever the table lacks is listed in a warning on
import ("not found: 3 of 8"); you can also switch the spellbook in LSS to text. The table is stored in the library
(`lss-spells.json`) and goes into backups.

A stat block or sheet opens in a side drawer on the right — from Characters, Files and the initiative tracker, without
leaving the current tab (Esc or pressing again — close, "In a tab" — open in the Cards tab).

**Rolls** — right from the stat block and the sheet: the "Attack" button under an action rolls a d20 and the damage at
once (on a natural 20 the damage dice are doubled), damage buttons roll only damage. Numbers are clickable too:
modifiers, saving throws, skills, initiative, attacks on a character sheet. Shift — with advantage, ⌥ — with
disadvantage. Results go to the Rolls log in the GM's window; the players don't see them.

Tiles in the Characters (portraits and monsters), Backgrounds and Handouts tabs, as well as pictures and cards in
Files, can be dragged within their group (folder) — for example, to put together everything for one scene. The order
is shared: what is rearranged in Files stays so in the tabs. It is remembered in the vault, new pictures go to the end,
files on disk aren't touched. Dragging is off while searching.

**Your own cards** are made in a visual editor ("+" in the Cards tab) — with a live stat block preview, several
portraits and GM notes. A built-in card can be edited in place: the edit is saved to the library and replaces the
built-in one everywhere — in the list, combats, on maps, in search (the list marks it "edited"); "Restore as in SRD"
removes the edit (the file goes to trash). A separate card based on a built-in one — "Make a copy…". Spellcasting is a
section of its own in the editor: the spellcasting ability, save DC and attack bonus (empty — worked out from the
ability and proficiency bonus) and spell groups: cantrips, "at will", "N per day", levels with slots. Names are
suggested from the compendium; in the stat block they are links to the entries, with a spell attack roll button next
to them. Spellcasting already written as a trait's text (as in the SRD) moves into this section with "Move from …".
Your cards are ordinary JSON files in the adventures' bestiary folders (monsters / bestiary / …) or in the library
shared by all campaigns — in the app's data folder (it can be changed in settings, for example to put it in the cloud).
The app asks where to keep a new card or a copy; "Move…" moves a card between adventures and the library without a
copy. In these folders the app creates and saves card files itself and copies pictures from disk next to the card.
Cards of version 0.9 from the hidden `.scrying-glass/cards` folder are moved into `monsters` in the vault root on the
first open. The card format isn't tied to D&D: it records the system and the language. Card files can be edited in
another app (or synced through the cloud): the app rereads them at once. If a file changes while the card is open in
the editor, the editor offers to load the new version or keep your edits. A card can have several languages:
"+ language" on the card page opens a translation in the editor. Card portraits are shown to the players with a
click, including those from the library.

Cards can be shared: export (a button on the card page — with all languages, or the "+" menu — the whole campaign or
the library) saves one JSON file together with the portraits. Import from the "+" menu adds the cards as new ones to
the campaign or the library.

The built-in bestiary: System Reference Document 5.1 and 5.2.1 © Wizards of the Coast, CC BY 4.0; numbers —
5e-bits/5e-database; the Russian translation — OmnisGM (rules.omnisgm.com), CC BY 4.0. More in
`resources/srd/README.md`.

## Music

Any folder with audio files (mp3, ogg, m4a, wav, flac) is a playlist. Tracks change with a crossfade; there are
shuffle and repeat. Ambience can be layered over the music: looped sounds (rain, tavern, battle) with their own volume.
The sound comes from the GM's computer and keeps playing even if the player screen is closed. Nothing plays by itself
after launch. The output device (for example, speakers instead of headphones) is chosen in the Music settings and
remembered on this computer.

Hotkeys (⌘ on macOS, Ctrl on Windows and Linux): ⌘P — pause, ⌘→ / ⌘← — next / previous track, ⌘↑ / ⌘↓ — volume,
⌘⇧A — ambience, ⌘B — black out the player screen, ⌘1…⌘9 — scenes, ⌘K — search.

## Backups and moving data

**Backups** (settings → Backups): the app takes snapshots of everything created in it — scenes, fog, pins and tokens of
maps, prepared encounters, notes, cards, the library (without pictures) and settings. A snapshot is taken when
the vault opens, every half hour of work (if something changed) and on quit; the last 20 are kept plus one per day for
a month, manual ones — always. The snapshot folder can be chosen (for example, in the cloud) — existing snapshots move
there, and a full copy is offered there by default too. "Restore…" brings back the vault data and/or the library; a
snapshot of the current state is saved first. Snapshots live in the app's data folder (`backups`). Snapshots don't copy
pictures and music — those are your files, keep them safe with Time Machine or the cloud. "Full copy to a file" is
there too: one `.sgbackup` file — settings, the whole library and the vault data (optionally with pictures and music).
"Restore from a file…" — into this vault or another folder (for example, on a new computer): files from the copy
replace the same ones, the rest stay, the folder structure (and empty folders) comes back.

**An adventure as one file** (the adventure switcher menu above the side panel): "Export “…”…" saves a `.sgpack` file —
the adventure folder with all pictures, notes and cards (music — if you like), its scenes, maps with fog, pins
and tokens, prepared encounters, tile order and the shared cards the encounters and pins refer to. "Import adventure…"
adds it to the open vault: if the name is taken, the app asks for another; paths are recalculated; shared cards go to
the library (yours aren't overwritten). A snapshot is taken before the import. A `.sgpack` is a plain ZIP. There too:
"Export party…" (the adventure's player character sheets with portraits — one cards file) and "Import characters…"
(such a file or a Long Story Short export — straight into the current adventure's party folder). "Delete “…”…" is there
as well: the adventure folder goes to trash, its scenes, encounters and map markup are removed from the app; from the
trash the adventure comes back together with them. A snapshot is taken before deleting.

## Role-playing systems

The adventure switcher also sets the adventure's **system** (D&D 5e 2024 or 2014, Fate Core, Mausritter; for "Whole vault" — the
default system). Cards, combat suggestions, ⌘K search and the compendium show what fits that system (both D&D editions
together); the built-in SRD and the D&D tools (encounter difficulty, point buy) — only in D&D adventures. A compendium
entry is tied to a system with the `system:` field in the header (`fate-core`, `dnd5e` …); without it spells, items,
feats and conditions count as D&D entries, while rules and notes fit any system. Systems you don't need are turned off
in settings (Game systems): their content disappears everywhere — cards, SRD entries, adventures
with that system (together with their scenes and encounters). The files stay in place: turn the system back on and
everything returns. Adventures created before systems existed count as D&D 5e (2024).

**Fate Core.** The card (one for player characters and NPCs): NPC importance (nameless, supporting, main), high concept,
trouble and other aspects, skills in a pyramid on the ladder (a click on a skill rolls 4dF + skill into the log; the
total is named by the ladder: "Good (+3)"), stunts, refresh. Stress and consequences follow the rules (from Physique
and Will, for NPCs — by importance) or are set by hand. The tracker in a Fate adventure: turn order by Notice (or the
chosen skill) without a roll, stress boxes with a click, consequences as text, "take out", aspects on participants
instead of conditions; a portrait turns red for the players with the checked stress and consequences. The "Aspects &
fate points" block in the right panel (Fate only): scene aspects with free invokes (the players don't see hidden ones
until they are revealed) and fate points — for the party's characters ("Party" button, refresh from the card; "New
session" — up to refresh) and for the GM ("new scene" — one point per character). The players see aspects and points
(by the portraits) in the chosen corners of the screen — by default bottom left and right; the corner is picked with
the diagram by the title, next to it — the eye: show or not.

**Mausritter.** One card for creatures and mice: HP (Hit Protection), STR, DEX, WIL, armour, attacks (a click on a die
rolls damage), critical damage, other features, wants, warband scale; "Paste stat block" fills the card from a stat
block written as in the SRD. A mouse also gets a sheet: level, XP to the next level, Grit, pips, background, birthsign,
coat, physical detail and ten inventory slots (two paws, two body, six pack) with usage dots; Conditions take slots,
items past the ten make the mouse encumbered. A click on STR, DEX or WIL rolls a save: d20 at or under the attribute
(Shift — advantage, the lower of 2d20; ⌥ — disadvantage). The tracker in a Mausritter adventure: HP, STR / DEX / WIL
now and maximum, armour; damage past HP goes to STR, STR 0 takes the combatant out; turn order 2 — before the
opponents (a passed DEX save or an ambush), 1 — the opponents ("Opponents' order"), 0 — after them, DEX breaks ties;
the Mausritter Conditions (a click opens the Conditions entry). **Tools → Mouse** (Mausritter adventures only) makes a
new mouse by the SRD procedure: attributes (3d6, the two highest — the dice are shown, two attributes can be swapped),
HP and pips, the background with its two items (a weak mouse gets items of another background), torches, rations, a
weapon, birthsign, coat, physical detail and a name; "Create card" opens a mouse sheet with the inventory laid out
(weapon in the paws, armour on the body, the rest in the pack), "To journal" and "Copy" — as text. **Tools →
Mausritter tables** rolls on the GM tables of the SRD by its rules: a mouse settlement (size — the lower of 2d6,
governance — d6 + size, cities and towns get two features or trades, a name and, from a hamlet up, a tavern), a hex
(the landmark by hex type, its detail by d6 and d8), an adventure site (theme and N rooms: type, creature, treasure
and what is there), a treasure horde (a d20 more for each "yes"; magic swords with a 1-in-6 curse, spells, pips
counted), a GM mouse, hirelings (a WIL save or 20p, then how many look for work, each with d6 HP and 2d6 attributes
and a card in one click), an adventure seed, the weather and event of a season (poor weather is marked) and a
reaction. The dice are shown; "To journal" and "Copy" take the result as Markdown. **Tools → Factions** keeps the
adventure's factions: resources, goals with progress marks (a click marks one), and "Between sessions" rolls d6 + the
faction's relevant resources − a rival's for each current goal (4–5 — a mark, 6+ — two; a completed goal suggests a
new resource); the ten example factions of the SRD are added from a list. The **Exploration** block in the right panel
counts turns in an adventure site (every third — an encounter roll: 1 — an encounter, 2 — an omen; every sixth —
torches mark usage) and watches of travel (four a day; morning and evening start with an encounter roll and its hour).
Factions and the clock belong to the adventure: they go into the .sgpack and to the trash with it.

## Files and trash

Pictures, maps and tracks can be deleted from the app (the trash can button on hover).

**Trash** — the app's own, like Obsidian's: deleted files, cards, compendium entries and adventures move to the
hidden `.trash` folder of the vault (or the library — for shared ones) rather than the system trash, which may be
emptied on its own. Files → Trash at the bottom of the tree: what, from where and when was deleted, "Restore" to the old
place (missing folders are created; a taken name — "x (2)"), "Delete forever" and "Empty trash". In settings (Files →
Trash) you can turn on automatic cleanup — after a week, 30 or 90 days, a year — or delete right away, without the
trash.

In card folders (monsters, characters, party) Files shows the cards themselves: they can be opened, moved and deleted
(with their pictures — optionally), and "New card" and "Import cards…" create and import cards right into the open
folder. A picture from the clipboard (a screenshot, "Copy image" in a browser, a file copied in Finder) can be pasted
into the open folder in Files with "Paste" or ⌘V. The Characters, Backgrounds, Handouts and Maps tabs have the same
button: the picture goes into that tab's folder in the current adventure (without an adventure — into the vault root).
The app watches the folder: new and deleted files show up at once. The user's files aren't changed; the app keeps its
own data (captions, what's on screen) in `.scrying-glass/state.json` inside the vault. Paths there are relative, so the
vault can be synced between computers.

The app offers to move version 0.3 data (linked folders and pictures added by hand) on the first open of a vault.

## Project structure

TypeScript + Svelte 5 + Electron, built with electron-vite. An Obsidian-like interface: a module strip on the left, a
side panel, tabs, the player screen preview on the right. Settings: ⌘, (Ctrl+,).

- src/main/: the core (state, vault, saving, windows, migration of older versions' data)
- src/preload/: the bridge between the windows and the core (window.api)
- src/shared/: shared types; state and actions are derived from the module list; vault.ts — the vault tree;
  i18n/ — the localization core and dictionaries
- src/renderer/control/: the control window (shell, tabs, settings, player screen panel)
- src/renderer/display/: the player screen window
- src/renderer/lib/: shared by the windows: state, theme, the player screen stage (Stage.svelte)
- src/modules/<name>/: app features
  - main.ts: core state and actions (defineModule)
  - control.ts: what the module adds to the control window (defineControl): icon, tab, side panel, a block in the
    player screen panel, a settings section, actions on pictures and tracks, an invisible background component (that's
    how the music player works)
  - display.ts: a layer on the player screen (defineDisplay)
  - i18n.ts: the module's messages (English and Russian)
  - ui/: the module's Svelte components
- src/systems/<system>/: role-playing systems for cards: stats, stat block, editor, tracker (D&D 5e, Fate Core, Mausritter)
- resources/srd/: the built-in bestiary, built by scripts/import-srd.ts
- resources/compendium/: the built-in compendium (`<system>.<lang>.json`)
- src/modules/index.ts: the list of core modules, a new module is added here; the windows pick up control.ts and
  display.ts by themselves

For testing, the app can run with a separate data folder: `SG_USER_DATA=/path npm run dev`.

## License

GNU GPL version 3 or later (`LICENSE`). The built-in bestiary and compendium are SRD 5.1 / 5.2 material under CC BY 4.0,
credits in `resources/srd/README.md` and `resources/compendium/README.md`; the Fate compendium is based on the Fate
Core SRD (Evil Hat Productions, CC BY 3.0); the Mausritter creatures and compendium — Mausritter SRD 2.3.1 (Losing
Games and Isaac Williams, CC BY 4.0). Note fonts (Marck Script, Bad Script, Caveat, Great Vibes, Amatic SC,
Neucha, Comforter Brush, Cormorant Garamond, Old Standard TT, Kurale, Forum, Yeseva One, Ruslan Display, Ponomar,
Monomakh, Underdog, Rubik Wet Paint, Rubik Distressed, Rubik Beastly) — SIL Open Font License 1.1, the license texts
lie next to the fonts in `src/renderer/lib/note/fonts/`. Seal emblems — Lucide outlines (ISC). Built-in sounds
(`resources/sounds/`): ambience — Nature Ambient Pack Vol 1, JC Sounds, CC BY 4.0; effects — Kenney (RPG Audio),
artisticdude (RPG Sound Pack), rubberduck (100 CC0 SFX #2), CC0; more ambience and effects — Joseph Sardin,
BigSoundBank.com, CC0. More in `resources/sounds/README.md`.
