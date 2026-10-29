<!-- Strikes of a creature or a character: three buttons with the multiple attack penalty, damage and ×2 for a
     critical hit (the whole damage doubled). -->
<script lang="ts">
  import { tr, type Key } from '../../shared/i18n';
  import { rolls } from '../../renderer/lib/rolls.svelte';
  import { mapOf, signed, type Strike } from './stats';

  let { strikes, who, lang }: { strikes: Strike[]; who: string; lang: string } = $props();

  const lb = (key: string, params?: Record<string, string | number>) => tr(lang === 'ru' ? 'ru' : 'en', `pf2e.${key}` as Key, params);
  // The dice of a damage line («{1d10+1} piercing plus {1d6} fire»): their sum is rolled (one roll in the log).
  const diceOf = (damage: string) => [...damage.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]!).join('+');
  const damageText = (damage: string) => damage.replace(/\{([^}]+)\}/g, '$1');
  const strike = (st: Strike, n: 1 | 2 | 3) => rolls.check(who, `${st.name} (${lb('sb.map', { n })})`, st.bonus + mapOf(st, n));
  const hit = (st: Strike, crit: boolean) => rolls.damage(who, `${st.name}${crit ? ' ×2' : ''}`, diceOf(st.damage), crit, 'total');
</script>

{#each strikes as st (st.name + st.bonus)}
  <div class="strike">
    <strong>{st.ranged ? lb('sb.ranged') : lb('sb.melee')}</strong> <span class="act">◆</span>
    {st.name}
    <span class="attacks">{#each [1, 2, 3] as const as n (n)}{n > 1 ? ' / ' : ''}<button class="roll" title={lb('sb.map', { n })} onclick={() => strike(st, n)}>{signed(st.bonus + mapOf(st, n))}</button>{/each}</span>
    {#if st.traits.length}<span class="traits">({st.traits.join(', ')})</span>{/if},
    <strong>{lb('sb.damage')}</strong>
    {#if diceOf(st.damage)}
      <button class="roll" onclick={() => hit(st, false)}>{damageText(st.damage)}</button>
      <button class="roll crit" title={lb('sb.crit')} onclick={() => hit(st, true)}>×2</button>
    {:else}{damageText(st.damage)}{/if}{#if st.effects.length} plus {st.effects.join(', ')}{/if}
  </div>
{/each}

<style>
  .strike {
    margin: 3px 0;
  }
  .act {
    font-size: 11px;
    letter-spacing: -1px;
  }
  .traits,
  .attacks {
    color: var(--text-muted);
  }
  .roll {
    padding: 0 3px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .roll:hover {
    border-color: var(--border);
  }
  .roll.crit {
    font-size: 11px;
  }
</style>
