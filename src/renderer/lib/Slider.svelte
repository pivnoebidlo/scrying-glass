<!-- Ползунок. oninput — пока тянут (например, громкость сразу), onchange — когда отпустили. -->
<script lang="ts">
  let {
    value,
    min = 0,
    max = 1,
    step = 0.01,
    title = '',
    oninput,
    onchange,
  }: {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    title?: string;
    oninput?: (v: number) => void;
    onchange?: (v: number) => void;
  } = $props();

  const percent = $derived(max > min ? ((value - min) / (max - min)) * 100 : 0);
</script>

<input
  type="range"
  {min}
  {max}
  {step}
  {value}
  {title}
  style:--p="{percent}%"
  oninput={(e) => oninput?.(Number(e.currentTarget.value))}
  onchange={(e) => onchange?.(Number(e.currentTarget.value))}
/>

<style>
  input {
    width: 100%;
    height: 16px;
    margin: 0;
    background: transparent;
    appearance: none;
    cursor: pointer;
  }
  input::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(to right, var(--accent) var(--p), var(--bg-active) var(--p));
  }
  input::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
    margin-top: -4px;
    border-radius: 50%;
    background: var(--text-normal);
    appearance: none;
  }
</style>
