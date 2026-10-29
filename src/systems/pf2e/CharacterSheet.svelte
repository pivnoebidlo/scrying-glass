<!-- The sheet of a Pathfinder 2e player character (from Pathbuilder or by hand): who they are, the attributes, the
     defenses and checks a click rolls, skills with their ranks, strikes and spells (shared with the stat block),
     feats by level, the gear and the money. Labels — in the card's language. -->
<script lang="ts">
  import { tr, type Key } from '../../shared/i18n';
  import type { Card } from '../../shared/cards';
  import { peekEntry } from '../../renderer/lib/entry/peek.svelte';
  import { rolls } from '../../renderer/lib/rolls.svelte';
  import { ABILITIES, signed } from './stats';
  import { RANKS, type Pf2eCharacter } from './character';
  import Strikes from './Strikes.svelte';
  import SpellLists from './SpellLists.svelte';

  let { card }: { card: Card<Pf2eCharacter> } = $props();
  const c = $derived(card.stats);
  const lb = (key: string, params?: Record<string, string | number>) => tr(card.lang === 'ru' ? 'ru' : 'en', `pf2e.${key}` as Key, params);
  const check = (what: string, bonus: number) => rolls.check(card.name, what, bonus, 'normal', 'four');
  const money = $derived((['pp', 'gp', 'sp', 'cp'] as const).filter((k) => c.money[k]).map((k) => `${c.money[k]} ${k}`).join(', '));
  // Feats by level, in order.
  const featLevels = $derived([...new Set(c.feats.map((f) => f.level))].sort((a, b) => a - b));
</script>

<article class="sheet pf2e">
  <header>
    <h2>{card.name}</h2>
    <span class="level">{c.class} {c.level}</span>
  </header>
  <p class="who">{[c.ancestry, c.heritage !== c.ancestry ? c.heritage : '', c.background].filter(Boolean).join(' · ')}{#if c.languages.length} · {c.languages.join(', ')}{/if}</p>

  <div class="abilities">
    {#each ABILITIES as a (a)}
      <button class="ab" class:key={c.keyAttribute === a} onclick={() => check(lb(`ab.${a}`), c.abilities[a])}><span>{lb(`ab.${a}`)}</span><b>{signed(c.abilities[a])}</b></button>
    {/each}
  </div>

  <div class="defs">
    <div class="def"><span>{lb('sb.ac')}</span><b>{c.ac}</b></div>
    <div class="def"><span>{lb('sb.hp')}</span><b>{c.hp}</b></div>
    <button class="def" onclick={() => check(lb('sb.perception'), c.perception)}><span>{lb('sb.perception')}</span><b>{signed(c.perception)}</b></button>
    <button class="def" onclick={() => check(lb('sb.fort'), c.saves.fort)}><span>{lb('sb.fort')}</span><b>{signed(c.saves.fort)}</b></button>
    <button class="def" onclick={() => check(lb('sb.ref'), c.saves.ref)}><span>{lb('sb.ref')}</span><b>{signed(c.saves.ref)}</b></button>
    <button class="def" onclick={() => check(lb('sb.will'), c.saves.will)}><span>{lb('sb.will')}</span><b>{signed(c.saves.will)}</b></button>
    <div class="def"><span>{lb('sh.classDC')}</span><b>{c.classDC}</b></div>
    <div class="def"><span>{lb('sb.speed')}</span><b>{c.speed}</b></div>
  </div>

  <h3>{lb('sb.skills')}</h3>
  <div class="skills">
    {#each c.skills as sk (sk.name)}
      <button class="skill" class:untrained={sk.rank === 0} onclick={() => check(sk.name, sk.mod)}>
        <span class="rank" title={lb(`sh.rank.${RANKS[sk.rank] ?? 'U'}`)}>{RANKS[sk.rank] ?? 'U'}</span>
        {sk.name} <b>{signed(sk.mod)}</b>
      </button>
    {/each}
  </div>

  {#if c.strikes.length}
    <h3>{lb('sh.strikes')}</h3>
    <Strikes strikes={c.strikes} who={card.name} lang={card.lang} />
  {/if}
  {#if c.spellcasting.length}
    <h3>{lb('sh.spells')}</h3>
    <SpellLists spellcasting={c.spellcasting} who={card.name} lang={card.lang} />
  {/if}

  {#if c.feats.length}
    <h3>{lb('sh.feats')}</h3>
    {#each featLevels as l (l)}
      <p class="feats"><strong>{l}</strong> {#each c.feats.filter((f) => f.level === l) as f, i (f.name + i)}{i ? ', ' : ''}<button class="link" title={f.type} onclick={() => peekEntry(f.name)}>{f.name}</button>{/each}</p>
    {/each}
  {/if}
  {#if c.equipment.length || money}
    <h3>{lb('sh.equipment')}</h3>
    <p>{c.equipment.join(', ')}{#if money}{c.equipment.length ? '; ' : ''}<strong>{money}</strong>{/if}</p>
  {/if}
</article>

<style>
  .sheet {
    font-size: 13px;
    line-height: 1.45;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    margin: 0;
    font-size: 17px;
    text-transform: uppercase;
  }
  .level {
    font-weight: 600;
    text-transform: uppercase;
  }
  .who {
    margin: 4px 0 8px;
    color: var(--text-muted);
  }
  h3 {
    margin: 10px 0 4px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }
  .abilities,
  .defs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 6px;
    margin-bottom: 6px;
  }
  .ab,
  .def {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-normal);
    font: inherit;
  }
  button.ab,
  button.def {
    cursor: pointer;
  }
  button.ab:hover,
  button.def:hover {
    border-color: var(--accent);
  }
  .ab span,
  .def span {
    font-size: 11px;
    color: var(--text-muted);
  }
  .ab.key {
    border-color: var(--accent);
  }
  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .skill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    font: inherit;
    cursor: pointer;
  }
  .skill.untrained {
    color: var(--text-muted);
  }
  .rank {
    font-size: 10px;
    font-weight: 700;
    color: var(--accent);
  }
  .feats {
    margin: 2px 0;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
    text-decoration: underline dotted;
  }
</style>
