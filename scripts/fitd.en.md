<!--
Built-in Forged in the Dark compendium (English): the source of resources/compendium/fitd.en.json (npm run build-fitd).
An entry starts with «@@ Title», then «key: value» fields up to an empty line, then the text (compendium Markdown,
[[links]] by English titles). The titles match the English names in fitd.ru.md, which pairs the two books.
The text is a retelling of the Blades in the Dark SRD (One Seven Design, CC BY 3.0) written for the app; the setting
of the original game is not used.
-->

@@ The Game
type: rule
category: Basics
aliases: Forged in the Dark

A game about a group of daring scoundrels building a criminal enterprise — the **crew**. We play to find out whether the fledgling crew can thrive among the threats that surround it.

- Each player makes a character and, together, the crew they belong to ([[Character Creation]], [[Crew Creation]]).
- The GM plays the world: every NPC and faction has a concrete desire and a preferred way to get it. The GM doesn't plan the story — they offer opportunities and follow the actions and consequences wherever they lead.
- A session is like an episode: the crew picks a job (a **score**), jumps straight into it, takes actions, suffers consequences and finishes it — then has downtime to recover, indulge vices and pursue side projects. See [[Game Structure]].

Six-sided dice only: [[Dice Pools]].

@@ Judgment Calls
type: rule
category: Basics

Everyone contributes, but each call has someone with the final say:

- **Which actions are reasonable** for a problem — the players. Can this lock be finessed, or must it be tinkered with?
- **How dangerous and how effective** an action is here — the GM ([[Position]], [[Effect]]).
- **Which consequences** follow from the danger — the GM ([[Consequences]]).
- **Whether a roll is needed**, and which one — the GM.
- **Which events match the xp triggers** — the players ([[Advancement]]).

@@ Dice Pools
type: rule
category: Basics
aliases: rolling the dice, critical, full success, partial success, bad outcome, zero dice

Roll several d6 at once and read the **single highest** die:

| Highest die | Result |
|---|---|
| two or more 6s | **Critical** — success with an extra advantage |
| 6 | **Full success** — things go well |
| 4–5 | **Partial success** — you do it, but there's a consequence |
| 1–3 | **Bad outcome** — things go poorly |

**Zero dice** (or fewer): roll 2d and take the **lowest**; no critical is possible.

The pool is a trait's rating — an action, an attribute, the crew's [[Tier]], a gang's quality — usually one to four dice. Even one die is a 50% chance of success.

The four rolls of the game: [[Action Roll]], [[Resistance Roll]], [[Fortune Roll]] and downtime rolls ([[Downtime]]). When in doubt, collapse back to this simple roll and look up the exact rule later.

@@ Game Structure
type: rule
category: Basics
aliases: free play, phases

Play moves through four loose phases:

1. **Free play** — characters talk, go places, do things, roll as needed.
2. **Planning and engagement** — the group picks a target and a type of plan; the [[Engagement Roll]] sets the opening situation. See [[Plans]].
3. **The score** — the crew engages the target: rolls, obstacles, [[Flashbacks]], until the operation succeeds or fails.
4. **Downtime** — [[Payoff]], [[Heat]] and [[Entanglements]], then each character's downtime activities. See [[Downtime]].

Then back to free play. The phases are a menu, not a cage: use whichever suits what you're doing.

@@ Progress Clocks
type: rule
category: Basics
aliases: clock, clocks

A circle split into segments that tracks ongoing effort against an obstacle, or the approach of trouble. Fill segments as things happen; when it's full, the thing is done — or the danger arrives.

- **Size**: a complex obstacle — 4 segments, a more complicated one — 6, a daunting one — 8.
- Make the clock about the **obstacle**, not the method: "Interior Patrols", not "Sneak Past the Guards". A tough target can be layered: perimeter, guards, the office safe.
- A clock reflects the fiction — it's a speedometer, not the engine. Simple obstacles need no clock: one roll settles them.

Kinds of clocks:

- **Danger** — suspicion, pursuit, alarm. A complication ticks 1, 2 or 3 segments ([[Consequences]]).
- **Racing** — two opposed clocks: "Escape" against "Cornered". If both fill at once, the crew gets home but the hunters are at the door.
- **Linked** — a full clock unlocks another: "Defense", then "Vulnerable".
- **Mission** — a window of opportunity; when it runs out, the chance is gone.
- **Tug-of-war** — filled and emptied by events: a riot brewing, a turf war.
- **Long-term project** — 8 segments, or several clocks for a big project ([[Long-Term Project]]).
- **Faction** — each faction's long-term goal, ticked in downtime ([[Faction Downtime]]).

In Scrying Glass, clocks live in the right panel and can be shown on the player screen.

@@ Fortune Roll
type: rule
category: Basics
aliases: fortune

The GM's tool to leave something to chance: when the PCs aren't directly involved (how does a gang war turn out?), or when an outcome is uncertain and no other roll fits (what does that random potion do?).

Use any trait as the pool — a faction's [[Tier]], a gang's quality, a power's [[Magnitude]], a PC's action. No trait applies — 1d for luck, or 1–4 dice by the situation. **+1d** for each major advantage, **−1d** for each major disadvantage. Two sides opposed — a roll for each, then compare.

| Result | Outcome |
|---|---|
| Critical | Exceptional result; great, extreme effect |
| 6 | Good result; standard, full effect |
| 4–5 | Mixed result; limited, partial effect |
| 1–3 | Bad result; poor, little effect |

@@ Magnitude
type: rule
category: Basics
aliases: quality

A scale 0–6 to judge supernatural forces — and the quality of things. Magnitude can be the pool of a [[Fortune Roll]]; levels can be added together for combined effects (a [[Rituals|ritual]] of force 6 over range 5 costs about 11 stress).

| | Area / scale | Duration | Range | Quality | Force |
|---|---|---|---|---|---|
| 0 | a closet; 1–2 people | a few moments | within reach | poor | weak |
| 1 | a small room; a small gang (3–6) | a few minutes | a dozen paces | adequate | moderate |
| 2 | a large room; a medium gang (12) | an hour | a stone's throw | good | strong |
| 3 | several rooms; a large gang (20) | a few hours | down the road | excellent | serious |
| 4 | a small building; a huge gang (40) | a day | several blocks | superior | powerful |
| 5 | a large building; a massive gang (80) | several days | across the district | impeccable | overwhelming |
| 6 | a city block; a colossal gang (160) | a week | across the city | legendary | devastating |

**Quality examples**: 0 — a rusty knife, a shack; 1 — a fighting blade, ordinary clothes; 2 — a pistol, respectable clothes, a typical ghost; 3 — a coach, a boat, a military rifle; 4 — a luxury vehicle, a townhouse, a typical demon; 5 — a small ship, custom-tailored clothes; 6 — a mansion, a large ship, a powerful demon.

**Force examples**: 0 — a shove, a candle; 1 — a solid punch, a torch; 2 — a powerful blow, a burning brand; 3 — a crushing blow, a grenade; 4 — a charging horse, a bomb; 5 — a ship's cannon, a lightning strike; 6 — a hurricane, a tidal wave.

@@ Actions and Attributes
type: rule
category: Actions
aliases: actions, action rating, attributes, attribute rating

Twelve **actions**, each rated 0–4 dots — the dice you roll when you do it. A rating isn't just training: describe how your character does it, by the kind of person they are.

| [[Insight]] | [[Prowess]] | [[Resolve]] |
|---|---|---|
| [[Hunt]] | [[Finesse]] | [[Attune]] |
| [[Study]] | [[Prowl]] | [[Command]] |
| [[Survey]] | [[Skirmish]] | [[Consort]] |
| [[Tinker]] | [[Wreck]] | [[Sway]] |

You choose the action by saying what your character does. Actions overlap on purpose: a poorly suited action can still be tried — it may just be riskier or less effective ([[Position]], [[Effect]]).

An **attribute** rating is the number of its actions with at least one dot (0–4). Attributes are rolled to resist ([[Resistance Roll]]); the lowest one is rolled to indulge a [[Vice]].

At creation no action is above 2; later up to 3, and up to 4 with the Mastery upgrade ([[Crew Upgrades]]).

@@ Insight
type: rule
category: Actions

The attribute of [[Hunt]], [[Study]], [[Survey]] and [[Tinker]]. Resists consequences of **deception or understanding** ([[Resistance Roll]]).

