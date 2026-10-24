<!-- A card of a system described by a pack (shared/syspack.ts): its sections and fields as the pack says, in the
     card's language. A field with a roll is a button (Shift — advantage, Alt — disadvantage, where it matters); a list
     with a roll rolls by its rows. -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import type { Card } from '../../shared/cards';
  import { modeOf, rolls } from '../../renderer/lib/rolls.svelte';
  import { boxesOf, evalFormula, loc, sectionsFor, type FieldDef, type PackStats, type SystemPack } from '../../shared/syspack';
  import { packOf } from '../packs';

  // draft — a pack not saved yet (the builder's preview); otherwise the card's system.
  let { card, draft }: { card: Card<PackStats>; draft?: SystemPack } = $props();

  const pack = $derived(draft ?? (packOf(card.system) as SystemPack));
  const s = $derived(card.stats ?? {});
  const lang = $derived(card.lang);
  const L = (x: Parameters<typeof loc>[0]) => loc(x, lang);
  const num = (f: FieldDef) => evalFormula(pack, s, f.key);
  const rows = (f: FieldDef) => (Array.isArray(s[f.key]) ? (s[f.key] as Record<string, unknown>[]) : []);
  const tags = (f: FieldDef) => (Array.isArray(s[f.key]) ? (s[f.key] as string[]) : []);
  const text = (f: FieldDef) => (typeof s[f.key] === 'string' ? (s[f.key] as string) : '');
  // A field shows if it has something (an empty text or list isn't drawn; numbers always are).
  const filled = (f: FieldDef) =>
    f.type === 'text' || f.type === 'textarea' ? !!text(f).trim() : f.type === 'list' || f.type === 'tags' ? (f.type === 'list' ? rows(f) : tags(f)).length > 0 : f.type === 'select' ? typeof s[f.key] === 'number' : true;
  const wide = (f: FieldDef) => f.type === 'textarea' || f.type === 'list' || f.type === 'tags';
  const sections = $derived(sectionsFor(pack, card.kind).map((sec) => ({ ...sec, fields: sec.fields.filter(filled) })).filter((sec) => sec.fields.length));

  function roll(f: FieldDef, e: MouseEvent, row?: Record<string, unknown>) {
    if (!f.roll) return;
    const label = row ? String(Object.values(row).find((v) => typeof v === 'string' && v.trim()) ?? L(f.title)) : L(f.title);
    rolls.packRoll(card.name, label, f.roll, (formula) => evalFormula(pack, s, formula, row), modeOf(e));
  }
  const cell = (v: unknown) => (v === undefined || v === null || v === '' ? t('pack.empty') : String(v));
</script>

{#if pack}
  <article class="sheet">
    {#each sections as sec (sec.id)}
      <section>
        <h3>{L(sec.title)}</h3>
        <div class="grid">
          {#each sec.fields as f (f.key)}
            {#if !wide(f)}
              <svelte:element
                this={f.roll ? 'button' : 'div'}
                class="field"
                class:rolls={!!f.roll}
                title={f.roll ? t('pack.rollHint') : L(f.hint)}
                onclick={(e: MouseEvent) => roll(f, e)}
                role={f.roll ? undefined : 'group'}
              >
                <span class="name">{L(f.title)}</span>
                {#if f.type === 'dots'}
                  <span class="dots" aria-label={String(num(f))}>{#each { length: f.max ?? 5 } as _, i (i)}<i class:on={i < num(f)}></i>{/each}</span>
                {:else if f.type === 'track'}
                  {@const n = boxesOf(pack, s, f)}
                  <span class="boxes" aria-label="{num(f)} / {n}">{#each { length: n } as _, i (i)}<i class:on={i < num(f)}></i>{/each}</span>
                {:else if f.type === 'select'}
                  <span class="value">{L(f.options?.[s[f.key] as number])}</span>
                {:else if f.type === 'text'}
                  <span class="value">{text(f)}</span>
                {:else}
                  <span class="value big">{Math.round(num(f) * 100) / 100}</span>
                {/if}
              </svelte:element>
            {/if}
          {/each}
        </div>
        {#each sec.fields.filter(wide) as f (f.key)}
          {#if f.type === 'textarea'}
            <p class="long"><b>{L(f.title)}.</b> {text(f)}</p>
          {:else if f.type === 'tags'}
            <p class="long"><b>{L(f.title)}:</b> {#each tags(f) as tag, i (i)}<span class="tag">{tag}</span>{/each}</p>
          {:else}
            <table>
              <thead>
                <tr>{#each f.columns ?? [] as c (c.key)}<th>{L(c.title)}</th>{/each}</tr>
              </thead>
              <tbody>
                {#each rows(f) as row, i (i)}
                  <tr class:rolls={!!f.roll} title={f.roll ? t('pack.rollHint') : ''} onclick={(e) => roll(f, e, row)}>
                    {#each f.columns ?? [] as c (c.key)}
                      <td>
                        {#if c.type === 'dots'}
                          <span class="dots">{#each { length: c.max ?? 5 } as _, j (j)}<i class:on={j < Number(row[c.key] ?? 0)}></i>{/each}</span>
                        {:else}{cell(row[c.key])}{/if}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        {/each}
      </section>
    {/each}
  </article>
{/if}

<style>
  .sheet {
    max-width: 760px;
    line-height: 1.45;
    user-select: text;
  }
  h3 {
    margin: 14px 0 6px;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  section:first-child h3 {
    margin-top: 4px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 6px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: inherit;
    font: inherit;
    text-align: left;
  }
  button.field {
    cursor: pointer;
  }
  button.field:hover {
    border-color: var(--accent);
  }
  .name {
    color: var(--text-muted);
    font-size: 11px;
  }
  .value {
    overflow-wrap: anywhere;
  }
  .big {
    font-size: 18px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .dots,
  .boxes {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 3px;
    padding: 3px 0;
  }
  .dots i {
    width: 9px;
    height: 9px;
    border: 1px solid var(--text-muted);
    border-radius: 50%;
  }
  .boxes i {
    width: 11px;
    height: 11px;
    border: 1px solid var(--text-muted);
    border-radius: 2px;
  }
  .dots i.on,
  .boxes i.on {
    border-color: var(--accent);
    background: var(--accent);
  }
  .long {
    margin: 8px 0 0;
    white-space: pre-line;
  }
  .tag {
    display: inline-block;
    margin: 0 4px 2px 0;
    padding: 0 6px;
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
  }
  table {
    width: 100%;
    margin-top: 8px;
    border-collapse: collapse;
    font-size: 13px;
  }
  th {
    padding: 2px 6px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    text-align: left;
  }
  td {
    padding: 3px 6px;
    border-top: 1px solid var(--border);
  }
  tr.rolls {
    cursor: pointer;
  }
  tr.rolls:hover td {
    background: var(--bg-hover);
  }
</style>
