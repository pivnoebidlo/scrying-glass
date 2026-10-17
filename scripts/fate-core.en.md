<!--
Built-in Fate Core compendium (English): the source of resources/compendium/fate-core.en.json (npm run build-fate).
An entry starts with «@@ Title», then «key: value» fields up to an empty line, then the text (compendium Markdown,
[[links]] by English titles). The titles match the English names in fate-core.ru.md, which pairs the two books.
The text is a retelling of the Fate Core SRD (Evil Hat Productions, CC BY 3.0) written for the app.
-->

@@ The Ladder
type: rule
category: Basics

Every number in Fate — skills, roll results, difficulties — has a name on the ladder:

| Number | Rung |
|---|---|
| +8 | Legendary |
| +7 | Epic |
| +6 | Fantastic |
| +5 | Superb |
| +4 | Great |
| +3 | Good |
| +2 | Fair |
| +1 | Average |
| 0 | Mediocre |
| −1 | Poor |
| −2 | Terrible |

"She has Good (+3) Shoot", "a Fair (+2) lock". Numbers above and below the ladder exist too — they are just called by the number.

A skill the character doesn't have is Mediocre (0). See [[Fate Dice]], [[Outcomes]].

@@ Fate Dice
type: rule
category: Basics
aliases: 4dF, rolls

Roll four Fate dice (4dF): each has two "+" sides, two "−" sides and two blanks. "+" is +1, "−" is −1, blank is 0, so the dice total runs from −4 to +4 and is usually near zero.

**Result** = dice + skill (+ bonuses from stunts and invoked [[Aspects|aspects]]). It is compared with the opposition — a difficulty set by the GM or an opponent's roll. Each point the result beats it by is a **shift**.

Roll only when failure has interesting consequences and the result is not obvious. Name the total by the [[The Ladder|ladder]]: "rolled +1 with Good (+3) Athletics — Great (+4)".

After the roll you can [[Invoke|invoke an aspect]]: +2 to the result or a reroll of all four dice.

@@ Outcomes
type: rule
category: Basics
aliases: fail, tie, success, success with style

Compare the result with the opposition:

- **Fail** — the result is lower. It didn't work, or it worked at a serious cost.
- **Tie** — the result is equal. It worked at a minor cost or only partly.
- **Success** — higher by 1–2 shifts. It worked.
- **Success with style** — higher by 3 or more shifts. It worked, and you get something extra (usually a [[Boost|boost]]).

What each outcome gives depends on the action: [[Overcome]], [[Create an Advantage]], [[Attack]], [[Defend]].

@@ Overcome
type: rule
category: Actions

The action to get past an obstacle: pick a lock, climb a wall, talk a guard round, find a clue.

- **Fail** — it didn't work, or it worked at a serious cost (the GM names it).
- **Tie** — it worked at a minor cost: a [[Boost|boost]] for the opponent, a complication, lost time.
- **Success** — it worked without complications.
- **Success with style** — it worked, and you get a [[Boost|boost]].

The opposition is a difficulty set by the GM (see [[Opposition]]) or a roll by whoever is in the way.

@@ Create an Advantage
type: rule
category: Actions

The action to change the situation in your favor: create a new [[Aspects|aspect]] ("Sand in the Eyes", "Behind the Pillar") or discover one that exists but wasn't known.

**A new aspect:**
- **Fail** — no aspect, or there is one but the opponent gets the [[Free Invoke|free invoke]].
- **Tie** — no aspect, but you get a [[Boost|boost]].
- **Success** — the aspect appears and you have one free invoke on it.
- **Success with style** — the aspect and two free invokes.

**An existing aspect** (known or hidden):
- **Fail** — someone else (usually the opponent) gets a free invoke on it.
- **Tie and success** — one free invoke.
- **Success with style** — two free invokes.

@@ Attack
type: rule
category: Actions

The action to cause harm: physical ([[Fight]], [[Shoot]]) or mental ([[Provoke]]). The opponent responds with [[Defend|defense]].

- **Fail** — you miss.
- **Tie** — you miss, but you get a [[Boost|boost]].
- **Success** — a hit: the shifts are the strength of the blow. The target absorbs them with [[Stress|stress]] and [[Consequences|consequences]], or is [[Taken Out|taken out]].
- **Success with style** — a hit; you may reduce it by 1 shift to take a [[Boost|boost]].

@@ Defend
type: rule
category: Actions

The answer to someone's [[Attack|attack]] or [[Create an Advantage|advantage]] against you. It is rolled on their turn, as many times per exchange as needed.

