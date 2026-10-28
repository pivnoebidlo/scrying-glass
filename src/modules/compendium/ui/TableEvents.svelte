<!-- Watches the game for the events roll tables can be offered on (events.ts): each one becomes a line of the roll log
     with the tables marked so — only when there are any. Invisible; lives in the compendium's background part. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { rolls } from '../../../renderer/lib/rolls.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import type { AppState } from '../../../shared/types';
  import { gameEvents, type GameEvent } from '../events';

  let prev: AppState | null = null;
  $effect(() => {
    const now = store.state;
    if (!now) return;
    untrack(() => {
      // Another vault opened: its fight is not news.
      if (prev && prev.vault.root === now.vault.root) for (const e of gameEvents(prev, now)) offer(e);
      prev = now;
    });
  });

  function offer(e: GameEvent) {
    if (e.on === 'down') rolls.event('down', e.who, t('cmpui.event.down'));
    else if (e.on === 'combat') rolls.event('combat', t('cmpui.event.fight'), t('cmpui.event.combat'));
    else if (e.on === 'round') rolls.event('round', t('cmpui.event.fight'), t('cmpui.event.round', { n: e.n ?? 0 }));
    else if (e.on === 'watch') rolls.event('watch', t('cmpui.event.explore'), t('cmpui.event.watch', { n: e.n ?? 0, day: e.day ?? 0 }));
  }
</script>
