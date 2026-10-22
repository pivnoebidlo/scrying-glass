<!-- A track of boxes: a click fills up to that box, a click on the last filled one empties it. `fixed` boxes at the
     right end are taken (turf on the rep tracker) and can't be clicked. -->
<script lang="ts">
  let { n, of, fixed = 0, title = '', tone = 'accent', set }: { n: number; of: number; fixed?: number; title?: string; tone?: 'accent' | 'danger'; set: (v: number) => void } = $props();
</script>

<span class="boxes" class:danger={tone === 'danger'} {title}>
  {#each { length: of } as _, i (i)}
    {#if i >= of - fixed}
      <i class="fixed"></i>
    {:else}
      <button class:on={i < n} aria-label={String(i + 1)} onclick={() => set(i === n - 1 ? i : i + 1)}></button>
    {/if}
  {/each}
</span>

<style>
  .boxes {
    display: inline-flex;
    flex: none;
    flex-wrap: wrap;
    gap: 3px;
  }
  button,
  i {
    width: 13px;
    height: 13px;
    padding: 0;
    border: 1px solid var(--text-muted);
    border-radius: 2px;
    background: none;
    cursor: pointer;
  }
  button.on {
    border-color: var(--accent);
    background: var(--accent);
  }
  .danger button.on {
    border-color: var(--danger);
    background: var(--danger);
  }
  i.fixed {
    border-color: var(--text-faint);
    background: repeating-linear-gradient(45deg, var(--text-faint) 0 2px, transparent 2px 4px);
    cursor: default;
  }
</style>