@@ Prowess
type: rule
category: Actions

The attribute of [[Finesse]], [[Prowl]], [[Skirmish]] and [[Wreck]]. Resists consequences of **physical strain or injury** ([[Resistance Roll]]).

@@ Resolve
type: rule
category: Actions

The attribute of [[Attune]], [[Command]], [[Consort]] and [[Sway]]. Resists consequences of **mental strain or willpower** ([[Resistance Roll]]).

@@ Hunt
type: rule
category: Actions

**Carefully track a target.** Follow someone or find where they are; arrange an ambush; attack with precision shooting from a distance. Guns in a melee — [[Skirmish]] might be better. Attribute — [[Insight]].

@@ Study
type: rule
category: Actions

**Scrutinize details and interpret evidence.** Gather information from documents, papers and books; research an esoteric topic; read a person closely for lies or true feelings. To understand a pressing situation — [[Survey]] might be better. Attribute — [[Insight]].

@@ Survey
type: rule
category: Actions

**Observe the situation and anticipate outcomes.** Spot the signs of trouble before it happens; find opportunities and weaknesses; detect someone's intentions. To pick an ambush spot — [[Hunt]] might be better. Attribute — [[Insight]].

@@ Tinker
type: rule
category: Actions

**Fiddle with devices and mechanisms.** Build a gadget or alter an item; pick a lock or crack a safe; disable an alarm or a trap; turn the city's machinery to your advantage. To drive a vehicle — [[Finesse]] might be better. See [[Crafting]]. Attribute — [[Insight]].

@@ Finesse
type: rule
category: Actions

**Dextrous manipulation or subtle misdirection.** Pick a pocket; handle a vehicle or a mount; duel formally with graceful fighting arts. In a chaotic melee — [[Skirmish]] might be better; for a lock — [[Tinker]]. Attribute — [[Prowess]].

@@ Prowl
type: rule
category: Actions

**Traverse skillfully and quietly.** Sneak past a guard or hide in shadows; run and leap across rooftops; attack from hiding with a back-stab or a blackjack. Waylaying someone mid-battle — [[Skirmish]] might be better. Attribute — [[Prowess]].

@@ Skirmish
type: rule
category: Actions

**Entangle a target in close combat** so they can't easily escape. Brawl or wrestle; hack and slash; seize or hold a position in battle. In a formal duel — [[Finesse]] might be better. Attribute — [[Prowess]].

@@ Wreck
type: rule
category: Actions

**Unleash savage force.** Smash a door or a wall with a sledgehammer or an explosive; use chaos or sabotage to make a distraction or get past an obstacle. Overwhelming an enemy in battle — [[Skirmish]] might be better. Attribute — [[Prowess]].

@@ Attune
type: rule
category: Actions

**Open your mind to arcane power.** Communicate with a ghost; perceive beyond sight to understand a situation (though [[Survey]] might be better). Attribute — [[Resolve]].

@@ Command
type: rule
category: Actions

**Compel swift obedience.** Intimidate or threaten; lead a gang in a [[Group Action]]. Ordering people around to persuade them — [[Consort]] might be better. Attribute — [[Resolve]].

@@ Consort
type: rule
category: Actions

**Socialize with friends and contacts.** Gain access to resources, information, people or places; make a good impression; make new friends or connect with your heritage or background. Manipulating friends with social pressure — [[Sway]] might be better. Attribute — [[Resolve]].

@@ Sway
type: rule
category: Actions

**Influence with guile, charm or argument.** Lie convincingly; persuade someone to do what you want; argue a case that leaves no rebuttal. Tricking people into affection or obedience — [[Consort]] or [[Command]] might be better. Attribute — [[Resolve]].

@@ Action Roll
type: rule
category: Action roll
aliases: action, double-duty roll

When a character does something **dangerous or troublesome**, make an action roll. No danger, no roll: the GM says yes, or calls for a [[Fortune Roll]].

