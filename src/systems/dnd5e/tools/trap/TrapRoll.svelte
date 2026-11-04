<!-- The trap's damage or attack roll, into the roll log. -->
<script lang="ts">
  import { Dices } from '@lucide/svelte';
  import { t } from '../../../../renderer/lib/i18n.svelte';
  import { rolls } from '../../../../renderer/lib/rolls.svelte';
  import { trapDice, type Trap } from './generate';
  import { mechanismOf, trapName, type TrapLang } from './text';

  let { trap, lang }: { trap: Trap; lang: TrapLang } = $props();
  const m = $derived(mechanismOf(trap));
  function roll() {
    if (m?.save) rolls.damage(trapName(trap, lang), t('trap.effect'), trapDice(trap));
    else rolls.attack(trapName(trap, lang), t('trap.effect'), trap.attack, [trapDice(trap)]);
  }
</script>

{#if m?.damage}
  <button class="btn" onclick={roll}><Dices size={14} /> {m.save ? trapDice(trap) : t('trap.rollAttack', { bonus: trap.attack })}</button>
{/if}
