<!-- A form of a package (shared/generators.ts): the inputs, what they come to. Remembered by the window. Knows no game. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { locale } from '../../../renderer/lib/i18n.svelte';
  import { store } from '../../../renderer/lib/store.svelte';
  import { currentSystem } from '../../../shared/adventures';
  import { genText, runForm, type GenForm } from '../../../shared/generators';

  let { id, form }: { id: string; form: GenForm } = $props();

  const KEY = $derived(`generators.form.${id}`);
  function load(key: string): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, number>;
    } catch {
      return {};
    }
  }
  const values = $state(untrack(() => load(KEY)));
  function set(key: string, v: number) {
    values[key] = v;
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(values)));
    } catch {
      /* not remembered — not a problem */
    }
  }
  const lang = $derived(locale.lang);
  const r = $derived(runForm(form, values, currentSystem(store.state.adventures), lang));
  const big = $derived(r.results.filter((x) => x.kind === 'big'));
  const warn = $derived(r.results.filter((x) => x.kind === 'warn'));
  const cards = $derived(r.results.filter((x) => x.kind === 'card'));
  const now = (key: string, fallback = 0) => values[key] ?? fallback;
</script>

{#if form.about}<p class="faint about"><Lead text={genText(form.about, lang)} /></p>{/if}
<div class="options">
  {#each r.inputs as i (i.key)}
    {#if i.type === 'check'}
      <label class="check"><input type="checkbox" checked={!!now(i.key, i.default)} onchange={(e) => set(i.key, e.currentTarget.checked ? 1 : 0)} /> {genText(i.title, lang)}</label>
    {:else if i.type === 'number'}
      <label>{genText(i.title, lang)}<input type="number" min={i.min} max={i.max} value={now(i.key, i.default)} oninput={(e) => set(i.key, Number(e.currentTarget.value) || 0)} /></label>
    {:else}
      <label>{genText(i.title, lang)}
        <select value={now(i.key, i.default)} onchange={(e) => set(i.key, Number(e.currentTarget.value))}>
          {#each i.options ?? [] as o, n (o.id)}<option value={n}>{genText(o.title, lang)}</option>{/each}
        </select>
      </label>
    {/if}
  {/each}
</div>

<section class="result">
  {#each big as x, n (n)}<div class={n ? 'faint' : 'big'}>{x.text}</div>{/each}
  {#each warn as x, n (n)}<p class="warn">{x.text}</p>{/each}
</section>
<div class="cards">
  {#each cards as x, n (n)}
    <section class="card">
      {#if x.title}<h3>{x.title}</h3>{/if}
      <p>{x.text}</p>
      {#if x.note}<p class="faint">{x.note}</p>{/if}
    </section>
  {/each}
</div>

<style>
  .about {
    margin: 6px 0 12px;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    align-items: flex-end;
  }
  .options label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .options label.check {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  .options input[type='number'] {
    width: 110px;
  }
  .result {
    margin: 14px 0;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  .big {
    font-size: 22px;
    font-weight: 600;
  }
  .warn {
    margin: 6px 0 0;
    color: var(--warning);
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 10px;
  }
  .card {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  .card h3 {
    margin: 0 0 6px;
    font-size: 13px;
  }
  .card p {
    margin: 0 0 6px;
    white-space: pre-line;
  }
</style>