1. **The player states the goal** — the concrete outcome they want ("take him out, or just rough him up?").
2. **The player chooses the action** — the one their character is doing on-screen ([[Actions and Attributes]]).
3. **The GM sets the [[Position]]** — controlled, risky (default) or desperate.
4. **The GM sets the [[Effect]]** — limited, standard or great.
5. **Bonus dice**, usually up to two: +1d for [[Assist|assistance]] from a teammate (they take 1 stress); +1d for [[Push Yourself|pushing yourself]] (2 stress) **or** a [[Devil's Bargain]] — one or the other.
6. **Roll and judge** ([[Dice Pools]]); player and GM narrate together.

**Pool**: 1d per action dot, +1d assistance, +1d push or bargain.

| | Controlled — you act on your terms | Risky — you go head to head | Desperate — you overreach |
|---|---|---|---|
| Critical | You do it with increased effect | You do it with increased effect | You do it with increased effect |
| 6 | You do it | You do it | You do it |
| 4–5 | You hesitate: withdraw and try another approach, or do it with a minor consequence (minor complication, reduced effect, lesser harm, a risky position) | You do it, but there's a consequence: harm, a complication, reduced effect, a desperate position | You do it, but there's a consequence: severe harm, a serious complication, reduced effect |
| 1–3 | You falter: press on by seizing a risky opportunity, or withdraw and try another approach | Things go badly: harm, a complication, a desperate position, a lost opportunity | The worst outcome: severe harm, a serious complication, a lost opportunity |

On a 1–3 the GM decides whether the action has any effect at all — usually it simply fails. Consequences can be resisted ([[Resistance Roll]]).

**Double duty.** NPCs don't roll: one roll settles both sides. On a 6 the PC has their effect; on a 4–5 both do; on a 1–3 the NPC wins and their effect lands as a consequence. A desperate roll marks xp ([[Advancement]]).

@@ Position
type: rule
category: Action roll
aliases: controlled, risky, desperate

How dangerous an action is; the GM sets it with the [[Effect]], after the player names the action.

- **Controlled** — you act on your terms, exploiting a dominant advantage. Consequences are mild.
- **Risky** — the default: you go head to head, act under fire, take a chance.
- **Desperate** — you overreach, you're in serious trouble. Consequences are severe — and you mark xp.

Position and effect are independent: nine combinations. Alone against a gang: rushing into them — desperate / limited; at a choke-point — risky / limited; slipping past them in the open — desperate / standard; a sniper on the roof, unseen — controlled / great; suppressing fire on the whole gang — controlled / limited.

Worse position is itself a consequence ([[Consequences]]); a [[Set Up|setup]] can improve it. The opening position of a score comes from the [[Engagement Roll]].

@@ Effect
type: rule
category: Action roll
aliases: effect level, great effect, standard effect, limited effect, zero effect, potency, scale, trading position for effect

How much an action achieves. On a [[Progress Clocks|clock]] it's the number of segments ticked.

| Effect | Ticks | |
|---|---|---|
| Great | 3 | More than usual. What extra benefit do you get? |
| Standard | 2 | What we'd expect. Is it enough, or is there more to do? |
| Limited | 1 | Partial or weak. What effort remains? |

Start with your gut, then weigh three factors — an advantage raises the effect, a disadvantage lowers it:

- **Potency** — weaknesses, extra time or risk, arcane power. An infiltrator is more potent in the dark.
- **Quality / [[Tier]]** — tools, weapons, resources. Fine items are +1 quality, stacking with Tier. A Tier I crew with fine lockpicks is effectively Tier II against a lock.
- **Scale** — numbers, area, scope. More people help in battle and hinder when sneaking.

Factors can bring effect to **zero** or beyond great to **extreme**. A "+1 effect" from an ability applies after the GM's assessment; [[Push Yourself|pushing yourself]] gives +1 effect too. Reduced effect is also a consequence ([[Consequences]]).

**Trading position for effect.** Once the effect is set, the player may trade: a desperate roll with great effect instead of risky and standard, or the other way round.

@@ Devil's Bargain
type: rule
category: Action roll
aliases: bargain

The GM or any player can offer **+1d** for a price. Common bargains: collateral damage; sacrificing coin or an item; betraying a friend; angering a faction; starting or ticking a troublesome clock; +[[Heat|heat]] from evidence or witnesses; suffering harm.

The bargain happens **whatever the roll**: you make the deal, pay the price, get the die. It's always a free choice — reject it, haggle, or [[Push Yourself|push yourself]] instead (it's one or the other for that die). The GM has the final say on which bargains are valid.

@@ Push Yourself
type: rule
category: Action roll
aliases: push, pushing yourself

Take **2 stress** for each bonus, each at most once per action:

- **+1d** to the roll — any roll where extra effort helps, including downtime rolls;
- **+1 effect** level;
- **act while incapacitated** (by severe [[Harm]]).

Pushing for a die excludes a [[Devil's Bargain]] for the same die. See [[Stress]].

@@ Consequences
type: rule
category: Action roll
aliases: consequence, reduced effect, complication, serious complication, lost opportunity, worse position

What enemies, bad circumstances and rolls inflict on a PC. The GM picks one or more, following the fiction and the [[Position]]:

- **Reduced effect** — the action is less effective than hoped: a flesh wound, halfway up the wall. −1 effect after all other factors.
- **Complication** — trouble, a new threat: the room catches fire, you're disarmed, +1 [[Heat|heat]], reinforcements arrive. Or tick a [[Progress Clocks|clock]]: 1 segment for a minor complication, 2 for a standard one. A **serious** complication: you're surrounded, the door is blocked, your weapon breaks, +2 heat — 3 segments. Never negate a successful roll with a complication.
- **Lost opportunity** — the chance slips away; trying again needs a new approach.
- **Worse position** — you lose control: controlled → risky → desperate. You haven't failed yet — try again from there.
- **[[Harm]]** — a lasting injury, or death.

A PC can resist any of them: [[Resistance Roll]], [[Armor]].

@@ Harm
type: rule
category: Action roll
aliases: injury, lesser harm, moderate harm, severe harm, fatal harm

A lasting injury. Write it on the sheet with its level:

| Level | Penalty | Examples |
|---|---|---|
| 1 — lesser (2 slots) | less effect | Battered, Drained, Distracted, Scared, Confused |
| 2 — moderate (2 slots) | −1d | Exhausted, Deep Cut to Arm, Concussion, Panicked |
| 3 — severe (1 slot) | incapacitated: needs help or [[Push Yourself|pushing yourself]] | Impaled, Broken Leg, Shot in Chest, Badly Burned, Terrified |
| 4 — fatal | — | Drowned, Stabbed in the Heart |

The penalty of a row applies whenever any harm in it matters to what you're doing. If a row is full, the harm moves **up** a level; no room at level 3 — a catastrophic, permanent consequence (a lost limb, sudden death). See [[Death]].

Harm is reduced by a [[Resistance Roll]] or [[Armor]] and healed in downtime ([[Recover]]). "Drained" or "Exhausted" is a good fallback consequence when nothing else threatens.

@@ Resistance Roll
type: rule
category: Action roll
aliases: resist, resistance

When you don't like a consequence, say "No, I resist that." Resistance **always works**: the GM says whether the consequence is reduced (fatal harm → severe, 3 clock ticks → 2) or avoided entirely. Then roll the attribute the GM names:

- [[Insight]] — deception or understanding;
- [[Prowess]] — physical strain or injury;
- [[Resolve]] — mental strain or willpower.

You take **6 stress minus the highest die**; on a **critical**, clear 1 stress instead. One roll per consequence; decide before you roll — you can't roll first and then choose. Several consequences at once — choose which to resist, roll for each.

Against a dangerous enemy the GM may call for a resistance roll **before** you can act — to keep hold of your blade before you strike.

How many consequences are avoided rather than reduced sets the tone: avoided — a daring game, reduced — a gritty one. Instead of rolling, you can use [[Armor]].

@@ Armor
type: rule
category: Action roll
aliases: heavy armor, special armor

If your armor applies, **mark an armor box** to reduce or avoid a consequence instead of rolling to resist. Heavy armor gives a second box: level 2 harm → level 1 → none.

A marked box can't be used again until restored; all armor is restored when you choose your [[Load|load]] for the next score. **Special armor** is a third box used only by special abilities (Battleborn, Shadow and the like); it is restored at the start of downtime.

@@ Death
type: rule
category: Action roll

A character dies when they take level 4 fatal [[Harm]] and don't resist it — sometimes the player chooses that — or when level 3 harm must be recorded and the slot is full and the catastrophe is death.

Then make a new scoundrel: maybe promote one of the crew's gang members, or bring in someone new.

@@ Gathering Information
type: rule
category: Action roll
aliases: gather information, investigation

The GM says what characters perceive. To learn something specific, say how your character finds out. Common knowledge — the GM just answers. An obstacle in the way — an [[Action Roll]]. No obstacle but not common — a [[Fortune Roll]] for the quality of what you learn. The GM always answers honestly, with detail by effect:

- **Great** — exceptional details; follow-ups may reveal more than you hoped.
- **Standard** — good details; clarifying questions are possible.
- **Limited** — incomplete information; more digging is needed.

Each attempt takes time, and often there's one chance. Most common: [[Survey]] a situation, [[Study]] a person. Sometimes you must get into position first.

Sample questions: What's really going on here? What do they intend to do? How can I get them to trust me? What's a good point of infiltration? What's the danger here? Are they about to attack?

**Investigation.** Too big for one roll — a [[Long-Term Project]] in downtime; a full clock lets you ask several questions as if with great effect.

@@ Stress
type: rule
category: Stress and vice
aliases: stress boxes

A character's reserve: 9 boxes. Stress is spent to resist ([[Resistance Roll]]), to [[Push Yourself|push yourself]], to [[Assist|assist]] teammates, to lead a [[Group Action]], for [[Flashbacks]].

Marking the last box — [[Trauma]]. Stress is cleared by indulging a [[Vice]].

@@ Trauma
type: rule
category: Stress and vice
aliases: trauma conditions, Cold, Haunted, Obsessed, Paranoid, Reckless, Soft, Unstable, Vicious

When you mark your last [[Stress|stress]] box, take a level of trauma: circle a trauma condition. You're **taken out** of the current conflict — left for dead or otherwise dropped — and come back later, shaken: stress 0, your vice satisfied for the next downtime.

Conditions are permanent: a new quirk that earns xp when it causes trouble ([[Advancement]]).

| Condition | |
|---|---|
| Cold | Not moved by emotional appeals or social bonds |
| Haunted | Often lost in reverie, reliving past horrors, seeing things |
| Obsessed | Enthralled by one thing: an activity, a person, an ideology |
| Paranoid | Danger everywhere; you can't trust others |
| Reckless | Little regard for your own safety or interests |
| Soft | You lose your edge: sentimental, passive, gentle |
| Unstable | Volatile: sudden rage or despair, impulsive, frozen |
| Vicious | You seek chances to hurt people, even for no reason |

The **fourth** trauma ends the scoundrel's career: retire them ([[Stash and Retirement]]) or send them to prison to take the fall for the crew's [[Wanted Level|wanted level]].

@@ Vice
type: rule
category: Stress and vice
aliases: indulge vice, vice roll, overindulge, overindulgence, vice purveyor

Every scoundrel copes with stress through a vice — and a **purveyor** who provides it (name them and where they are):

- **Faith** — an unseen power, a forgotten god, ancestors;
- **Gambling** — games of chance, betting;
- **Luxury** — expensive, ostentatious opulence;
- **Obligation** — a family, a cause, an organization, a charity;
- **Pleasure** — lovers, food, drink, drugs, art, theater;
- **Stupor** — oblivion: drink, drugs, the fighting pits;
- **Weird** — strange essences, rogue spirits, bizarre rituals and taboos.

**Indulge** (a downtime activity): roll your **lowest attribute**; clear stress equal to the highest die. Or let the character be "lost in their vice" off-screen while you play someone else.

**Overindulgence**: you cleared more stress than you had — a bad call because of the vice. Choose:

- **Attract trouble** — an additional [[Entanglements|entanglement]];
- **Brag** about your exploits — +2 [[Heat|heat]];
- **Lost** — you vanish for weeks; play another character until this one returns (with harm healed);
- **Tapped** — the purveyor cuts you off; find a new one.

**Not indulging** in a downtime: take stress equal to your number of [[Trauma|traumas]] (none — the vice has no hold on you yet). Playing to your vice earns xp ([[Advancement]]).

@@ Character Creation
type: rule
category: Characters

1. **[[Playbooks|Playbook]]** — your reputation, special abilities and how you advance. Three action dots come with it.
2. **Heritage** — where your family line is from; add a detail about your family life.
3. **Background** — what you did before the crew; add a specific detail.
4. **Four action dots**: one for your heritage, one for your background, two anywhere. **No action above 2** at creation.
5. **A special ability** from your playbook; can't decide — take the first one.
6. **A close friend and a rival** from the playbook's list of NPCs.
7. **A [[Vice|vice]]** — its kind, details, the purveyor's name and place.
8. **Name, alias and look** — a few evocative words.

You have access to every item on your sheet; you choose what you carry on the job ([[Load]]). The GM will ask you questions in the first session — make up answers, or ask the table.

@@ Playbooks
type: rule
category: Characters
aliases: playbook

A playbook is the sheet of a character type: special abilities that break the rules in different ways, xp triggers, starting action dots, a list of friends and rivals, and distinctive items (fine, light, rare). Each game makes its own playbooks for its setting — a Soldier, a Medic, a Spy.

A playbook is a focus, not a class: every playbook is a scoundrel at heart, and any of them can fight. Its **xp trigger** names the methods it rewards: "address a challenge with violence or coercion", "…with knowledge or arcane power", "…with stealth or evasion".

Special abilities — see the "Special abilities" type of this compendium; [[Advancement]] adds more.

@@ Load
type: rule
category: Characters
aliases: loadout, items, encumbered

Before each score, choose your load — how much you carry. During the job, tick items as you need them, up to that number:

| Load | |
|---|---|
| 1–3 — light | faster, less conspicuous; you blend in with citizens |
| 4–5 — normal | you look like a scoundrel, ready for trouble |
| 6 — heavy | slower; you look like an operative on a mission |
| 7–9 — encumbered | overburdened; you can only move very slowly |

Some items take two slots; items in italics take none. One unit of [[Coin|coin]] carried takes a slot. Choosing load restores your [[Armor|armor]]. Abilities like Mule raise the limits.

@@ Coin
type: rule
category: Characters
aliases: money

An abstract measure of cash and assets; pocket change isn't tracked (a small bribe — a [[Fortune Roll]] on your lifestyle).

| Coin | |
|---|---|
| 1 | a full purse of silver; a week's wages |
| 2 | a fine weapon; a fine piece of art; luxury clothes |
| 4 | a satchel of silver; a month's wages |
| 6 | an exquisite jewel |
| 8 | a small safe full of valuables; a small business's good month |
| 10 | a carriage, a horse, a deed to a small property |

A character keeps at most **4 coin** on hand; the rest is spent or put in the [[Stash and Retirement|stash]]. The crew stores 4 in its lair (8 and 16 with a vault, [[Crew Upgrades]]); excess is spent before the next score or shared out.

Spend coin: +1 downtime activity; +1 result level on a downtime roll; to avoid some [[Entanglements|entanglements]]; to advance the crew's [[Tier]].

@@ Stash and Retirement
type: rule
category: Characters
aliases: stash, retirement, lifestyle

Coin put aside for the future (up to 40). Each full row of 10 is your **lifestyle** quality, 0 (street life) to 4 (luxury) — rolled, for example, to rent a nice room for the night.

Taking coin out: 2 stash → 1 coin.

When the scoundrel retires (the fourth [[Trauma|trauma]]), the stash decides their fate:

- **0–10** — poor soul: in the gutter, awash in vice and misery;
- **11–20** — meager: a tiny hovel of your own;
- **21–39** — modest: a simple home, small comforts, perhaps a tavern;
- **40** — fine: a well-appointed home, a few luxuries, a medium business.

@@ Advancement
type: rule
category: Characters
aliases: xp, experience, advance

**During the session**: a **desperate** [[Action Roll]] marks 1 xp in the attribute of that action (a desperate [[Group Action]] too).

**At the end of the session**, for each trigger: 1 xp if it happened, 2 if it happened a lot:

- your playbook's trigger ("address a challenge with…") — success or failure doesn't matter;
- you expressed your beliefs, drives, heritage or background;
- you struggled with issues from your [[Vice|vice]] or [[Trauma|traumas]] (merely indulging doesn't count — overindulging does).

End-of-session xp goes on any track — an attribute or the playbook. A full track: clear it and **advance** — an attribute track gives +1 dot to one of its actions, the playbook track gives a new special ability.

[[Train|Training]] in downtime also marks xp. Crew xp — [[Crew Advancement]].

@@ Plans
type: rule
category: The score
aliases: plan, score, detail, assault, deception, stealth, occult, social, transport, giving up

The characters plan off-screen; the players just choose the **type of plan** and supply its **detail**:

| Plan | | Detail |
|---|---|---|
| Assault | do violence to a target | the point of attack |
| Deception | lure, trick or manipulate | the method of deception |
| Stealth | trespass unseen | the point of infiltration |
| Occult | engage a supernatural power | the arcane method |
| Social | negotiate, bargain or persuade | the social connection |
| Transport | carry cargo or people through danger | the route and means |

Don't know the detail — [[Gathering Information|gather information]] first. Then each player picks their [[Load|load]], the GM calls the [[Engagement Roll]] and cuts to the action. No plan is perfect; preparations come later as [[Flashbacks]]. Two-pronged plans — [[Linked Plans]].

**Giving up** on a score: go to [[Downtime|downtime]] — usually with no [[Payoff|payoff]], but with [[Heat|heat]] and [[Entanglements|entanglements]] as usual.

@@ Engagement Roll
type: rule
category: The score
aliases: engagement

A [[Fortune Roll]] that sets the opening situation of a score instead of the GM's guess. **1d** for luck, then **+1d / −1d** for each major advantage / disadvantage:

- bold or daring (+1d) — overly complex or contingent (−1d);
- the detail hits the target's weakness (+1d) — the target is strongest against this approach (−1d);
- friends or contacts help (+1d) — enemies or rivals interfere (−1d);
- anything else: a lower-[[Tier]] target (+1d), a higher-Tier one (−1d), the situation in the district.

| Result | |
|---|---|
| Critical | You're past the first obstacle, in a [[Position|controlled]] position for what's next |
| 6 | Controlled position as the action starts |
| 4–5 | Risky position |
| 1–3 | Desperate position |

The roll covers the approach: cut straight to the first serious obstacle — on the roof at the attic window, in the melee in the front room. Desperate is the worst it can get. Paint a bad roll as the enemy being dangerous, not the PCs being incompetent. After the first actions, position is set as usual.

@@ Flashbacks
type: rule
category: The score
aliases: flashback

During a score, you can play an action in the **past** that affects the present. The GM sets the stress cost:

- **0** — an ordinary action with easy opportunity (arranging with a friend to show up as a surprise ally);
- **1** — complex or unlikely (stashing your pistols near the card table before the pat-down);
- **2 or more** — elaborate, with special opportunities or contingencies.

Then it's an ordinary action: an [[Action Roll]] if there's danger, a [[Fortune Roll]] to see how well, or no roll at all. A flashback to a downtime activity costs 1 coin or 1 rep instead of stress.

A flashback isn't time travel: it can't undo what was just established. The inspector is here, questioning you — you can't have killed her last night; you could have tipped her off on purpose. The best moment for a flashback is right after a bad [[Engagement Roll]].

@@ Linked Plans
type: rule
category: The score

"You make a diversion at the tavern, we break into their lair" — two ways:

1. The diversion is a [[Set Up|setup]] within the plan. Success improves teammates' position or effect (it can offset a bad [[Engagement Roll]]); failure can give the engagement roll −1d. The one who did it can rejoin the team later.
2. The diversion is its own score — plan, engagement, [[Downtime|downtime]] — whose outcome opens the next one. Use this when the first part must happen for the second to exist at all.

@@ Teamwork
type: rule
category: The score
aliases: teamwork maneuvers

Four maneuvers when the characters work together: [[Assist]], [[Group Action]], [[Protect]], [[Set Up]]. They're options — anyone can still act solo. A character who can't communicate with the team can't use or benefit from them.

@@ Assist
type: rule
category: The score
aliases: assistance, help

Say how you help, take **1 stress**, and the teammate gets **+1d**. You may share the consequences of the roll. Only one character can assist a given roll — the rest can [[Set Up|set up]] instead. You can assist a [[Group Action]] only if you aren't in it; you pick who gets the die.

@@ Group Action
type: rule
category: The score
aliases: lead a group action

You coordinate several members of the team: everyone involved rolls the **same action**, and the single best result counts for all of them. The leader takes **1 stress for each PC whose best result was 1–3**. "We all sneak in" — everyone rolls [[Prowl]]. Those who don't roll don't get the result.

Leading is about leadership, not skill. Leading cohorts: roll [[Command]] to direct them, or the fitting action to fight alongside them; the cohort rolls its quality ([[Cohorts]]).

@@ Protect
type: rule
category: The score
aliases: protect a teammate

Step in to face a consequence a teammate would suffer: you take it instead, and may resist it as usual ([[Resistance Roll]]). "I dive in front of the bullet."

@@ Set Up
type: rule
category: The score
aliases: setup, setup action

An action with an indirect effect on an obstacle: if it works, any teammate who **follows through** gets **+1 effect** or **improved position** (you choose, by the fiction). Distract the guard with [[Sway]] — the teammate [[Prowl|prowling]] past him has a better position.

A good way to help with an action you're bad at; several follow-ups can use one setup. Even from zero effect, a setup's +1 gives limited effect.

@@ Downtime
type: rule
category: Downtime
aliases: downtime activities, downtime roll

After a score: [[Payoff]], [[Heat]], [[Entanglements]], then the activities. Each PC has **two** activities (one when the crew is at war — [[Faction Status]]). Extra activities cost **1 coin or 1 rep** each. The same activity can be chosen twice. Ordinary actions — going places, talking, rolling, gathering information — aren't limited.

- [[Acquire Asset]]
- [[Long-Term Project]]
- [[Recover]]
- [[Reduce Heat]]
- [[Train]]
- Indulge [[Vice]]

**+1d** when a friend or contact helps. After the roll, each **coin** spent raises the result level by one (1–3 → 4–5 → 6 → critical).

Factions act in downtime too: [[Faction Downtime]].

@@ Payoff
type: rule
category: Downtime
aliases: rep, reputation

A successful score earns **rep** and **coin**.

**Rep**: 2, +1 per [[Tier]] the target is above the crew, −1 per Tier below (min 0). A completely quiet operation — no rep. Rep goes on the crew sheet ([[Rep and Turf]]).

**Coin**: 2 — a minor job, a few full purses; 4 — a small job, a strongbox; 6 — a standard score; 8 — a big score; 10+ — a major score.

**Tithe**: a local boss may expect crew Tier + 1 coin from each score. Not paying starts a clock of their patience; each time it fills, −1 status with them ([[Faction Status]]).

GM: don't cheat the players at payday — the crew has enough trouble already.

@@ Heat
type: rule
category: Downtime

Witnesses and evidence. After a score or a conflict, the crew takes heat:

- **0** — smooth and quiet;
- **2** — contained;
- **4** — loud and chaotic;
- **6** — wild.

**+1** for a high-profile or well-connected target, **+1** on hostile turf, **+1** while at war, **+2** if killing was involved (whoever did it — bodies draw attention).

At **9 heat** the crew gains a [[Wanted Level|wanted level]] and clears heat (the excess rolls over: 7 + 4 → wanted +1, heat 2). Heat also chooses the column of [[Entanglements]]; it's reduced in downtime ([[Reduce Heat]]).

@@ Wanted Level
type: rule
category: Downtime
aliases: wanted, incarceration, incarceration roll, prison

The higher it is (0–4), the stronger the force the law sends against the crew, and the worse the [[Entanglements|entanglements]].

It's reduced only by **incarceration**: when a crew member, friend, contact — or a framed enemy — is convicted for the crew's crimes, wanted level −1 and heat cleared. The sentence by wanted level: 4 — life or execution; 3 — a year or two; 2 — several months; 1 — a month or two; 0 — a few weeks, or a beating (level 3 [[Harm|harm]], no resistance).

**Incarceration roll** when the time is served, on the crew's [[Tier]]:

| | |
|---|---|
| Critical | You make a name inside: +3 rep, 1 prison claim, +1 status with a faction you helped |
| 6 | You do your time well: 1 prison claim, +1 status with a faction you helped |
| 4–5 | You keep your head down; no incident |
| 1–3 | Horrific: a level of [[Trauma|trauma]] |

See [[Prison Claims]].

@@ Prison Claims
type: rule
category: Downtime

Claims won inside ([[Wanted Level]]):

- **Allied claim** — an ally's faction grants a boon: a claim from another crew type (not turf).
- **Cell block control** — a block under your control, guards and all; no trauma from incarceration.
- **Guard payoff** — guards on your payroll; +1d to the [[Tier]] roll when a member is incarcerated.
- **Hardcase** — your tough reputation; advancing Tier costs 2 coin less.
- **Parole influence** — sentences are as if wanted level were 1 lower.
- **Smuggling** — +2 load in prison (taken twice — 4); coin can stand in for load for bribes.

@@ Entanglements
type: rule
category: Downtime
aliases: entanglement, Arrest, Cooperation, Demonic Notice, Flipped, Gang Trouble, Interrogation, Questioning, Reprisals, Rivals, Show of Force, Unquiet Dead, The Usual Suspects

The crew's past comes calling. After [[Payoff]] and [[Heat]], roll dice equal to the [[Wanted Level|wanted level]] (0 — 2d, the lowest) and look in the column of the current heat:

| Roll | Heat 0–3 | Heat 4–5 | Heat 6+ |
|---|---|---|---|
| 1–3 | Gang Trouble or The Usual Suspects | Gang Trouble or Questioning | Flipped or Interrogation |
| 4–5 | Rivals or Unquiet Dead | Reprisals or Unquiet Dead | Demonic Notice or Show of Force |
| 6 | Cooperation | Show of Force | Arrest |

An entanglement has already happened when it's described — the crew deals with it from there. Resolve it quickly by the listed ways, or play it out in full.

- **Arrest** — a detail at least the scale of the wanted level comes for you. Pay wanted level + 3 coin, hand someone over (clears heat), or try to evade.
- **Cooperation** — a +3 faction asks a favor. Do it, forfeit 1 rep per its Tier, or −1 status. No +3 faction — no entanglement.
- **Demonic notice** — a demon brings a dark offer. Accept, hide until it loses interest (−3 rep), or deal with it another way.
- **Flipped** — a rival turns one of your contacts, patrons, clients or customers to another faction.
- **Gang trouble** — one of your [[Cohorts|cohorts]] causes trouble by its flaws. Lose face (−Tier + 1 rep), make an example of a member, or face reprisals from the wronged party.
- **Interrogation** — the law picks up a PC. Pay 3 coin, or take a beating (level 2 harm) and talk (+3 heat); each can be resisted.
- **Questioning** — the law grabs an NPC of the crew or a contact. A [[Fortune Roll]] (2d for an ordinary person, 3–4d for a tough, 0–1d for the soft): 1–3 — +2 heat, 4–5 — +1 heat; or pay 2 coin.
- **Reprisals** — an enemy faction moves against you or yours. Pay 1 rep and 1 coin per its Tier, let them, or fight back.
- **Rivals** — a neutral faction throws its weight around. Forfeit 1 rep or 1 coin per its Tier, or stand up and lose 1 status.
- **Show of force** — a faction with negative status goes after your holdings. Give them a claim or go to war (−3 status); no claims — lose 1 [[Hold|hold]].
- **Unquiet dead** — a rogue spirit is drawn to you. Hire an occultist ([[Acquire Asset]]; their quality is a fortune roll) or deal with it yourself.
- **The usual suspects** — the law grabs someone on the periphery (a player picks a friend or purveyor). Fortune roll: 1–3 — +2 heat, 4–5 — they take level 2 harm; or pay 1 coin.

Extra entanglements come from overindulging a [[Vice]].

@@ Acquire Asset
type: rule
category: Downtime
aliases: asset

Temporary use — usually one score, or "standby" for a while — of a special item or a set of common items, a cohort, a vehicle or a service (transport, storage, a lawyer). Roll the crew's [[Tier]]; the result is the asset's quality:

| Result | Quality |
|---|---|
| Critical | Tier + 2 |
| 6 | Tier + 1 |
| 4–5 | Tier |
| 1–3 | Tier − 1 |

Beyond critical — 2 coin per +1. The GM may set a minimum quality. Acquiring the same asset again gives +1d (rent it indefinitely). Alchemicals, poisons, bombs and dangerous gadgets bought rather than made: +2 [[Heat|heat]]. Permanent assets — [[Crew Upgrades]] or a [[Long-Term Project]].

@@ Long-Term Project
type: rule
category: Downtime
aliases: project

Say how your character works on it and roll an action; mark the project's [[Progress Clocks|clock]]: 1–3 — 1 segment, 4–5 — 2, 6 — 3, critical — 5.

Research a ritual, investigate a mystery, earn someone's trust, court a contact, change your vice — anything unusual. The GM names the clock(s) — usually 8 segments — and a way to make progress. Sometimes the means to pursue a project is a project of its own.

@@ Recover
type: rule
category: Downtime
aliases: healing, healing clock, recovery

Get treatment: a healer (a PC with a healing ability, a contact, or one hired with [[Acquire Asset]] — they treat the whole crew) rolls — their action or NPC quality — and you tick your 4-segment healing clock: 1–3 — 1, 4–5 — 2, 6 — 3, critical — 5.

A full clock reduces **every** [[Harm|harm]] by one level; extra segments roll over. Heal yourself — take 2 stress; tough it out untreated — 1 stress and 0d. The recovering character spends the activity, not the healer. New harm clears the clock.

@@ Reduce Heat
type: rule
category: Downtime

Say how you lie low or cover tracks — make a friendly officer lose some reports, scare locals out of snitching — and roll the action. Reduce [[Heat|heat]]: 1–3 — 1, 4–5 — 2, 6 — 3, critical — 5.

@@ Train
type: rule
category: Downtime
aliases: training

Mark 1 xp on an attribute or the playbook track (+1 more with the matching Training upgrade, [[Crew Upgrades]]). Each track can be trained once per downtime. See [[Advancement]].

@@ Faction Downtime
type: rule
category: Downtime
aliases: faction clocks, NPC downtime

While the PCs rest, the GM advances the clocks of the factions they care about and chooses a maneuver or two: seize a claim or increase [[Hold|hold]]; make an enemy vulnerable or reduce its hold; gather information on the PCs (maybe opposed by a PC roll); reach a short-term goal; acquire an asset; call in a favor; apply political pressure or threats.

Unsure how far a clock moves — a [[Fortune Roll]] on the faction's [[Tier]]: 1–3 — 1 segment, 4–5 — 2, 6 — 3, critical — 5. A faction ignored for a while catches up with several phases at once. Let the players hear of it through friends, contacts and purveyors — rumors become scores.

@@ Rituals
type: rule
category: Downtime
aliases: ritual sorcery

Only with the **Ritual** special ability is ritual sorcery safe to attempt; it begins with one known ritual.

- **Source** — a new ritual needs a source: loot from a score or a [[Long-Term Project]].
- **Learning** — a long-term project, usually 8 segments.
- **Questions**: the GM asks "What does it do, and how is it weird?"; the player asks "What must I do, and what's the price?" (at least one downtime activity, stress by [[Magnitude]], maybe an [[Attune]] roll, a sacrifice or a dire clock); the GM asks "What new belief or fear does it instill in you?"
- **Performing** — take the stress (less for a slow ritual, by the duration scale); dangerous — an action roll for consequences; uncertain — a [[Fortune Roll]], and coin raises its result 1-for-1. A ritual can be "primed" and unleashed later.

Abyssal forces are not playthings: when it gets out of hand, ask the questions again with new weirdness and costs.

@@ Crafting
type: rule
category: Downtime
aliases: inventing, invent, crafting roll, drawbacks, modify an item

In downtime a PC can [[Tinker]] to make alchemicals, items, spark-craft gadgets or arcane implements.

**Inventing** a new formula or design — a [[Study]] [[Long-Term Project]], usually 8 segments, with questions: the GM asks what it is and what it does; the player asks its minimum quality (by [[Magnitude]]); the GM asks what rare or adverse aspect has kept it obscure; the player asks its drawbacks. Abilities Alchemist, Artificer and Strange Methods give one formula for free. Common alchemicals and ordinary items need no formula.

**Crafting roll** — a downtime activity, 1d per Tinker dot; quality is the crew's [[Tier]] (Workshop +1): 1–3 — Tier − 1, 4–5 — Tier, 6 — Tier + 1, critical — Tier + 2; +1 quality per coin, even beyond. The GM sets a minimum quality.

**Modifying** an item: a simple, useful change — Tier + 1 quality; a significant one — Tier + 2; an arcane, spark-craft or alchemical one — Tier + 3.

**Drawbacks** (GM's choice): **complex** — several stages, a roll each; **conspicuous** — +1 heat if used on a score; **consumable** — limited uses (every alchemical); **rare** — needs a rare material; **unreliable** — a fortune roll on its quality each use; **volatile** — a side effect, a consequence that can be resisted.

@@ Crew Creation
type: rule
category: The crew
aliases: crew, crew type, lair, hunting grounds, crew reputation

1. **Crew type** — what the crew does and how the underworld sees it (assassins, smugglers, a cult…; each game makes 3–6). It sets the special abilities and how the crew earns xp. Start: **Tier 0, strong hold, 0 rep, 2 coin** ([[Tier]], [[Hold]]).
2. **Reputation** — Ambitious, Brutal, Daring, Honorable, Professional, Savvy, Subtle, Strange (or your own) — and the **lair**, a modest or abandoned place.
3. **Hunting grounds** — three or four blocks where you usually work, claimed by a stronger faction: pay 1 coin; pay 2 coin for +1 status; or pay nothing and take −1 status. Pick a preferred operation type there: on such jobs, +1d to gather information and a free extra downtime activity for that operation. Turf expands the grounds.
4. **A special ability** — one everyone is excited about; can't decide — the first one.
5. **Upgrades** — two come with the type, choose two more ([[Crew Upgrades]], [[Cohorts]]). One faction helped: +1 status (or 1 coin for +2). One was harmed: −2 status (or 1 coin for −1).
6. **A favorite contact**: one faction friendly with them — +1 status, one unfriendly — −1 (or +2 and −2).

@@ Tier
type: rule
category: The crew
aliases: crew tier, gang scale

A faction's wealth, influence and scale, 0 to VI; your crew starts at 0. Tier is the pool to [[Acquire Asset|acquire assets]] and for fortune rolls on the crew's power; it sets the **quality** of your items and the quality and **scale** of your gangs:

| Tier | Gang |
|---|---|
| V | massive (80 people) |
| IV | huge (40) |
| III | large (20) |
| II | medium (12) |
| I | small (3–6) |
| 0 | 1 or 2 people |

To advance — [[Rep and Turf]]. A crew that advances also earns profits ([[Crew Advancement]]).

@@ Hold
type: rule
category: The crew
aliases: strong hold, weak hold

How well a faction keeps its place on the ladder: **weak** or **strong**. A crew starts strong at Tier 0.

A successful operation against a vulnerable faction's hold drops it one level; weak hold that drops costs a [[Tier]] and stays weak. A faction at war temporarily loses 1 hold ([[Faction Status]]). Your crew follows the same rules; at Tier 0 with weak hold, losing hold puts your lair under threat.

@@ Rep and Turf
type: rule
category: The crew
aliases: rep tracker, turf, development

Rep is clout and renown ([[Payoff]]). The rep tracker holds **12**. When it fills:

- weak [[Hold|hold]] becomes strong; reset rep to 0;
- strong hold — pay **new Tier × 8 coin** to raise the [[Tier]]; reset rep, hold becomes weak. Until you pay, no new rep (12 is the max).

**Turf** — territory you seize and hold. Each turf cuts the rep needed by 1 (2 turf — 10 rep), at most 6; turf marks stay when rep resets. Turf also widens your hunting grounds. Some [[Claims|claims]] count as turf.

@@ Faction Status
type: rule
category: The crew
aliases: status, war, at war

How much each faction likes or hates the crew, −3 to +3 (0 to start):

| Status | |
|---|---|
| +3 Allies | they help even against their interest, and expect the same |
| +2 Friendly | they help if it doesn't cause them serious problems |
| +1 Helpful | they help if it costs them nothing |
| 0 Neutral | |
| −1 Interfering | they make trouble for you when it costs them nothing |
| −2 Hostile | they hurt you if it causes them no serious problems; they take precautions |
| −3 War | they go out of their way to hurt you |

An operation gives −1 or −2 with factions it hurts and maybe +1 with those it helps (a completely quiet one changes nothing); favors and refusals move status too.

**War** with anyone: +1 [[Heat|heat]] from scores, −1 [[Hold|hold]] for the duration (weak hold — −1 [[Tier]] until it ends), and **one** downtime activity per PC instead of two. It ends when the enemy is eliminated or by a negotiated new status.

@@ Claims
type: rule
category: The crew
aliases: claim, claim map, seize a claim

Each crew sheet has a map of claims, paths leading out from the lair in the middle. Usually they're seized in order; a claim off the path is especially hard and may need investigation first.

**Seizing**: name the claim; the GM places it and names the faction holding it. Execute it like any score; success takes the claim (usually −2 status with its owner, maybe +1 with its enemies). The benefit lasts while you hold it. A lost claim loses its benefit; a lost lair suspends all claims until a score restores it.

Sample claims:

- **Turf** — one less rep to advance (max 6, [[Rep and Turf]]).
- **City Records** — +1d to the [[Engagement Roll]] for stealth plans.
- **Cover Identities** — +1d engagement for deception and social plans.
- **Cover Operation** — −2 heat per score.
- **Envoy** / **Fixer** — +2 coin payoff with high-class / lower-class clients.
- **Infirmary** — +1d to healing rolls; beds for long convalescence.
- **Informants** — +1d to gather information for a score.
- **Protection Racket**, **Vice Den**, **Fighting Pits**, **Side Business** — in downtime roll Tier dice: coin = the highest die − heat.
- **Training Rooms** — cohorts of one type get +1 scale.
- **Victim Trophies** — +1 rep per score.
- **Street Fence** — +2 coin from lower-class targets; **Loyal Fence** — +2 coin from burglary or robbery.
- **Terrorized Citizens** — +2 coin from battle or extortion.
- **Warehouses** — +1d to acquire assets.
- **Ancient Altar** — +1d engagement for occult plans; **Ancient Tower** — +1d to [[Consort]] with arcane entities on-site; **Offertory** — +2 coin from occult operations.
- **Local Graft** — +2 coin from a show of force or socializing.
- **Lookouts** — +1d to [[Hunt]] or [[Survey]] on your turf.
- **Luxury Venue**, **Tavern** — +1d to [[Consort]] and [[Sway]] on-site.
- **Surplus Cache** — +2 coin from product sale or supply; **Covert Drop** — from espionage or sabotage.
- **Interrogation Chamber** — +1d to [[Command]] and [[Sway]] on-site.
- **Secret Pathways** — +1d engagement for stealth plans.

@@ Crew Upgrades
type: rule
category: The crew
aliases: upgrade, upgrades

Lasting assets of the crew; a crew type comes with two and has its own list besides the general ones:

- **Boat house** / **Carriage house** — a boat and dock / a carriage, animals and stable; a second upgrade adds armor and capacity or speed.
- **Cohort** — a gang or an expert (two upgrades, [[Cohorts]]).
- **Hidden lair** — a secret, disguised location; if found, two downtime activities and Tier coin to move it.
- **Mastery** — actions can advance to 4 (otherwise 3); four upgrade boxes.
- **Quality** — +1 quality for one kind of item: documents, gear, arcane implements, subterfuge supplies, tools, weapons.
- **Quarters** — living quarters; without them PCs sleep elsewhere, vulnerable.
- **Secure lair** — locks, alarms, traps; a second upgrade — arcane wards against spirits.
- **Training** (Insight, Prowess, Resolve, Playbook) — [[Train|training]] that track marks 2 xp.
- **Vault** — coin storage 8, a second upgrade — 16; a holding cell.
- **Workshop** — tools, alchemy, a small library: long-term projects without leaving the lair; +1 quality to [[Crafting|crafting]].

Crew-type examples: **Rigging** — 2 free load in two item categories; **Prison Contacts** — Tier +1 in prison; **Elite** cohorts of a type — +1d to their quality rolls; **Hardened** — +1 trauma box per PC (three upgrades); **Composed** — +1 stress box per PC (three upgrades); **Underground Maps and Passkeys** — easy passage through tunnels and basements; **Camouflage** — vehicles are perfectly concealed at rest.

@@ Cohorts
type: rule
category: The crew
aliases: cohort, gang, gangs, expert, edges, flaws, Adepts, Rooks, Rovers, Skulks, Thugs

A gang or an expert who works for the crew; recruiting one costs two [[Crew Upgrades|upgrades]].

**Gang** — a type: **Adepts** (scholars, tinkerers, occultists), **Rooks** (con artists, spies, socialites), **Rovers** (sailors, drivers, scavengers), **Skulks** (scouts, infiltrators, thieves), **Thugs** (killers, brawlers). Quality and scale equal the crew's [[Tier]] and grow with it.

**Expert** — a specific expertise (a doctor, an investigator, an occultist…). Quality Tier + 1, scale 0.

**Edges and flaws**, one or two of each, the same number. Edges: **Fearsome**, **Independent** (acts well on its own), **Loyal** (can't be bribed or turned), **Tenacious**. Flaws: **Principled**, **Savage**, **Unreliable** (not always available), **Wild** (drunken, loud-mouthed).

Two more upgrades add a second type; outside its types a cohort has quality 0.

**Using**: send them — roll their quality; or lead a [[Group Action]]: [[Command]] to direct them, the fitting action to join in. Opposition quality sets position and effect.

**Harm**: 1 — weakened (reduced effect); 2 — impaired (−1d); 3 — broken (can't act until recovered); 4 — dead. In downtime each cohort heals one level (two if a PC spends an activity on them). A destroyed cohort: Tier + 2 coin and two downtime activities to replace.

@@ Crew Advancement
type: rule
category: The crew
aliases: crew xp

At the end of the session, 1 crew xp per trigger (2 if it happened a lot or in a major way):

- the crew type's trigger (e.g. a successful smuggling operation);
- contending with challenges above your station — higher Tiers, more dangerous opposition;
- bolstering the crew's reputation, or developing a new one;
- expressing the crew's goals, drives, inner conflict or essential nature.

A full tracker: clear it and take a new crew special ability or two upgrade boxes ([[Crew Upgrades]]) — and say where it came from.

**Profits**: each time the crew advances, each PC gets stash equal to [[Tier]] + 2 ([[Stash and Retirement]]).

@@ Battleborn
type: fability
category: Character

Expend your special [[Armor|armor]] to reduce harm from an attack in combat by one level, or to [[Push Yourself|push yourself]] during a fight — a push's benefit without the 2 stress. Special armor is restored at the start of downtime.

@@ Bodyguard
type: fability
category: Character

When you [[Protect|protect]] a teammate, +1d to your resistance roll. When you gather information to anticipate threats in the current situation, +1 effect.

@@ Arcane Fighter
type: fability
category: Character

You can imbue your hands, melee weapons or tools with spirit energy: potency in combat against the supernatural. How does it look when it manifests?

@@ Leader
type: fability
category: Character

When you [[Command]] a cohort in combat, they keep fighting when they'd otherwise break (not taken out by level 3 harm, only by fatal harm or your order), and gain +1 effect and 1 armor.

@@ Mule
type: fability
category: Character

Higher [[Load|load]] limits: light 5, normal 7, heavy 8.

@@ Not to Be Trifled With
type: fability
category: Character

[[Push Yourself|Push yourself]] to perform a feat of physical force that verges on the superhuman (break a metal weapon bare-handed, tackle a galloping horse), or to engage a small gang (up to six) on equal footing in close combat — no reduced effect for their scale. You still get a normal benefit of pushing.

@@ Savage
type: fability
category: Character

Your violence is especially frightening (the GM judges how each NPC reacts: flight, awe, violence). +1d to [[Command]] a frightened target.

@@ Vigorous
type: fability
category: Character

You recover faster: one segment of your healing clock is permanently filled (a 3-clock), and +1d to healing treatment rolls ([[Recover]]).

@@ Sharpshooter
type: fability
category: Character

[[Push Yourself|Push yourself]] to make a ranged attack at extreme distance, or to keep up a barrage of rapid fire that suppresses a small gang (reluctant to move or attack — usually a fortune roll to manage it). You still get a normal benefit of pushing.

@@ Focused
type: fability
category: Character

Expend your special [[Armor|armor]] to resist a consequence of surprise or mental harm (fear, confusion, losing track of someone) — avoiding it completely — or to push yourself for ranged combat or tracking without the stress.

@@ Scout
type: fability
category: Character

+1 effect to gather information to find a target (a person, a place, an ambush spot, an item). +1d to avoid detection when hiding in a prepared position or using camouflage.

@@ Tough as Nails
type: fability
category: Character

Penalties from [[Harm|harm]] are one level less severe: level 3 is −1d instead of incapacitation, level 2 is less effect, level 1 has no penalty. Fatal is still fatal; harm is recorded and healed at its real level.

@@ Vengeful
type: fability
category: Character

An extra xp trigger: you got payback against someone who harmed you or someone you care about. If the crew helped, mark crew xp too.

@@ Alchemist
type: fability
category: Character

+1 result level when you invent or craft a creation with alchemical features ([[Crafting]]). You begin with one special formula.

@@ Analyst
type: fability
category: Character

In downtime, two extra ticks to spread among [[Long-Term Project|long-term projects]] of investigation or learning a formula or design.

@@ Artificer
type: fability
category: Character

+1 result level when you invent or craft a creation with spark-craft features ([[Crafting]]). You begin with one special design.

@@ Fortitude
type: fability
category: Character

Expend your special [[Armor|armor]] to resist a consequence of fatigue, weakness or chemical effects — avoiding it completely — or to push yourself for technical work or handling alchemicals without the stress.

@@ Supernatural Ward
type: fability
category: Character

When you [[Wreck]] an area with arcane substances, ruining it for other use, it becomes anathema or enticing to the supernatural (your choice) for several days: spirits avoid it, or seek it and linger, suffering torment if forced in or out. A small room. Powerful entities may roll their quality or [[Magnitude|magnitude]] to resist.

@@ Saboteur
type: fability
category: Character

When you [[Wreck]], your work is much quieter than it should be and the damage is well hidden from casual inspection — drilling, acid, even a muffled explosive.

@@ Infiltrator
type: fability
category: Character

You're not affected by quality or [[Tier]] when you bypass security measures: cracking a safe, picking a lock, sneaking past elite guards never has reduced effect for the opposition's superior quality.

@@ Ambush
type: fability
category: Character

+1d when you attack from hiding or spring a trap. Preparation can come in a [[Flashbacks|flashback]].

@@ Daredevil
type: fability
category: Character

On a desperate action roll, +1d if you also take −1d to resistance rolls against that action's consequences.

@@ The Devil's Footsteps
type: fability
category: Character

[[Push Yourself|Push yourself]] for a feat of athletics that verges on the superhuman (a sheer climb, a three-story fall, a shocking leap), or to maneuver so your enemies mistakenly attack each other for a moment (maybe a fortune roll for how badly). You still get a normal benefit of pushing.

@@ Expertise
type: fability
category: Character

Choose an action: when you lead a [[Group Action|group action]] with it, you take at most 1 stress, however many failed.

@@ Reflexes
type: fability
category: Character

When there's a question of who acts first, it's you — you can interrupt anyone trying to beat you to it. This rarely removes a roll, but may improve position or effect.

@@ Shadow
type: fability
category: Character

Expend your special [[Armor|armor]] to resist a consequence of detection or security measures — avoiding it completely — or to push yourself for athletics or stealth without the stress.

@@ Rook's Gambit
type: fability
category: Character

Take 2 stress to roll your best action rating while performing a different action; say how you adapt your skill.

@@ Like Looking into a Mirror
type: fability
category: Character

You can always tell when someone is lying to you — every lie, even the kind ones.

@@ A Little Something on the Side
type: fability
category: Character

At the end of each downtime, +2 stash (after all activities, so it can't pay for extra ones this time).

@@ Mesmerism
type: fability
category: Character

When you [[Sway]] someone, you can make them forget it happened until they next interact with you; then they remember everything clearly, the strange effect included.

@@ Subterfuge
type: fability
category: Character

Expend your special [[Armor|armor]] to resist a consequence of suspicion or persuasion — avoiding it completely — or to push yourself for subterfuge without the stress.

@@ Trust in Me
type: fability
category: Character

+1d against a target with whom you have an intimate relationship — for any action. What "intimate" means is up to the group.

@@ Foresight
type: fability
category: Character

Twice per score, [[Assist|assist]] a teammate without paying stress — describe how you prepared for this.

@@ Calculating
type: fability
category: Character

In downtime, give yourself or another crew member +1 downtime activity. Forgot? Use it in a flashback during the score.

@@ Connected
type: fability
category: Character

In downtime, +1 result level when you [[Acquire Asset|acquire an asset]] or [[Reduce Heat|reduce heat]].

@@ Mastermind
type: fability
category: Character

Expend your special [[Armor|armor]] to [[Protect|protect]] a teammate — negating or reducing their consequence, even if you're not there (say how you prepared) — or to push yourself to gather information or work on a long-term project without the stress.

@@ Weaving the Web
type: fability
category: Character

+1d to [[Consort]] when you gather information on a target for a score, and +1d to that operation's [[Engagement Roll|engagement roll]].

@@ Arcane Mind
type: fability
category: Character

You're always aware of supernatural entities in your presence; +1d to gather information about the supernatural by any means.

@@ Iron Will
type: fability
category: Character

You're immune to the terror some supernatural entities inflict on sight, and +1d to resistance rolls with [[Resolve]].

@@ Ritual
type: fability
category: Character

You know how to perform ritual sorcery: [[Study]] an occult ritual (or create one) to summon a supernatural effect or being. You begin with one ritual learned. Without this ability, rituals leave you utterly vulnerable to the powers you call. See [[Rituals]].

@@ Strange Methods
type: fability
category: Character

+1 result level when you invent or craft a creation with arcane features ([[Crafting]]). You begin with one arcane design.

@@ Warded
type: fability
category: Character

Expend your special [[Armor|armor]] to resist a supernatural consequence (negating or reducing it), or to push yourself when you contend with or employ arcane forces without the stress.

@@ Deadly
type: fability
category: Crew

Each PC may add +1 to [[Hunt]], [[Prowl]] or [[Skirmish]] (max 3; at creation this beats the usual limit of 2).

@@ Death Veil
type: fability
category: Crew

No extra [[Heat|heat]] when killing is involved in a score.

@@ No Traces
type: fability
category: Crew

A quiet operation, or one that looks like an accident, earns half the target's rep value (rounded up) instead of zero. Ending downtime with zero heat — +1 rep.

@@ Patron
type: fability
category: Crew

Advancing [[Tier]] costs half the coin. Who is your patron, and why do they help you?

@@ Predators
type: fability
category: Crew

+1d to the [[Engagement Roll|engagement roll]] when you use a stealth or deception plan to commit murder (when murder is the goal).

@@ Fiends
type: fability
category: Crew

Fear is as good as respect: each [[Wanted Level|wanted level]] counts as turf. The rep cost to advance never drops below 6.

@@ Forged in the Fire
type: fability
category: Crew

Toughened by cruel experience: PCs (not cohorts) get +1d to [[Resistance Roll|resistance rolls]].

@@ War Dogs
type: fability
category: Crew

At war (−3 status), the crew doesn't lose hold, and PCs still get two downtime activities ([[Faction Status]]).

@@ Anointed
type: fability
category: Crew

+1d to resistance rolls against supernatural threats, and +1d to healing rolls for supernatural harm.

@@ Accord
type: fability
category: Crew

Up to three +3 faction statuses count as turf; if a status drops, that turf is lost until it's +3 again. The rep cost to advance never drops below 6.

@@ High Society
type: fability
category: Crew

−1 heat in downtime, and +1d to gather information about the elite.

@@ Pack Rats
type: fability
category: Crew

Your lair is a jumble of stolen things: +1d to [[Acquire Asset|acquire an asset]].

@@ Second Story
type: fability
category: Crew

+1d to the [[Engagement Roll|engagement roll]] for a clandestine infiltration.

@@ Synchronized
type: fability
category: Crew

In a [[Group Action|group action]], several 6s on different players' rolls count as a critical.

@@ All Hands
type: fability
category: Crew

In downtime, one of your cohorts can perform an activity for the crew: acquire an asset, reduce heat or work on a long-term project.

@@ Just Passing Through
type: fability
category: Crew

−1 heat in downtime. With heat 4 or less, +1d to deceive people when you pass yourselves off as ordinary citizens.