- **Fail** — they get what they were after.
- **Tie** — see the tie of their action (on an attack they get a [[Boost|boost]]).
- **Success** — you stop them.
- **Success with style** — you stop them and get a [[Boost|boost]].

Physical defense uses [[Athletics]] and [[Fight]], defense against intimidation — [[Will]], against deceit — [[Empathy]], against being followed — [[Notice]].

**Full defense.** You can give up your action on your turn: until your next turn every defense roll gets +2.

@@ Aspects
type: rule
category: Aspects

An aspect is a short phrase that describes something important and is true in itself: "Finest Blade in Arcadia", "Owes Everyone at the Docks", "The Warehouse Is on Fire".

**Kinds:**
- **High concept** — who the character is: "Exiled Knight with a Cursed Sword".
- **Trouble** — what keeps making their life hard: "The Dead Won't Let Me Sleep".
- **Other character aspects** — relationships, beliefs, the past.
- **Scene (situation) aspects** — what matters here and now: "Slippery Floor", "Crowded Square". They come from [[Create an Advantage|creating an advantage]] and end with the scene.
- **[[Consequences]]** — wounds and injuries are aspects too.
- **[[Boost|Boosts]]** — a fleeting advantage for one invoke.

An aspect can be [[Invoke|invoked]] (for a [[Fate Points|fate point]] — +2 or a reroll) and [[Compel|compelled]] (a complication in exchange for a point). An aspect also permits: "Winged" can fly without a roll.

@@ Invoke
type: rule
category: Aspects
aliases: invoking

After a roll, spend a [[Fate Points|fate point]] (or a [[Free Invoke|free invoke]]) and name an [[Aspects|aspect]] that helps right now. Choose one:

- **+2** to the result;
- **reroll** all four dice;
- **+2 to opposition** — hinder someone else's action;
- **+2 to someone else's roll** — help an ally.

The aspect has to fit the situation: "Finest Blade in Arcadia" helps with fencing, not haggling. You can invoke several aspects on one roll, but each only once for a point (free invokes on the same aspect stack).

Someone else's aspect or a scene aspect can be invoked too if it helps: the enemy's "Sand in the Eyes" for your attack.

@@ Free Invoke
type: rule
category: Aspects

An invoke without a [[Fate Points|fate point]]. It goes to whoever created or discovered the [[Aspects|aspect]] by [[Create an Advantage|creating an advantage]], and to whoever inflicted a [[Consequences|consequence]] on an opponent.

A free invoke can be passed to an ally. Several free invokes on one aspect can be spent on one roll, together with a paid invoke as well. Unused ones vanish when the aspect goes away.

On the player screen free invokes of a scene aspect are shown as circles.

@@ Boost
type: rule
category: Aspects

A fleeting [[Aspects|aspect]]: "Off Balance", "An Opening". It gives one [[Free Invoke|free invoke]] — and vanishes as soon as it is invoked (or when the moment has passed).

Boosts come from a tie or a success with style on some actions: see [[Outcomes]].

@@ Compel
type: rule
category: Aspects

The GM (or another player) offers a character's [[Aspects|aspect]] as a reason for a complication: "You 'Owe Everyone at the Docks', and at the pier your creditors recognize you." And holds out a [[Fate Points|fate point]].

- **Accept** — take the point, and the complication happens.
- **Refuse** — pay a point of your own, and it doesn't.

A compel can be about a decision ("you 'Never Leave a Friend Behind' — will you go after him?") or an event ("the cursed sword calls again"). A player can propose a compel on their own aspect — and get the point.

@@ Fate Points
type: rule
category: Fate Points
aliases: points, refresh

Fate points [[Invoke|invoke aspects]], refuse [[Compel|compels]] and power some stunts. You get them by accepting a compel, [[Concede|conceding]] a conflict and when an opponent invokes your aspect against you (the point comes after the scene).

**Refresh** — how many points a character has at the start of a session. Usually 3; each stunt beyond the three free ones lowers it by 1 (not below 1). If you have more points than your refresh at the start of a session, you keep them.

**The GM's pool** — at the start of every scene the GM has one point per character in it. The GM spends them to invoke NPC aspects.

In the app the characters' and the GM's points are in the "Aspects & fate points" block of the right panel.

@@ Conflict
type: rule
category: Conflicts
aliases: combat, exchange, turn order

When the sides want to harm each other — physically or mentally.

