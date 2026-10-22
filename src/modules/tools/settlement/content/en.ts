// Settlement generator content in English (written for the app).
import type { SettlementContent } from '../types';

const pick = <T>(list: T[], r: () => number): T => list[Math.floor(r() * list.length)]!;
const PREFIXES = ['Oak', 'Ash', 'Stone', 'Raven', 'Wolf', 'Black', 'White', 'Red', 'Mill', 'Thorn', 'Elder', 'Frost', 'Salt', 'Iron', 'Silver', 'Green', 'Hollow', 'Bram', 'Kings', 'Fair', 'Crow', 'Brack', 'Marsh', 'Gold', 'Hawk', 'Wil', 'Har', 'Lang', 'North', 'Shep',
  'Ember', 'Thistle', 'Willow', 'Copper', 'Deer', 'Fox', 'Rook', 'Mead', 'High', 'Bright', 'Cold', 'Swan', 'Elm', 'Rush', 'Dun',
  'Cinder', 'Moss', 'Heron', 'Bell', 'Wych', 'Lark', 'Briar', 'Pike', 'Badger', 'Cherry', 'Long', 'Sheep', 'Eagle', 'Bar', 'Hazel'];
const SUFFIXES = ['ford', 'bridge', 'wick', 'ton', 'by', 'holm', 'stead', 'dale', 'moor', 'haven', 'field', 'brook', 'mere', 'gate', 'hill', 'wood', 'cross', 'well', 'barrow', 'combe',
  'mouth', 'ridge', 'stow', 'ley', 'burn', 'hythe', 'cote', 'wold', 'marsh', 'thorpe', 'more', 'side', 'stone', 'fold', 'den', 'ham', 'wark', 'end', 'shaw', 'water'];
const TWO_WORDS = ['Lower {x}', 'Upper {x}', '{x} on the Water', 'Old {x}', '{x} End', 'Great {x}', 'Little {x}', 'New {x}', '{x} Cross', '{x} under Hill'];

