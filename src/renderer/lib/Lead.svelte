<!-- An explanation of a page or section that takes one line at most: the text, cut with «…» when it is longer, and
     «(?)» with all of it. The parent keeps its look (colour, size, margins) — Lead sits inside its paragraph. -->
<script lang="ts">
  import HelpTip from './HelpTip.svelte';

  let { text }: { text: string } = $props();

  let line = $state<HTMLSpanElement>();
  let cut = $state(false);
  // «(?)» only when something is hidden: a short text fits and needs no button.
  $effect(() => {
    void text;
    if (!line) return;
    const el = line;
    const check = () => (cut = el.scrollWidth > el.clientWidth + 1 || /\n/.test(text));
    const ro = new ResizeObserver(check);
    ro.observe(el);
    check();
    return () => ro.disconnect();
  });
</script>

<span class="lead">
  <span class="line" bind:this={line}>{text.split('\n')[0]}</span>
  {#if cut}<HelpTip {text} size={13} />{/if}
</span>

<style>
  .lead {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    max-width: 100%;
  }
  .line {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
