<!-- The initiative tracker of a pack system: health (current / max, damage and healing as in D&D), the tracks the
     pack shows (a click fills up to that box, on the last filled — one less), its numbers (current / max) and "taken
     out" (head — the column headers). -->
<script lang="ts">
  import { Ban } from '@lucide/svelte';
  import { t } from '../../renderer/lib/i18n.svelte';
  import { dispatch, store } from '../../renderer/lib/store.svelte';
  import type { Combatant } from '../../modules/initiative/types';
  import { currentSystem } from '../../shared/adventures';
  import { fieldMap, loc } from '../../shared/syspack';
  import { getLang } from '../../shared/i18n';
  import { packOf } from '../packs';

  let { c, head = false }: { c?: Combatant; head?: boolean } = $props();

  const pack = $derived(packOf(currentSystem(store.state.adventures)));
  const fields = $derived(pack ? fieldMap(pack) : new Map());
  const hp = $derived(!!pack?.tracker.hp);
  const cells = $derived(
    (pack?.tracker.cells ?? [])
      .filter((k) => k !== pack?.tracker.hp)
      .map((k) => ({ key: k, track: fields.get(k)?.type === 'track', text: ['text', 'textarea'].includes(fields.get(k)?.type ?? ''), title: loc(fields.get(k)?.title, getLang()) })),
  );
  const setText = (c: Combatant, key: string, v: string) => update(c, { texts: { ...(c.texts ?? {}), [key]: v.trim() } });

  const num = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? null : Number(v));
  const update = (c: Combatant, changes: Partial<Omit<Combatant, 'id'>>) => dispatch('initiative', 'update', { id: c.id, changes });
  function applyHp(c: Combatant, input: HTMLInputElement) {
    const v = input.value.trim();
    const n = Number(v);
    if (!v || isNaN(n)) return;
    dispatch('initiative', 'changeHp', { id: c.id, amount: v.startsWith('+') ? Math.abs(n) : -Math.abs(n) });
    input.value = '';
  }
  const marked = (c: Combatant, key: string) => c.stress?.find((s) => s.id === key)?.boxes.filter(Boolean).length ?? 0;
  function setBoxes(c: Combatant, key: string, n: number) {
    const line = c.stress?.find((s) => s.id === key);
    if (!line) return;
    const to = marked(c, key) === n ? n - 1 : n;
    update(c, { stress: (c.stress ?? []).map((s) => (s.id === key ? { ...s, boxes: s.boxes.map((_, i) => i < to) } : s)) });
  }
  function setAttr(c: Combatant, key: string, value: number | null) {
    const old = c.attrs?.find((a) => a.id === key);
    update(c, { attrs: [...(c.attrs ?? []).filter((a) => a.id !== key), { id: key, value: value ?? 0, max: old?.max ?? value ?? 0 }] });
  }
</script>

{#if head}
  {#if hp}
    <th class="c-hp">{loc(fields.get(pack!.tracker.hp!)?.title, getLang())}</th>
    <th class="c-dmg" title={t('dnd.tr.dmgHint')}>±</th>
  {/if}
  {#each cells as cell (cell.key)}<th class="c-cell">{cell.title}</th>{/each}
  <th class="c-out"></th>
{:else if c}
  {@const it = c}
  {#if hp}
    <td class="c-hp">
      {#if c.maxHp !== null}
        <span class:low={c.hp !== null && c.hp <= c.maxHp / 2}>{c.hp ?? '—'}</span><span class="faint">/</span><input
          class="max"
          type="text"
          inputmode="numeric"
          value={c.maxHp}
          onchange={(e) => update(it, { maxHp: num(e.currentTarget.value), hp: Math.min(it.hp ?? 0, num(e.currentTarget.value) ?? Infinity) })}
        />
      {:else}
        <input class="max" type="text" inputmode="numeric" placeholder="—" onchange={(e) => update(it, { maxHp: num(e.currentTarget.value), hp: num(e.currentTarget.value) })} />
      {/if}
    </td>
    <td class="c-dmg">
      <input type="text" placeholder="±" disabled={c.maxHp === null} onkeydown={(e) => e.key === 'Enter' && applyHp(it, e.currentTarget)} onblur={(e) => applyHp(it, e.currentTarget)} />
    </td>
  {/if}
  {#each cells as cell (cell.key)}
    <td class="c-cell">
      {#if cell.text}
        <input type="text" class="txt" class:filled={!!c.texts?.[cell.key]} value={c.texts?.[cell.key] ?? ''} placeholder={cell.title} onchange={(e) => setText(it, cell.key, e.currentTarget.value)} />
      {:else if cell.track}
        {@const line = c.stress?.find((s) => s.id === cell.key)}
        <span class="track">
          {#each line?.boxes ?? [] as on, i (i)}<button class="box" class:on aria-label={String(i + 1)} onclick={() => setBoxes(it, cell.key, i + 1)}></button>{/each}
        </span>
      {:else}
        {@const a = c.attrs?.find((x) => x.id === cell.key)}
        <input class="n" type="text" inputmode="numeric" value={a?.value ?? ''} placeholder="—" onchange={(e) => setAttr(it, cell.key, num(e.currentTarget.value))} />{#if a?.max}<span class="faint">/{a.max}</span>{/if}
      {/if}
    </td>
  {/each}
  <td class="c-out">
    <button class="icon-btn out" class:on={c.out} title={c.out ? t('pack.outBack') : t('pack.outHint')} onclick={() => update(it, { out: !it.out })}><Ban size={14} /></button>
  </td>
{/if}

<style>
  .c-hp {
    width: 110px;
    white-space: nowrap;
  }
  .c-hp .max {
    width: 48px;
  }
  .low {
    color: var(--danger);
  }
  .c-dmg input {
    width: 48px;
  }
  .c-cell {
    white-space: nowrap;
  }
  .n {
    width: 44px;
  }
  .txt {
    width: 110px;
    font-size: 12px;
  }
  .txt.filled {
    color: var(--danger);
  }
  .track {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 2px;
    max-width: 180px;
  }
  .box {
    width: 14px;
    height: 16px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: none;
    cursor: pointer;
  }
  .box:hover {
    border-color: var(--accent);
  }
  .box.on {
    border-color: var(--danger);
    background: var(--danger);
  }
  .out.on {
    color: var(--danger);
  }
</style>
