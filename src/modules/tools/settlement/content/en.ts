// Settlement generator content in English (written for the app).
import type { SettlementContent } from '../types';

const pick = <T>(list: T[], r: () => number): T => list[Math.floor(r() * list.length)]!;
const PREFIXES = ['Oak', 'Ash', 'Stone', 'Raven', 'Wolf', 'Black', 'White', 'Red', 'Mill', 'Thorn', 'Elder', 'Frost', 'Salt', 'Iron', 'Silver', 'Green', 'Hollow', 'Bram', 'Kings', 'Fair', 'Crow', 'Brack', 'Marsh', 'Gold', 'Hawk', 'Wil', 'Har', 'Lang', 'North', 'Shep'];
const SUFFIXES = ['ford', 'bridge', 'wick', 'ton', 'by', 'holm', 'stead', 'dale', 'moor', 'haven', 'field', 'brook', 'mere', 'gate', 'hill', 'wood', 'cross', 'well', 'barrow', 'combe'];
const TWO_WORDS = ['Lower {x}', 'Upper {x}', '{x} on the Water', 'Old {x}', '{x} End'];

export const en: SettlementContent = {
  name: (r) => {
    const x = pick(PREFIXES, r) + pick(SUFFIXES, r);
    return r() < 0.15 ? pick(TWO_WORDS, r).replace('{x}', x) : x;
  },
  governments: {
    hamlet: ['the eldest family decides everything', 'nobody, really — they argue it out at the well', 'a reeve sent by a distant lord, rarely seen', 'a retired soldier everyone listens to'],
    village: ['a council of elders', 'a headman elected every spring', 'a reeve of the local lord', 'the temple’s priest, in all but name', 'a widow who owns half the land', 'the miller, because everyone owes the miller'],
    town: ['a mayor and a council of guild masters', 'a lord’s castellan with a garrison', 'a merchant family that bought the charter', 'a council of the temple', 'an elected burgomaster — and the thieves’ guild behind them', 'a retired adventurer who cleared the place and stayed'],
    city: ['a duke from the old palace', 'a council of merchant princes', 'a high priesthood', 'an elected senate that never agrees', 'a regent for a child ruler', 'a mage who no one has seen for years'],
  },
  defenses: {
    hamlet: ['no defences — a couple of dogs', 'a ditch and a fence against wolves', 'everyone has a bow over the door'],
    village: ['a wooden palisade with a gate', 'a stone watchtower with a bell', 'a militia of farmers who train on feast days', 'nothing but a ditch'],
    town: ['stone walls in need of repair', 'a garrison of the lord’s guards', 'walls, a moat and a proud town watch', 'a hired company of mercenaries'],
    city: ['double walls and towers', 'a citadel above the city and a large garrison', 'harbour chains, walls and a city watch in every quarter', 'old walls overgrown by suburbs'],
  },
  impressions: {
    hamlet: ['A handful of houses around a well; children stare at the strangers.', 'Smoke from three chimneys and the smell of bread — that’s all of it.', 'A single street ends at a barn; geese guard it better than any watch.'],
    village: ['Thatched roofs, a green with a maypole, and a temple bell ringing the hour.', 'Fields all around; the village smells of hay and manure.', 'Washing hangs between the houses; everyone knows everyone’s business.', 'Quiet streets — too quiet for this time of day.'],
    town: ['A busy market square, carts at every gate, and shouting in three languages.', 'Narrow streets climb the hill toward the lord’s keep.', 'Workshops ring with hammers; the air smells of smoke and tanneries.', 'Fresh posters on every wall: a curfew, a reward, a festival.'],
    city: ['Towers, domes and a thousand chimneys; the noise never stops.', 'Crowds, beggars, guards, nobles in carriages — and pickpockets in every crowd.', 'Districts of every people and faith, each with its own rules.', 'The city is built on the ruins of an older one, and they show everywhere.'],
  },
  knownFor: [
    'its strong cheese', 'the best horses in the region', 'a yearly harvest festival with a giant straw figure', 'a ruined tower on the hill nobody visits',
    'a miraculous spring that heals — sometimes', 'its brewers', 'a famous shrine and its pilgrims', 'a hero born here long ago',
    'witch trials, not so long ago', 'strange lights in the marsh', 'a market that sells anything', 'its wool and weavers',
    'a mine that still gives silver', 'an old bridge said to be built by giants', 'its fishermen’s songs', 'a dragon’s skull over the gate',
    'smugglers, though no one admits it', 'its honey', 'a school of wizards — or what is left of it', 'duels at dawn',
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
  ],
  smallPlaces: [
    'a smithy', 'a mill', 'a shrine of the harvest goddess', 'a general store', 'a herbalist’s hut', 'a stable', 'the elder’s house', 'a fishing pier',
    'a bakery', 'a cemetery with a chapel', 'a carpenter’s yard', 'a ferry',
  ],
  bigPlaces: [
    'a market square', 'a temple with a bell tower', 'a guildhall', 'a bathhouse', 'an alchemist’s shop', 'a jail', 'a lord’s keep', 'a bookbinder',
    'a fighting pit', 'an arena', 'a gambling house', 'a harbour with warehouses', 'a mage’s tower', 'a library', 'an armourer', 'a theatre',
  ],
  tavern: 'a tavern, {name}',
};
