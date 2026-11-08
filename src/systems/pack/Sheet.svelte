<!-- A card of a system described by a pack (shared/syspack.ts): its sections and fields as the pack says, in the
     card's language. A field with a roll is a button (Shift — advantage, Alt — disadvantage, where it matters); a list
     with a roll rolls by its rows. -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import type { Card } from '../../shared/cards';
  import { modeOf, rolls } from '../../renderer/lib/rolls.svelte';
  import { usedAfter } from '../../shared/players';
  import { addMarks, aloneOnLine, boxesOf, boxMark, clickMarks, fieldMap, heavyOf, insideTracks, pairFields, type TwoMarks, cellDice, cellText, evalFormula, lineGroups, loc, longColumn, packResources, sectionsFor, signedNum, slotGroups, tabsOf, type ColumnDef, type FieldDef, type PackSlot, type PackStats, type SystemPack } from '../../shared/syspack';
  import { Dices } from '@lucide/svelte';
  import { entryHtml } from '../../renderer/lib/entry/markup';
  import { escape } from '../../renderer/lib/markdown';
  import { peekEntry } from '../../renderer/lib/entry/peek.svelte';
  import { spellLinks } from '../../renderer/lib/namelinks';
  import { sheetUsage } from '../../renderer/lib/sheetusage.svelte';
  import { packOf } from '../packs';

  // draft — a pack not saved yet (the builder's preview); otherwise the card's system.
  let { card, draft }: { card: Card<PackStats>; draft?: SystemPack } = $props();

  const pack = $derived(draft ?? (packOf(card.system) as SystemPack));
  // Fields marked at the table win over the card's values, in formulas too. A draft has no table.
  const host = $derived(draft ? null : sheetUsage.host);
  const res = $derived(pack ? packResources(pack, card.stats ?? {}, card.kind) : null);
  const s = $derived.by(() => {
    const out: PackStats = { ...card.stats };
    const used = host?.used(card) ?? {};
    for (const [k, limit] of Object.entries(res?.limits ?? {})) if (used[k] !== undefined) out[k] = Math.min(used[k]!, limit);
    return out;
  });
  // The field can be changed here.
  const marks = (f: FieldDef) => !!host && !!res && Object.hasOwn(res.limits, f.key) && !(host.player && res.gmOnly?.includes(f.key));
  const mark = (f: FieldDef, box: number) => host?.set(card, f.key, usedAfter(num(f), box));
  // A track of two kinds: its own marks are light, the heavy track's — heavy (one set of boxes).
  const inside = $derived(insideTracks(pack));
  const twoOf = (f: FieldDef, h: FieldDef): TwoMarks => ({ light: num(f), heavy: num(h) });
  const setTwo = (f: FieldDef, h: FieldDef, m: TwoMarks) => (host?.set(card, f.key, m.light), host?.set(card, h.key, m.heavy));
  const markTrack = (f: FieldDef, i: number) => {
    const h = heavyOf(pack, f);
    if (!h) return mark(f, i);
    setTwo(f, h, clickMarks(twoOf(f, h), boxesOf(pack, s, f), i));
  };
  const marksTrack = (f: FieldDef) => marks(f) && (!heavyOf(pack, f) || marks(heavyOf(pack, f)!));
  const step = (f: FieldDef, by: number) => host?.set(card, f.key, Math.max(0, Math.min(res?.limits[f.key] ?? 0, num(f) + by)));
  const resets = $derived(host && pack ? (pack.resets ?? []).filter((r) => res?.resets[r.id] && !(host.player && res.resets[r.id]!.some((k) => res.gmOnly?.includes(k)))) : []);
  function reset(id: string, title: string) {
    if (confirm(t('pack.resetQ', { title, name: card.name }))) host?.reset(card, id);
  }
  const lang = $derived(card.lang);
  const L = (x: Parameters<typeof loc>[0]) => loc(x, lang);
  const num = (f: FieldDef) => evalFormula(pack, s, f.key);
  const rows = (f: FieldDef) => (Array.isArray(s[f.key]) ? (s[f.key] as Record<string, unknown>[]) : []);
  const tags = (f: FieldDef) => (Array.isArray(s[f.key]) ? (s[f.key] as string[]) : []);
  const text = (f: FieldDef) => (typeof s[f.key] === 'string' ? (s[f.key] as string) : '');
  // A field shows if it has something (an empty text or list isn't drawn; numbers always are).
  const slots = (f: FieldDef) => (Array.isArray(s[f.key]) ? (s[f.key] as PackSlot[]) : []);
  const filled = (f: FieldDef) =>
    f.hidden || inside.has(f.key) ? false : f.type === 'track' ? boxesOf(pack, s, f) > 0 : f.type === 'text' || f.type === 'textarea'
      ? !!text(f).trim()
      : f.type === 'list' || f.type === 'tags'
        ? (f.type === 'list' ? rows(f) : tags(f)).length > 0
        : f.type === 'slots'
          ? slots(f).some((x) => x?.name?.trim())
          : f.type === 'select'
            ? typeof s[f.key] === 'number'
            : !(f.hideZero && num(f) === 0);
  const wide = (f: FieldDef) => f.type === 'textarea' || f.type === 'list' || f.type === 'tags' || f.type === 'slots';
  // A table keeps its empty cells: the fields fill it by their place.
  const sections = $derived(sectionsFor(pack, card.kind).map((sec) => (sec.view === 'grid' ? sec : { ...sec, fields: sec.fields.filter(filled) })).filter((sec) => sec.fields.length));

  function roll(f: FieldDef, e: MouseEvent, row?: Record<string, unknown>, extra = 0, step = 0) {
    if (!f.roll) return;
    // A pool that asks: dice added or taken first (help, darkness), a second trait — the chips under the field.
    if (f.roll.type === 'pool' && (f.roll.ask || pairsOf(f).length) && asking === null) return void (asking = { key: f.key, row, mode: modeOf(e) });
    const with_ = asking?.with ? fieldMap(pack).get(asking.with) : undefined;
    const base = row ? rowName(f, row) : L(f.title);
    const named = with_ ? `${base} + ${L(with_.title)}` : base;
    const label = step ? `${named} (${t('pack.step', { n: step + 1 })})` : named;
    const spec = (extra || with_) && f.roll.type === 'pool' ? { ...f.roll, count: `(${f.roll.count}) + ${extra}${with_ ? ` + ${with_.key}` : ''}` } : step && f.roll.type === 'd20' ? { ...f.roll, bonus: stepped(f.roll.bonus, f.roll.steps?.[step - 1]) } : f.roll;
    const done = rolls.packRoll(card.name, extra ? `${label} (${extra > 0 ? '+' : '−'}${Math.abs(extra)})` : label, spec, (formula) => evalFormula(pack, s, formula, row), asking?.mode ?? modeOf(e), row);
    if (done.change) apply(done.id, done.change);
    asking = null;
  }
  // A row by name: its first plain text with letters (not «melee» in bold, not ◆, not a note).
  const rowName = (f: FieldDef, row: Record<string, unknown>) => String((f.columns ?? []).filter((c) => c.type === 'text' && !c.show).map((c) => row[c.key]).find((v) => typeof v === 'string' && /\p{L}/u.test(v)) ?? Object.values(row).find((v) => typeof v === 'string' && v.trim()) ?? L(f.title));
  const stepped = (bonus: string, step = '0') => `(${bonus}) + (${step})`;
  // The bonuses of a d20 with steps: the first attack, the second, the third.
  const stepsOf = (f: FieldDef, row?: Record<string, unknown>) =>
    f.roll?.type === 'd20' ? ['0', ...(f.roll.steps ?? [])].map((x) => evalFormula(pack, s, stepped((f.roll as { bonus: string }).bonus, x), row)) : [];
  function hit(f: FieldDef, row: Record<string, unknown>, c: ColumnDef, crit: boolean) {
    rolls.damage(card.name, `${rowName(f, row)}${crit ? ' ×2' : ''}`, cellDice(String(row[c.key] ?? '')), crit, c.crit ?? 'dice');
  }
  // An outcome changes the sheet: a field marked at the table, here and now; the log can take it back.
  function apply(id: number, c: { field: string; by: number }) {
    const all = fieldMap(pack);
    const f = all.get(c.field);
    if (!f) return;
    const title = L(f.title);
    if (!marks(f)) return rolls.changed(id, { title, by: c.by });
    // One kind of a track of two: a full track turns light marks heavy.
    const owner = heavyOf(pack, f) ? f : [...all.values()].find((x) => heavyOf(pack, x)?.key === f.key);
    const heavy = owner && heavyOf(pack, owner);
    if (owner && heavy && marks(owner) && marks(heavy)) {
      const was = twoOf(owner, heavy);
      const next = addMarks(was, boxesOf(pack, s, owner), owner === f ? 'light' : 'heavy', c.by);
      setTwo(owner, heavy, next);
      const from = owner === f ? was.light : was.heavy;
      return rolls.changed(id, { title, by: c.by, from, to: owner === f ? next.light : next.heavy, undo: () => setTwo(owner, heavy, was) });
    }
    const from = num(f);
    const to = Math.max(0, Math.min(res?.limits[f.key] ?? 0, from + c.by));
    host?.set(card, f.key, to);
    rolls.changed(id, { title, by: c.by, from, to, undo: () => host?.set(card, f.key, from) });
  }
  // The field whose pool asks for added or taken dice now.
  // with — the second trait picked (pair).
  let asking = $state<{ key: string; row?: Record<string, unknown>; mode: ReturnType<typeof modeOf>; with?: string } | null>(null);
  const pairsOf = (f: FieldDef | undefined) => (f?.roll?.type === 'pool' && f.roll.pair ? pairFields(pack, f.roll.pair, card.kind).filter((x) => x.key !== f.key) : []);
  // −N…+N: the pool's askRange (3 if not set).
  const modsOf = (f: FieldDef | undefined) => {
    const n = f?.roll?.type === 'pool' ? (f.roll.askRange ?? 3) : 3;
    return Array.from({ length: 2 * n + 1 }, (_, i) => i - n);
  };
  // Text with markup: [[links]] open the compendium on the side, {dice} roll.
  const md = (x: string) => entryHtml(x, { dice: true });
  function onText(e: MouseEvent, what: string) {
    const el = e.target as HTMLElement;
    const link = el.closest<HTMLElement>('a.wikilink');
    if (link?.dataset['link']) {
      e.preventDefault();
      return peekEntry(link.dataset['link']);
    }
    const dice = el.closest<HTMLElement>('button.dice');
    if (dice?.dataset['dice']) rolls.damage(card.name, what, dice.dataset['dice']);
  }
  // A paragraph of an ability: its name opens the text, «Bite (Recharge 5–6). In melee…».
  function featureHtml(f: FieldDef, row: Record<string, unknown>, name: string) {
    const rest = shownCols(f).slice(1).filter((c) => c.type === 'text' && hasCell(row[c.key]));
    const marks = rest.map((c) => (c.show === 'note' ? ` <span class="note">(${escape(cell_(row[c.key]))})</span>` : ` ${escape(inlineCell(c, row[c.key]))}`)).join('');
    const head = `<strong><em>${escape(name)}</em></strong>${marks}`;
    const body = md(String(row[longColumn(f)!.key] ?? '').trim());
    return body.startsWith('<p>') ? `<p>${head}. ${body.slice(3)}` : `<p>${head}</p>${body}`;
  }
  // A cell on a line of text: a number with its sign if the column says so.
  const inlineCell = (c: ColumnDef, v: unknown) => (c.signed && typeof v === 'number' ? signedNum(v) : cell_(v));
  const cell_ = (v: unknown) => (Array.isArray(v) ? v.join(', ') : v === undefined || v === null ? '' : String(v));
  // Tabs of the card: remembered while the card is open.
  const split = $derived(tabsOf(sections, lang));
  let tab = $state('');
  const tabNow = $derived(split.tabs.includes(tab) ? tab : (split.tabs[0] ?? ''));
  const shownSections = $derived(split.tabs.length ? [...split.top, ...split.of(tabNow)] : sections);
  // A paragraph with an attack: the number and its damage, the dice in one roll.
  const attackOf = (f: FieldDef, row: Record<string, unknown>) => {
    const main = f.columns?.find((c) => c.type === 'number' && hasCell(row[c.key]));
    return f.roll?.type === 'd20' && main ? Number(row[main.key]) : null;
  };
  const damageOf = (f: FieldDef, row: Record<string, unknown>) => (f.columns ?? []).filter((c) => c.type === 'dice' && hasCell(row[c.key])).map((c) => String(row[c.key]));
  const shownCols = (f: FieldDef) => (f.columns ?? []).filter((c) => c.type !== 'long' && c.show !== 'hidden');
  const visibleCols = (f: FieldDef) => (f.columns ?? []).filter((c) => c.show !== 'hidden');
  const hasCell = (v: unknown) => cell_(v).trim() !== '';
  // The cell a click on a row of a line rolls: its first number, else its last cell.
  const rollCell = (f: FieldDef) => {
    const cols = shownCols(f);
    return cols.find((c) => c.type === 'number') ?? cols.at(-1);
  };
  const inlineValue = (f: FieldDef) => (f.signed ? signedNum(num(f)) : String(Math.round(num(f) * 100) / 100));
  const cell = (v: unknown) => (v === undefined || v === null || v === '' ? t('pack.empty') : String(v));
