<!-- Spellcasting of a creature or a character: DC, the spell attack (rolls), spells by rank — links to the compendium. -->
<script lang="ts">
  import { tr, type Key } from '../../shared/i18n';
  import { peekEntry } from '../../renderer/lib/entry/peek.svelte';
  import { rolls } from '../../renderer/lib/rolls.svelte';
  import { signed, type Spellcasting } from './stats';

  let { spellcasting, who, lang }: { spellcasting: Spellcasting[]; who: string; lang: string } = $props();

  const lb = (key: string, params?: Record<string, string | number>) => tr(lang === 'ru' ? 'ru' : 'en', `pf2e.${key}` as Key, params);
  const rankTitle = (r: { rank: number; constant?: boolean }) => (r.constant ? lb('sb.constant') : r.rank === 0 ? lb('sb.cantrips') : lb('sb.rank', { n: r.rank }));
</script>

{#each spellcasting as sc (sc.name)}
  <div class="spells">
    <strong>{sc.name}</strong> {lb('sb.dc')} {sc.dc}{#if sc.attack !== null}, {lb('sb.attack')} <button class="roll" onclick={() => rolls.check(who, `${sc.name}: ${lb('sb.attack')}`, sc.attack!)}>{signed(sc.attack)}</button>{/if};
    {#each sc.ranks as r, i (r.rank + String(r.constant))}{i ? '; ' : ''}<strong>{rankTitle(r)}</strong>{#if r.slots} ({lb('sb.slots', { n: r.slots })}){/if}
      {#each r.spells as sp, j (sp + j)}{j ? ', ' : ''}<button class="link" onclick={() => peekEntry(sp)}>{sp}</button>{/each}{/each}
  </div>
{/each}

<style>
  .spells {
    margin: 3px 0;
  }
  .roll,
  .link {
    padding: 0 3px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .link {
    padding: 0;
    text-decoration: underline dotted;
  }
  .roll:hover {
    border-color: var(--border);
  }
</style>
