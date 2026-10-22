<!-- The entanglement roll and its result: the two entanglements to choose from, each a link to the rules. -->
<script lang="ts">
  import { Dices, X } from '@lucide/svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { peekEntry } from '../../../renderer/lib/entry/peek.svelte';
  import type { Crew } from '../types';

  let { crew, adventure }: { crew: Crew; adventure: string | null } = $props();
  const last = $derived(crew.last);
  const name = (id: string) => t(`crew.ent.${id}` as 'crew.ent.arrest');
</script>

<div class="entangle">
  <button class="btn" title={t('crew.entangleHint')} onclick={() => dispatch('crew', 'entanglement', { adventure })}><Dices size={13} /> {t('crew.entangle')}</button>
  {#if last}
    <p class="note">
      <span class="faint">{t('crew.entangleRolled', { dice: `${last.roll.dice.join(', ')}${last.roll.zero ? ' ↓' : ''}`, heat: last.heat })}</span>
      {#each last.options as id, i (id)}
        {#if i}<span class="faint">{` ${t('crew.or')} `}</span>{/if}
        <button class="link" title={t('crew.entryHint')} onclick={() => peekEntry(name(id))}>{name(id)}</button>
      {/each}
      <button class="icon-btn off" title={t('crew.remove')} onclick={() => dispatch('crew', 'clearLast', { adventure })}><X size={12} /></button>
    </p>
  {/if}
</div>

<style>
  .entangle {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .note {
    margin: 0;
    padding: 4px 8px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    font-size: 13px;
  }
  .link {
    padding: 0;
    border: none;
    background: none;
    color: var(--text-accent);
    font: inherit;
    font-weight: 600;
    text-decoration: underline dotted;
    cursor: pointer;
  }
  .off {
    margin-left: 4px;
    vertical-align: middle;
  }
</style>