</script>

{#snippet rowCells(f: FieldDef, row: Record<string, unknown>)}
  {@const main = f.roll ? rollCell(f) : undefined}
  {#each shownCols(f).filter((c) => hasCell(row[c.key])) as c, n (c.key)}{c.show === 'label' ? (n ? ', ' : '') : n ? ' ' : ''}{#if c.show === 'label'}<strong>{L(c.title)}</strong>{' '}{/if}{#if c.key === main?.key}{#each stepsOf(f, row).length ? stepsOf(f, row) : [row[c.key]] as v, i (i)}{i ? ' / ' : ''}<button class="inroll" title={t('pack.rollHint')} onclick={(e) => roll(f, e, row, 0, i)}>{inlineCell(c, v)}</button>{/each}{:else if c.type === 'dice' && cellDice(String(row[c.key]))}<button class="inroll" title={t('pack.rollHint')} onclick={() => hit(f, row, c, false)}>{cellText(String(row[c.key]))}</button>{#if c.crit}{' '}<button class="inroll" title={t('pack.crit')} onclick={() => hit(f, row, c, true)}>×2</button>{/if}{:else if c.show === 'note'}<span class="note">({cell_(row[c.key])})</span>{:else if c.show === 'strong'}<strong>{row[c.key]}</strong>{:else}{inlineCell(c, row[c.key])}{/if}{/each}
{/snippet}

<!-- A track: boxes, marked by a click where the field is marked at the table; of two kinds — light ones slashed,
     heavy ones filled. -->
{#snippet track(f: FieldDef)}
  {@const n = boxesOf(pack, s, f)}
  {@const h = heavyOf(pack, f)}
  {@const m = h ? twoOf(f, h) : { light: num(f), heavy: 0 }}
  {@const edit = marksTrack(f)}
  <span class="boxes" aria-label={h ? `${m.light} + ${m.heavy} / ${n}` : `${m.light} / ${n}`}
    >{#each { length: n } as _, i (i)}{@const at = boxMark(m, i)}{#if edit}<button class="mark" class:on={at === 'heavy' || (!h && at === 'light')} class:slash={!!h && at === 'light'} aria-label={String(i + 1)} onclick={() => markTrack(f, i)}></button>{:else}<i class:on={at === 'heavy' || (!h && at === 'light')} class:slash={!!h && at === 'light'}></i>{/if}{/each}</span>
{/snippet}

{#snippet lineValue(f: FieldDef)}
  {#if f.type === 'list'}
    {#each rows(f) as row, r (r)}{r ? ', ' : ''}{@render rowCells(f, row)}{/each}
  {:else if f.type === 'tags'}
    {tags(f).join(', ')}
  {:else if f.type === 'text'}
    {text(f)}
  {:else if f.type === 'select'}
    {L(f.options?.[s[f.key] as number])}
  {:else if marks(f)}
    {#if f.type === 'track'}
      {@render track(f)}
    {:else if f.type === 'dots'}
      <span class="dots">{#each { length: f.max ?? 5 } as _, i (i)}<button class="mark" class:on={i < num(f)} aria-label={String(i + 1)} onclick={() => mark(f, i)}></button>{/each}</span>
    {:else}
      <span class="stepper">
        <button class="btn" aria-label="−1" onclick={() => step(f, -1)}>−</button>
        <span class="value">{num(f)}{#if f.type === 'formula' || (f.type === 'number' && f.max === undefined)}<span class="of"> / {res?.limits[f.key]}</span>{/if}</span>
        <button class="btn" aria-label="+1" onclick={() => step(f, 1)}>+</button>
      </span>
    {/if}
  {:else if f.type === 'track'}
    {@render track(f)}
  {:else if f.type === 'dots'}
    {@const n = f.max ?? 5}
    <span class="dots" aria-label="{num(f)} / {n}">{#each { length: n } as _, i (i)}<i class:on={i < num(f)}></i>{/each}</span>
  {:else if f.roll}
    <button class="inroll" title={t('pack.rollHint')} onclick={(e) => roll(f, e)}>{inlineValue(f)}</button>
  {:else}
    {inlineValue(f)}
  {/if}
{/snippet}

{#snippet wideField(f: FieldDef)}
    {#if f.type === 'textarea'}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="long md" use:spellLinks={f.links ?? null} onclick={(e) => onText(e, L(f.title))}>{@html md(`**${L(f.title)}.** ${text(f)}`)}</div>
    {:else if f.type === 'tags'}
      <p class="long"><b>{L(f.title)}:</b> {#each tags(f) as tag, i (i)}<span class="tag">{tag}</span>{/each}</p>
    {:else if f.type === 'slots'}
      <div class="slots">
        <b>{L(f.title)}</b>
        {#each slotGroups(f, s[f.key]) as g, gi (gi)}
          <div class="group">
            <span class="faint gname">{L(g.title)}</span>
            {#each g.cells as c (c.i)}
              <span class="slot" class:cond={c.slot.condition} class:empty={!c.slot.name?.trim()}>
                {c.slot.name || '—'}
                {#if c.slot.usage}<i class="usage">{'●'.repeat(c.slot.usage)}</i>{/if}
              </span>
            {/each}
          </div>
        {/each}
      </div>
    {:else}
      <table>
        <thead>
          <tr>{#each visibleCols(f) as c (c.key)}<th>{L(c.title)}</th>{/each}</tr>
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
{/snippet}

{#if pack}
  <article class="sheet">
    {#if asking}
      {@const f = sections.flatMap((x) => x.fields).find((x) => x.key === asking!.key)}
      {@const pairs = pairsOf(f)}
      <div class="ask" role="group">
        {#if pairs.length}
          <span>{t('pack.askWith', { name: f ? L(f.title) : '' })}</span>
          {#each pairs as p (p.key)}<button class="chip" class:picked={asking.with === p.key} onclick={(e) => { asking!.with = asking!.with === p.key ? undefined : p.key; if (f && !(f.roll?.type === 'pool' && f.roll.ask) && asking!.with) roll(f, e, asking!.row); }}>{L(p.title)} {num(p)}</button>{/each}
        {/if}
        {#if f?.roll?.type === 'pool' && f.roll.ask}
          {#if pairs.length}<span class="break"></span>{/if}
          <span>{t('pack.askDice', { name: f ? L(f.title) : '' })}</span>
          {#each modsOf(f) as m (m)}<button class="chip" class:zero={m === 0} onclick={(e) => f && roll(f, e, asking!.row, m)}>{m > 0 ? `+${m}` : m < 0 ? `−${-m}` : '±0'}</button>{/each}
        {:else if f}
          <button class="chip zero" onclick={(e) => f && roll(f, e, asking!.row)}>{t('pack.askAlone')}</button>
        {/if}
        <button class="icon-btn" title={t('pack.askCancel')} onclick={() => (asking = null)}>✕</button>
      </div>
    {/if}
    {#if resets.length}
      <div class="resets">
        {#each resets as r (r.id)}<button class="btn" onclick={() => reset(r.id, L(r.title))}>{L(r.title)}</button>{/each}
      </div>
    {/if}
    {#each shownSections as sec, i (sec.id)}
      {#if split.tabs.length && i === split.top.length}
        <div class="tabs" role="tablist">
          {#each split.tabs as x (x)}<button role="tab" aria-selected={x === tabNow} class:active={x === tabNow} onclick={() => (tab = x)}>{x}</button>{/each}
        </div>
      {/if}
      <section class:lines={sec.view === 'lines' || sec.view === 'grid'} class:titled={!!sec.view && !sec.noTitle}>
        {#if !sec.noTitle}<h3>{L(sec.title)}</h3>{/if}
        {#if sec.view === 'grid' && sec.grid}
          {@const n = sec.grid.columns.length}
          <table class="fields">
            <thead><tr><th></th>{#each sec.grid.columns as c, i (i)}<th>{L(c)}</th>{/each}</tr></thead>
            <tbody>
              {#each sec.grid.rows as r, y (y)}
                <tr>
                  <th>{L(r)}</th>
                  {#each sec.fields.slice(y * n, (y + 1) * n) as f (f.key)}<td>{@render lineValue(f)}</td>{/each}
                </tr>
              {/each}
            </tbody>
          </table>
        {:else if sec.view === 'lines'}
          {#each lineGroups(sec.fields) as line, l (l)}
            {@const first = line[0]!}
            {#if first.chips}
              <div class="chips">{#each tags(first) as tag, i (i)}<span class="chip">{tag}</span>{/each}</div>
            {:else if first.type === 'textarea'}
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
              <div class="md" use:spellLinks={first.links ?? null} onclick={(e) => onText(e, L(first.title))}>{@html md(first.bare ? text(first) : `**${L(first.title)}** ${text(first)}`)}</div>
            {:else if first.type === 'list' && longColumn(first)}
              {#each rows(first) as row, r (r)}
                {@const name = String(row[shownCols(first)[0]?.key ?? ''] ?? '')}
                <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
                <div class="feature" onclick={(e) => onText(e, name)}>
                  <div class="md" use:spellLinks={longColumn(first)!.links ?? null}>{@html featureHtml(first, row, name)}</div>
                  {#if attackOf(first, row) !== null}
                    {@const bonus = attackOf(first, row)!}
                    <div class="attack">
                      <button class="roll-btn" title={t('pack.rollHint')} onclick={(e) => rolls.attack(card.name, name, bonus, damageOf(first, row), modeOf(e))}><Dices size={13} /> {t('pack.attack', { bonus: signedNum(bonus) })}</button>
                      {#each damageOf(first, row) as d, i (i)}<button class="roll-btn" title={t('pack.damageHint')} onclick={(e) => rolls.damage(card.name, name, d, e.shiftKey)}>{d}</button>{/each}
                    </div>
                  {/if}
                </div>
              {/each}
            {:else if first.type === 'list' && first.rowLines}
              {#each rows(first) as row, r (r)}<p class="line">{@render rowCells(first, row)}</p>{/each}
            {:else if aloneOnLine(first)}
              {@render wideField(first)}
            {:else}
              <p class="line">
                {#each line as f, i (f.key)}{i ? (f.join === '(' ? ' (' : `${f.join} `) : ''}{#if !f.bare}<strong>{L(f.title)}</strong>{' '}{/if}{@render lineValue(f)}{i && f.join === '(' ? ')' : ''}{/each}
              </p>
            {/if}
          {/each}
        {:else}
        <div class="grid">
          {#each sec.fields as f (f.key)}
            {#if !wide(f)}
              <svelte:element
                this={f.roll && !marks(f) ? 'button' : 'div'}
                class="field"
                class:rolls={!!f.roll && !marks(f)}
                title={f.roll ? t('pack.rollHint') : L(f.hint)}
                onclick={(e: MouseEvent) => !marks(f) && roll(f, e)}
                role={f.roll && !marks(f) ? undefined : 'group'}
              >
                {#if f.roll && marks(f)}
                  <button class="name title-roll" onclick={(e) => roll(f, e)}>{L(f.title)}</button>
                {:else}
                  <span class="name">{L(f.title)}</span>
                {/if}
                {#if f.type === 'dots'}
                  <span class="dots" aria-label={String(num(f))}>{#each { length: f.max ?? 5 } as _, i (i)}{#if marks(f)}<button class="mark" class:on={i < num(f)} aria-label={String(i + 1)} onclick={() => mark(f, i)}></button>{:else}<i class:on={i < num(f)}></i>{/if}{/each}</span>
                {:else if f.type === 'track'}
                  {@render track(f)}
                {:else if f.type === 'select'}
                  <span class="value">{L(f.options?.[s[f.key] as number])}</span>
                {:else if f.type === 'text'}
                  <span class="value">{text(f)}</span>
                {:else if marks(f)}
                  <span class="stepper">
                    <button class="btn" aria-label="−1" onclick={() => step(f, -1)}>−</button>
                    <span class="value big">{num(f)}{#if f.type === 'formula' || (f.type === 'number' && f.max === undefined)}<span class="of"> / {res?.limits[f.key]}</span>{/if}</span>
                    <button class="btn" aria-label="+1" onclick={() => step(f, 1)}>+</button>
                  </span>
                {:else}
                  <span class="value big">{Math.round(num(f) * 100) / 100}</span>
                {/if}
              </svelte:element>
            {/if}
          {/each}
        </div>
        {#each sec.fields.filter(wide) as f (f.key)}
          {@render wideField(f)}
        {/each}
        {/if}
      </section>
    {/each}
  </article>
{/if}

<style>
  .ask {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
    padding: 6px 8px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    font-size: 12px;
  }
  .ask .chip {
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    font: inherit;
    cursor: pointer;
  }
  .ask .chip.zero {
    border-color: var(--accent);
  }
  .ask .chip.picked {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }
  .ask .break {
    flex-basis: 100%;
  }
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
  }
  .md :global(p) {
    margin: 0 0 4px;
  }
  .md :global(hr) {
    margin: 4px 0;
    border: none;
    border-top: 1px dashed var(--border);
  }
  .md :global(a.wikilink) {
    color: var(--accent);
    text-decoration: underline dotted;
    cursor: pointer;
  }
  .md :global(button.dice) {
    padding: 0 4px;
    border: none;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  section.lines {
    max-width: 720px;
    margin-top: 10px;
    line-height: 1.5;
    user-select: text;
  }
  section.lines:not(:first-child)::before {
    content: '';
    display: block;
    height: 2px;
    margin-bottom: 10px;
    background: linear-gradient(to right, var(--accent), transparent);
    opacity: 0.6;
  }
  section.titled:not(:first-child)::before {
    display: none;
  }
  section.titled h3 {
    margin: 18px 0 6px;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--border);
    color: var(--accent-hover);
    font-size: 15px;
    letter-spacing: 0;
    text-transform: none;
  }
  .line {
    margin: 2px 0;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    margin: 6px 0;
    border-bottom: 1px solid var(--border);
  }
  .tabs button {
    padding: 4px 10px;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--text-muted);
    font: inherit;
    cursor: pointer;
  }
  .tabs button.active {
    border-bottom-color: var(--accent);
    color: var(--text-normal);
  }
  .attack {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: -2px 0 8px;
  }
  table.fields {
    width: 100%;
    max-width: 460px;
    border-collapse: collapse;
    text-align: center;
  }
  table.fields th,
  table.fields td {
    padding: 2px 4px;
    border: 0;
  }
  table.fields thead th {
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 0.05em;
    text-transform: none;
  }
  table.fields tbody th {
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 400;
    text-align: right;
  }
  table.fields tbody tr:first-child td {
    font-size: 15px;
    font-weight: 600;
  }
  /* A number that rolls reads as text and lights up under the mouse. */
  .inroll {
    margin: 0 -2px;
    padding: 0 2px;
    border: 0;
    border-radius: 3px;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .inroll:hover {
    background: var(--accent);
    color: var(--on-accent);
  }
  .roll-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .roll-btn:hover {
    border-color: var(--accent);
    color: var(--text-normal);
  }
  .note {
    color: var(--text-muted);
  }
  .feature {
    margin-bottom: 4px;
  }
  .md :global(.note) {
    color: var(--text-muted);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 6px;
  }
  .chip {
    padding: 0 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    font-size: 12px;
    font-weight: 600;
  }
  .slots {
    margin-top: 8px;
  }
  .group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }
  .gname {
    width: 70px;
    font-size: 11px;
  }
  .slot {
    min-width: 90px;
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    font-size: 13px;
  }
  .slot.empty {
    color: var(--text-faint);
  }
  .slot.cond {
    border-color: var(--danger);
    color: var(--danger);
  }
  .of {
    font-size: 0.7em;
    font-weight: 400;
    color: var(--text-faint);
  }
  .usage {
    margin-left: 4px;
    font-size: 9px;
    font-style: normal;
    letter-spacing: 1px;
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
  .resets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .title-roll {
    padding: 0;
    border: none;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
  /* The number above its buttons: a field of the grid is narrow, on a phone most of all. */
  .stepper {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .stepper .value {
    order: -1;
    flex-basis: 100%;
    white-space: nowrap;
    overflow-wrap: normal;
  }
  .stepper .btn {
    flex: 1;
    min-width: 0;
  }
  /* On a line of a stat block: − 38 / 38 + in the text, not a tile. */
  .line .stepper {
    display: inline-flex;
    flex-wrap: nowrap;
    vertical-align: middle;
  }
  .line .stepper .value {
    order: 0;
    flex-basis: auto;
  }
  .line .stepper .btn {
    flex: none;
    padding: 0 8px;
    line-height: 1.4;
  }
  .mark {
    width: 12px;
    height: 12px;
    padding: 0;
    border: 1px solid var(--accent);
    border-radius: 2px;
    background: none;
    cursor: pointer;
  }
  .dots .mark {
    border-radius: 50%;
  }
  .mark.on {
    background: var(--accent);
  }
  /* A light mark of a track of two kinds: a slash across the box. */
  .boxes i.slash,
  .mark.slash {
    border-color: var(--accent);
    background: linear-gradient(to bottom right, transparent calc(50% - 1px), var(--accent) calc(50% - 1px), var(--accent) calc(50% + 1px), transparent calc(50% + 1px));
  }
  /* Last: it has to outweigh .mark. */
  @media (pointer: coarse) {
    .boxes,
    .dots {
      flex-wrap: wrap;
      gap: 8px;
    }
    .mark {
      width: 26px;
      height: 26px;
      border-radius: 4px;
    }
    .stepper .btn {
      min-height: 36px;
    }
  }
</style>