export const en: SettlementContent = {
  name: (r) => {
    const x = pick(PREFIXES, r) + pick(SUFFIXES, r);
    return r() < 0.15 ? pick(TWO_WORDS, r).replace('{x}', x) : x;
  },
  governments: {
    hamlet: ['the eldest family decides everything', 'nobody, really — they argue it out at the well', 'a reeve sent by a distant lord, rarely seen', 'a retired soldier everyone listens to', 'a hermit who lives above the hamlet and gives advice nobody asks for', 'whoever has the biggest herd this year', 'the innkeeper — theirs is the only stone house', 'two feuding brothers who split the hamlet in two'],
    village: ['a council of elders', 'a headman elected every spring', 'a reeve of the local lord', 'the temple’s priest, in all but name', 'a widow who owns half the land', 'the miller, because everyone owes the miller', 'a druid circle the villagers fear and respect', 'a landless knight who settled here', 'the village witch — officially the midwife', 'a monastery up the hill that owns the fields', 'the oldest dwarf in the valley', 'a council of the three richest farmers'],
    town: ['a mayor and a council of guild masters', 'a lord’s castellan with a garrison', 'a merchant family that bought the charter', 'a council of the temple', 'an elected burgomaster — and the thieves’ guild behind them', 'a retired adventurer who cleared the place and stayed', 'a guild of shipwrights that runs the harbour and everything else', 'an abbess who keeps the town charter', 'a governor sent from the capital, hated by everyone', 'a council chosen by lot every year', 'a gnome family’s bank — through the debts', 'two rival mayors, each sure they won the election'],
    city: ['a duke from the old palace', 'a council of merchant princes', 'a high priesthood', 'an elected senate that never agrees', 'a regent for a child ruler', 'a mage who no one has seen for years', 'a queen who rules from behind a veil', 'the oldest guilds, by turns', 'generals who stayed in power after the last war', 'the emperor’s viceroy and a council of nobles who hate each other', 'a dragon in human form, if the rumours are true', 'the archmage’s academy, by the founding charter'],
  },
  defenses: {
    hamlet: ['no defences — a couple of dogs', 'a ditch and a fence against wolves', 'everyone has a bow over the door', 'a hedge of thorns grown around the houses', 'a friendly ogre who lives nearby', 'a bell on a post and a cellar where everyone hides'],
    village: ['a wooden palisade with a gate', 'a stone watchtower with a bell', 'a militia of farmers who train on feast days', 'nothing but a ditch', 'an earthen rampart from older days', 'a druid’s warding stones', 'a few retired adventurers who still keep their swords', 'a river on three sides and a drawbridge'],
    town: ['stone walls in need of repair', 'a garrison of the lord’s guards', 'walls, a moat and a proud town watch', 'a hired company of mercenaries', 'a wall that ends where the money ran out', 'a temple order of armed monks', 'catapults on the gate towers, never yet fired', 'a watch of volunteers with lanterns and horns'],
    city: ['double walls and towers', 'a citadel above the city and a large garrison', 'harbour chains, walls and a city watch in every quarter', 'old walls overgrown by suburbs', 'magical wards renewed every solstice', 'a fleet in the harbour and forts at its mouth', 'a knightly order with its own fortress inside the walls', 'golems at the gates, older than the city itself'],
  },
  impressions: {
    hamlet: ['A handful of houses around a well; children stare at the strangers.', 'Smoke from three chimneys and the smell of bread — that’s all of it.', 'A single street ends at a barn; geese guard it better than any watch.', 'Fences of woven willow, a dog that does not bark, and a single lit window.', 'Beehives everywhere; the whole hamlet hums.', 'An old woman spins on her doorstep and watches the road as if she expected you.'],
    village: ['Thatched roofs, a green with a maypole, and a temple bell ringing the hour.', 'Fields all around; the village smells of hay and manure.', 'Washing hangs between the houses; everyone knows everyone’s business.', 'Quiet streets — too quiet for this time of day.', 'A wedding is under way; music and drunken singing carry from the green.', 'Everything is freshly whitewashed, as if for an important guest.', 'Half the houses stand empty, their doors nailed shut.', 'The smell of smoked fish and tar; nets dry on every fence.'],
    town: ['A busy market square, carts at every gate, and shouting in three languages.', 'Narrow streets climb the hill toward the lord’s keep.', 'Workshops ring with hammers; the air smells of smoke and tanneries.', 'Fresh posters on every wall: a curfew, a reward, a festival.', 'Bells ring from three temples, each a little out of time with the others.', 'A hanging in the square has drawn a crowd.', 'Fresh mud and scaffolding: half the town is being rebuilt after a fire.', 'Students in gowns argue loudly on the steps of the town hall.'],
    city: ['Towers, domes and a thousand chimneys; the noise never stops.', 'Crowds, beggars, guards, nobles in carriages — and pickpockets in every crowd.', 'Districts of every people and faith, each with its own rules.', 'The city is built on the ruins of an older one, and they show everywhere.', 'Canals instead of streets; gondoliers shout the news.', 'A procession of priests blocks the main road; incense everywhere.', 'Airships moored to the towers cast moving shadows over the streets.', 'The whole city smells of the sea and of spices from the docks.'],
  },
  knownFor: [
    'its strong cheese', 'the best horses in the region', 'a yearly harvest festival with a giant straw figure', 'a ruined tower on the hill nobody visits',
    'a miraculous spring that heals — sometimes', 'its brewers', 'a famous shrine and its pilgrims', 'a hero born here long ago',
    'witch trials, not so long ago', 'strange lights in the marsh', 'a market that sells anything', 'its wool and weavers',
    'a mine that still gives silver', 'an old bridge said to be built by giants', 'its fishermen’s songs', 'a dragon’s skull over the gate',
    'smugglers, though no one admits it', 'its honey', 'a school of wizards — or what is left of it', 'duels at dawn',
    'its stubborn mules', 'a clock tower whose figures dance at noon', 'a sword in a stone no one can pull out',
    'its pies, sold three villages away', 'the yearly cheese-rolling race', 'a talking raven in the square',
    'a famous fencing school', 'its glassblowers', 'a haunted inn', 'a giant tree in the middle of the square',
    'a hot spring and its bathhouses', 'its executions — people come from afar to watch', 'pickled mushrooms',
    'a dwarf-made clock that has never been wrong', 'a feud between two noble houses',
    'the oracle in the cave above it', 'its dyers — the river runs red', 'a horse fair every autumn',
    'an old battlefield where swords still turn up under the plough', 'its cats — there are more cats than people',
  ],
  troubles: [
    'Livestock vanishes at night; {person} saw something with too many legs.', '{person} has gone missing, and the family suspects a neighbour.',
    'The well water has turned bitter; the elders blame a curse.', 'Bandits demand “protection” money every month.',
    'A sickness spreads, and {person} is selling a cure that might be poison.', 'Two families feud over a field; blood has already been spilled.',
    'The lord’s tax collector is due, and the money is gone.', 'Wolves come closer every night — too clever for wolves.',
    'A stranger bought the old mill and works there only at night.', '{person} claims to see the dead walking the streets.',
    'The bridge collapsed; trade has stopped.', 'Children have started sleepwalking toward the forest.',
    'A cult meets in the old crypt, and {person} is one of them.', 'Goblins raid the outlying farms.',
    'The harvest failed and food is running out.', 'A noble from the capital demands the arrest of {person}.',
    'Earth tremors open new holes in the fields.', 'The temple’s relic has been stolen.',
    'Rats eat the grain stores; {person} says something leads them.',
    'Every night at three the temple bell rings by itself.',
    '{person} is accused of witchcraft, and the pyre is set for dawn.',
    'A giant has settled in the hills and demands a tribute of sheep.', 'The river changed its course overnight.',
    'Coins in the market turn into leaves by evening.', '{person} found a map on a dead traveller and is selling it.',
    'The lord calls up everyone who can hold a weapon for a war.',
    'A dragon was seen over the mountains, and every price has tripled.',
    'The fog has not lifted for a week; people get lost on their own street.',
    '{person} owes dangerous people money and hides in the temple.', 'Someone poisons the dogs, one every night.',
    'Pilgrims crowd the streets, and a sickness came with them.',
    'The mine has gone quiet: the night shift never came up.',
    'Strange children no one knows play in the square at dusk.', 'A rival town has dammed the river upstream.',
    '{person} insists the new priest is an impostor.', 'The graveyard has been dug up, and the bodies are gone.',
  ],
  smallPlaces: [
    'a smithy', 'a mill', 'a shrine of the harvest goddess', 'a general store', 'a herbalist’s hut', 'a stable', 'the elder’s house', 'a fishing pier',
    'a bakery', 'a cemetery with a chapel', 'a carpenter’s yard', 'a ferry',
    'a cooper', 'a tannery', 'a well under a roof', 'an apiary', 'a shepherd’s hut', 'a wayside shrine',
    'a smokehouse', 'a pottery', 'a weaver’s house', 'a granary', 'a toll gate', 'a hedge witch’s garden',
  ],
  bigPlaces: [
    'a market square', 'a temple with a bell tower', 'a guildhall', 'a bathhouse', 'an alchemist’s shop', 'a jail', 'a lord’s keep', 'a bookbinder',
    'a fighting pit', 'an arena', 'a gambling house', 'a harbour with warehouses', 'a mage’s tower', 'a library', 'an armourer', 'a theatre',
    'a moneychanger’s bank', 'a scriptorium', 'a menagerie of strange beasts', 'a mercenaries’ hall', 'a lighthouse',
    'a slaughterhouse', 'a hospice of the healers’ order', 'a debtors’ prison', 'an observatory',
    'a tailor to the nobility', 'a clockmaker’s workshop', 'a printing house', 'a cartographers’ guild',
    'a horse market', 'catacombs under the old temple', 'a broker of magic items',
  ],
  tavern: 'a tavern, {name}',
};
