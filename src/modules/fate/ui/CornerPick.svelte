<!-- Выбор угла экрана игроков: схема 2×2, закрашен выбранный угол. -->
<script lang="ts">
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { CORNERS, type Corner } from '../types';

  let { value, what, onpick }: { value: Corner; what: string; onpick: (c: Corner) => void } = $props();
</script>

<span class="pick" role="radiogroup" aria-label={t('fate.where', { what })}>
  {#each CORNERS as c (c)}
    <button
      role="radio"
      aria-checked={c === value}
      class:on={c === value}
      title={t('fate.cornerHint', { what, corner: t(`fate.corner.${c}`) })}
      onclick={() => onpick(c)}
    ></button>
  {/each}
</span>

<style>
  .pick {
    display: inline-grid;
    grid-template-columns: 8px 8px;
    gap: 2px;
    padding: 3px;
    border-radius: var(--radius-s);
  }
  .pick:hover {
    background: var(--bg-hover);
  }
  button {
    width: 8px;
    height: 8px;
    padding: 0;
    border: 1px solid var(--text-faint);
    border-radius: 2px;
    background: none;
    cursor: pointer;
  }
  button:hover {
    border-color: var(--text-normal);
  }
  .on {
    border-color: var(--accent);
    background: var(--accent);
  }
</style>