1. **The scene.** The GM names the scene aspects and the zones (parts of the place you have to move between).
2. **Turn order.** In a physical conflict — by [[Notice]] (ties — Athletics, then Physique), in a mental one — by [[Empathy]] (ties — Rapport, then Will). It is not rolled.
3. **Exchanges.** On their turn everyone takes one action ([[Attack]], [[Create an Advantage]], [[Overcome]]) and may move one zone for free. You can [[Defend|defend]] any number of times.
4. **The end.** When one side has [[Concede|conceded]] or been [[Taken Out|taken out]].

Hits are absorbed by [[Stress]] and [[Consequences]].

@@ Stress
type: rule
category: Conflicts

Stress is bruises, fatigue, fright: what goes away by itself after the conflict.

Two tracks: **physical** (depends on [[Physique]]) and **mental** (on [[Will]]). Usually 2 boxes each; Average or Fair (+1/+2) — 3 boxes, Good or Great (+3/+4) — 4 boxes; Superb (+5) and higher — 4 boxes and one more mild [[Consequences|consequence]] of that kind.

**How to absorb:** box number N absorbs a hit of N shifts. Check the box equal to the hit; if it is taken or doesn't exist — a bigger box. One box per hit, consequences can be added to it. Not enough — you are [[Taken Out|taken out]].

Stress clears after the conflict. In the app's tracker boxes are checked with a click.

@@ Consequences
type: rule
category: Conflicts

A consequence is a more serious wound: it absorbs more shifts but stays on the character as an [[Aspects|aspect]]. Whoever inflicted it gets a [[Free Invoke|free invoke]] on it.

| Consequence | Absorbs | Clears | Start recovery (difficulty) |
|---|---|---|---|
| Mild | 2 | after the scene | Fair (+2) |
| Moderate | 4 | after the session | Great (+4) |
| Severe | 6 | after the scenario | Fantastic (+6) |

Recovery starts with an [[Overcome|overcome]] action (treatment, rest, comfort); treating yourself — +2 to the difficulty. Once recovery starts, the consequence is renamed ("Broken Arm" → "Arm in a Splint").

**An extreme consequence** absorbs 8 shifts and permanently replaces one of the character's aspects. It can be taken once between major [[Milestones|milestones]].

@@ Concede
type: rule
category: Conflicts

Before the opponent's roll you can concede: the character loses the conflict but decides how — runs away, is captured, passes out — and cannot die.

For that they get a [[Fate Points|fate point]] and one more for every [[Consequences|consequence]] taken in this conflict.

@@ Taken Out
type: rule
category: Conflicts
aliases: taken out of the fight

If a hit can't be absorbed — neither by [[Stress|stress]] nor by [[Consequences|consequences]] — the character is out of the conflict, and the winner decides what happens to them (within reason for the scene).

To keep that decision out of the opponent's hands, [[Concede|concede]] earlier.

In the app's tracker a character taken out is marked with the button in the stress cell: they skip their turn and turn grey for the players.

@@ Contest
type: rule
category: Challenges
aliases: chase, race

The sides want the same thing but don't harm each other: a chase, a race, an argument.

Every exchange everyone rolls [[Overcome]] against each other. The best result is a **victory**; success with style — two victories; a tie — no victories, but the situation changes (a new [[Aspects|scene aspect]]). The first to three victories wins.

Instead of rolling you can [[Create an Advantage|create an advantage]] — but then you get no victory in that exchange.

@@ Challenge
type: rule
category: Challenges

A complicated task in several parts: keeping a burning ship afloat, readying a fortress for a siege. The GM names the obstacles, each is overcome with its own skill ([[Overcome]]), and the outcome adds up from the successes and failures.

@@ Teamwork
type: rule
category: Actions
aliases: help

There are two ways to help:

- **With your skill.** Each helper with the skill at Average (+1) or better gives +1 to the one rolling. Helpers take no action of their own that exchange and share the cost of failure.
- **With aspects.** [[Create an Advantage|Create an advantage]] and give an ally the [[Free Invoke|free invoke]].

@@ Opposition
type: rule
category: GM
aliases: difficulty

**Passive opposition** — a difficulty the GM sets by the [[The Ladder|ladder]]: Average (+1) or Fair (+2) — an ordinary task, Good (+3) — not easy, Great (+4) and up — hard. Below the character's skill — likely success, above — an interesting risk.

**Active opposition** — a roll by whoever is in the way: a guard notices ([[Notice]]) someone sneaking ([[Stealth]]).

Roll only if failure leads somewhere interesting. Otherwise it's simply a success.

@@ Stunts
type: rule
category: Character

A stunt is a character's special trick. It usually does one of three things:

