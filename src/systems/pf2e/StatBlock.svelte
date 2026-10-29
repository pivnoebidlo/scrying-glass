<!-- The stat block of a Pathfinder 2e creature, in the order of the books. Labels — in the card's language. A click
     rolls: a check (Perception, a skill, a save), a strike — three buttons with the multiple attack penalty, damage
     and ×2 for a critical hit, {dice} in a text; a [[link]] opens the compendium entry on the side. -->
<script lang="ts">
  import { tr, type Key } from '../../shared/i18n';
  import type { Card } from '../../shared/cards';
  import { entryHtml } from '../../renderer/lib/entry/markup';
  import { peekEntry } from '../../renderer/lib/entry/peek.svelte';
  import { rolls } from '../../renderer/lib/rolls.svelte';
  import { actionIcon } from './entries';
  import { ABILITIES, signed, type Feature, type Pf2eStats } from './stats';
  import Strikes from './Strikes.svelte';
  import SpellLists from './SpellLists.svelte';

  let { card }: { card: Card<Pf2eStats> } = $props();

  const s = $derived(card.stats);
  const lb = (key: string, params?: Record<string, string | number>) => tr(card.lang === 'ru' ? 'ru' : 'en', `pf2e.${key}` as Key, params);
  const check = (what: string, bonus: number) => rolls.check(card.name, what, bonus, 'normal', 'four');

  const html = (f: Feature) => entryHtml(f.text, { dice: true });
  // Links and dice in a text: the compendium entry on the side, the dice — into the roll log.
  function onText(e: MouseEvent, f: Feature) {
    const el = e.target as HTMLElement;
    const link = el.closest<HTMLElement>('a.wikilink');
    if (link?.dataset['link']) return peekEntry(link.dataset['link']);
    const dice = el.closest<HTMLElement>('button.dice');
    if (dice?.dataset['dice']) rolls.damage(card.name, f.name, dice.dataset['dice']);
  }
</script>

{#snippet features(list: Feature[])}
  {#each list as f (f.name)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="feature" onclick={(e) => onText(e, f)}>
      <strong>{f.name}</strong>
      {#if actionIcon(f.actions)}<span class="act">{actionIcon(f.actions)}</span>{/if}
      {#if f.traits.length}<span class="traits">({f.traits.join(', ')})</span>{/if}
      <div class="text">{@html html(f)}</div>
    </div>
  {/each}
{/snippet}

<article class="statblock pf2e">
  <header>
    <h2>{card.name}</h2>
    <span class="level">{lb('creature')} {s.level}</span>
  </header>
  <div class="chips">
    {#if s.rarity !== 'common'}<span class="chip rarity {s.rarity}">{s.rarity}</span>{/if}
    <span class="chip size">{lb(`size.${s.size}`)}</span>
    {#each s.traits as tr_ (tr_)}<span class="chip">{tr_}</span>{/each}
  </div>

  <p>
    <strong>{lb('sb.perception')}</strong>
    <button class="roll" onclick={() => check(lb('sb.perception'), s.perception)}>{signed(s.perception)}</button>{#if s.senses.length}; {s.senses.join(', ')}{/if}
  </p>
  {#if s.languages.length}<p><strong>{lb('sb.languages')}</strong> {s.languages.join(', ')}</p>{/if}
  {#if s.skills.length}
    <p>
      <strong>{lb('sb.skills')}</strong>
      {#each s.skills as sk, i (sk.name)}{i ? ', ' : ''}{sk.name} <button class="roll" onclick={() => check(sk.name, sk.mod)}>{signed(sk.mod)}</button>{/each}
    </p>
  {/if}
  <p class="abilities">
    {#each ABILITIES as a, i (a)}{i ? ', ' : ''}<strong>{lb(`ab.${a}`)}</strong> {signed(s.abilities[a])}{/each}
  </p>
  {#if s.items.length}<p><strong>{lb('sb.items')}</strong> {s.items.join(', ')}</p>{/if}
  {@render features(s.interaction)}

  <hr />
  <p>
    <strong>{lb('sb.ac')}</strong> {s.ac};
    <strong>{lb('sb.fort')}</strong> <button class="roll" onclick={() => check(lb('sb.fort'), s.saves.fort)}>{signed(s.saves.fort)}</button>,
    <strong>{lb('sb.ref')}</strong> <button class="roll" onclick={() => check(lb('sb.ref'), s.saves.ref)}>{signed(s.saves.ref)}</button>,
    <strong>{lb('sb.will')}</strong> <button class="roll" onclick={() => check(lb('sb.will'), s.saves.will)}>{signed(s.saves.will)}</button>{#if s.saves.note}; {s.saves.note}{/if}
  </p>
  <p>
    <strong>{lb('sb.hp')}</strong> {s.hp}{#if s.hpNote}, {s.hpNote}{/if}{#if s.immunities.length}; <strong>{lb('sb.immunities')}</strong> {s.immunities.join(', ')}{/if}{#if s.weaknesses.length}; <strong>{lb('sb.weaknesses')}</strong> {s.weaknesses.join(', ')}{/if}{#if s.resistances.length}; <strong>{lb('sb.resistances')}</strong> {s.resistances.join(', ')}{/if}
  </p>
  {@render features(s.defensive)}

  <hr />
  <p><strong>{lb('sb.speed')}</strong> {s.speeds.join(', ')}</p>
  <Strikes strikes={s.strikes} who={card.name} lang={card.lang} />
  <SpellLists spellcasting={s.spellcasting} who={card.name} lang={card.lang} />
  {@render features(s.offensive)}
</article>

<style>
  .statblock {
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
    letter-spacing: 0.02em;
  }
  .level {
    font-weight: 600;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin: 6px 0;
  }
  .chip {
    padding: 1px 6px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--bg-secondary);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .chip.rarity {
    color: var(--on-accent);
    background: var(--accent);
    border-color: var(--accent);
  }
  .chip.size {
    background: var(--bg-hover);
  }
  p,
  .feature,
  .strike,
  .spells {
    margin: 3px 0;
  }
  hr {
    margin: 6px 0;
    border: 0;
    border-top: 1px solid var(--border);
  }
  .act {
    font-size: 11px;
    letter-spacing: -1px;
  }
  .traits {
    color: var(--text-muted);
  }
  .text :global(p) {
    margin: 2px 0;
  }
  .text :global(hr) {
    margin: 4px 0;
    border: 0;
    border-top: 1px dashed var(--border);
  }
  .roll,
  .text :global(button.dice) {
    padding: 0 3px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .roll:hover,
  .text :global(button.dice:hover) {
    border-color: var(--border);
  }
  .attacks {
    color: var(--text-faint);
  }
  .roll.crit {
    font-size: 11px;
  }
  .link,
  .text :global(a.wikilink) {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
    text-decoration: underline dotted;
  }
</style>