- **+2** to a skill in a specific case: "+2 to Fight when fighting with two blades".
- **Another skill instead of the usual one**: "can attack with Deceive as with Provoke when playing a trick on someone".
- **An exception to the rules**: "once per session can declare they know someone in this town".

Three stunts are free, each one after that lowers [[Fate Points|refresh]] by 1. Examples are in the skill entries.

@@ Milestones
type: rule
category: Advancement
aliases: advancement, experience

Characters change at milestones — usually at the end of a session or scenario.

- **Minor** (end of a session): swap two skills, replace a stunt, rewrite an aspect (not the high concept).
- **Significant** (end of a scenario): the same, plus +1 to one skill (the pyramid must hold: no more skills on a rung than on the rung below); a moderate [[Consequences|consequence]] held for two sessions clears.
- **Major** (a turn of the campaign): the same, plus +1 [[Fate Points|refresh]], the high concept can be rewritten; a severe consequence held for two sessions clears.

@@ Character Creation
type: rule
category: Character

1. **High concept and trouble** — the two main [[Aspects|aspects]].
2. **Three more aspects** — the past and ties to the other characters.
3. **Skills** in a pyramid: one Great (+4), two Good (+3), three Fair (+2), four Average (+1). The rest are Mediocre (0).
4. **Stunts** — three for free, more at the cost of [[Fate Points|refresh]].
5. **Refresh** — 3.
6. **[[Stress]] and [[Consequences]]** — from Physique and Will.

@@ NPCs
type: rule
category: GM
aliases: nameless, supporting, main, NPC

**Nameless** — guards, bandits, the crowd. One or two aspects, one or two skills (Average or Fair), little or no stress (Average — 0 boxes, Fair — 1, Good — 2), no consequences. They can be joined into a **mob**: it rolls the best skill with +1 per helper and shares one stress track.

**Supporting** — the villain's lieutenant, the captain of the guard. High concept and trouble, a few skills (the best — Good or Great), one or two stunts, two stress boxes each, mild and moderate consequences.

**Main** — villains and important allies: like the player characters, or even stronger.

On a Fate card this is the "Importance" field: from it the app works out stress and consequences by the rules.

@@ Athletics
type: skill

Movement, agility, physical endurance in action: running, jumping, climbing, dodging.

- **Overcome:** get across, jump over, catch up, get away.
- **Create an advantage:** a good position, "At the Top of the Stairs".
- **Attack:** no.
- **Defend:** against physical attacks — dodge, leap aside.

**Stunts:** *Acrobat* — +2 to Athletics to overcome an obstacle by jumping or climbing. *Cat-Footed* — after a successful Athletics defense may move one zone for free.

@@ Burglary
type: skill

Breaking and entering: locks, traps, guards, pockets.

- **Overcome:** pick, bypass an alarm, lift.
- **Create an advantage:** case the place beforehand — "A Weak Spot in the Fence".
- **Attack and defend:** no.

**Stunts:** *Always a Way Out* — +2 to Burglary to create an advantage for an escape.

@@ Contacts
type: skill

Acquaintances and rumors: whom the character knows and who knows them.

- **Overcome:** find the right person, pick up a rumor.
- **Create an advantage:** "My Man at the Docks", "Word Is That…".
- **Defend:** against those who use their connections against you (rumors, tip-offs).

**Stunts:** *Ears Everywhere* — +2 to Contacts to learn what's going on in town.

@@ Crafts
type: skill

Working with your hands: build, repair, break, figure out a mechanism.

- **Overcome:** fix, break, put together.
- **Create an advantage:** find a flaw — "A Loose Beam".
- **Attack:** rarely (bring a wall down on the enemies).

**Stunts:** *Golden Hands* — once per scene can fix a thing without a roll if they have time and tools.

@@ Deceive
type: skill

Lies, bluffs, disguise, sleight of hand.

- **Overcome:** fool someone, pass yourself off as someone else.
- **Create an advantage:** a false trail, a distraction — "Thinks I'm One of Them".
- **Defend:** against attempts to see through you ([[Empathy]], [[Investigate]]).

**Stunts:** *White Lie* — +2 to Deceive when posing as someone who has a right to be here.

@@ Drive
type: skill

Handling vehicles: a cart, a boat, a car — whatever the game world has.

- **Overcome:** a chase, a tricky maneuver.
- **Create an advantage:** "Lost Them Round the Corner".
- **Defend:** get out of the way of a vehicle.

**Stunts:** *Pedal to the Metal* — +2 to Drive in a chase [[Contest|contest]].

@@ Empathy
type: skill

Understanding people: their feelings, intentions, lies.

- **Overcome:** rarely — calm someone down, catch the right moment.
- **Create an advantage:** read a person — learn one of their [[Aspects|aspects]].
- **Defend:** against [[Deceive]].
- **Special:** turn order in a mental [[Conflict|conflict]]; helps start recovery from mental [[Consequences|consequences]].

**Stunts:** *Sees Right Through You* — +2 to Empathy when someone lies to their face.

@@ Fight
type: skill

Close combat: fists, blades, clubs.

- **Attack and defend:** at close range.
- **Create an advantage:** "Off Balance", "Pinned Against the Wall".
- **Overcome:** rarely (an exhibition bout).

**Stunts:** *Blade Master* — +2 to Fight attacks with their own blade. *Heavy Hand* — on a success with style with a Fight attack the hit is 1 shift stronger instead of a [[Boost|boost]].

@@ Investigate
type: skill

Careful searching: clues, tracks, archives, a search of the premises.

- **Overcome:** find a clue, solve a puzzle.
- **Create an advantage:** a deduction from what was seen — an [[Aspects|aspect]] of a person or a place.

Unlike [[Notice]] — not spotting something by chance but looking for it on purpose, long and thoroughly.

**Stunts:** *Misses Nothing* — once per scene can ask the GM one question about a clue and get an honest answer.

@@ Lore
type: skill

Learning: history, sciences, secret knowledge.

- **Overcome:** remember, look up in books, figure out.
- **Create an advantage:** "I Know This Creature's Weakness".

In worlds with magic, lore is often its basis (through stunts).

**Stunts:** *Walking Library* — +2 to Lore to create an advantage against creatures they have read about.

@@ Notice
type: skill

Noticing what's around you — at once, without searching.

- **Overcome:** spot, hear.
- **Create an advantage:** "I See a Way Out", "He's Nervous".
- **Defend:** against [[Stealth]].
- **Special:** turn order in a physical [[Conflict|conflict]].

**Stunts:** *On Guard* — +2 to Notice to spot an ambush; in a conflict goes first if they spotted the ambush.

@@ Physique
type: skill

Strength and endurance: lift, break down, endure.

- **Overcome:** break down a door, withstand poison.
- **Create an advantage:** a grapple — "I've Got Him".
- **Special:** physical [[Stress|stress]] boxes and an extra mild [[Consequences|consequence]] at Superb (+5).

**Stunts:** *Tough Nut* — once per session may treat a moderate consequence as mild.

@@ Provoke
type: skill

Intimidate, anger, get under someone's skin.

- **Attack:** mental — fear, rage, humiliation.
- **Create an advantage:** "Furious", "Afraid of Me".
- **Overcome:** scare off, force to back down.

**Stunts:** *Terrible Glare* — +2 to Provoke when intimidating someone who is already hurt.

@@ Rapport
type: skill

Charm, trust, the knack of coming to terms.

- **Overcome:** persuade, win someone over.
- **Create an advantage:** "Friends Forever", "The Crowd Is on Our Side".
- **Defend:** against attempts to ruin your reputation.
- **Special:** the second turn order skill in a mental conflict.

**Stunts:** *Life of the Party* — +2 to Rapport to create an advantage at a feast or in a tavern.

@@ Resources
type: skill

Money, property, gear.

- **Overcome:** buy, bribe.
- **Create an advantage:** "The Best Gear", "A Bribe to the Right Person".

**Stunts:** *Money Talks* — once per session may use Resources instead of any skill to overcome, if the problem can be solved with money.

@@ Shoot
type: skill

Shooting and throwing: bows, crossbows, pistols, knives.

- **Attack:** at range (no farther than the weapon and the scene allow).
- **Create an advantage:** "Pinned Down", "In My Sights".
- **Overcome:** a trick shot.
- **Defend:** no.

**Stunts:** *Sniper* — +2 to Shoot attacks against a target that doesn't know about the shooter.

@@ Stealth
type: skill

Hiding and sneaking.

- **Overcome:** get past unseen.
- **Create an advantage:** "In the Shadows", "Ambush".
- **Defend:** against [[Notice]] and [[Investigate]].

**Stunts:** *Like a Shadow* — +2 to Stealth in the dark.

@@ Will
type: skill

Strength of mind: endure, not give in, stay focused.

- **Overcome:** resist temptation, fear, pain.
- **Defend:** against mental attacks ([[Provoke]]).
- **Special:** mental [[Stress|stress]] boxes and an extra mild [[Consequences|consequence]] at Superb (+5).

**Stunts:** *Unbending* — +2 to Will against intimidation.
