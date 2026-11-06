<!-- The builder: the system's own tables, generators, price lists and calculators (SystemPack.kit,
     shared/generators.ts), without recipes in JSON. A table is a text, one row a line; a generator — GeneratorEditor. -->
<script lang="ts">
  import { Plus, Trash2 } from '@lucide/svelte';
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { keyFrom } from '../../../shared/compendium';
  import { getLang } from '../../../shared/i18n';
  import { diceOfRows, genText, rollWords, rowsOfText, textOfRows, type GenTable, type PackKit } from '../../../shared/generators';
  import type { SystemPack } from '../../../shared/syspack';
  import CalcPanel from './CalcPanel.svelte';
  import FormPanel from './FormPanel.svelte';
  import ListPanel from './ListPanel.svelte';
  import GeneratorEditor from './GeneratorEditor.svelte';

  let { pack, disabled = false }: { pack: SystemPack; disabled?: boolean } = $props();

  const lang = $derived(getLang());
  // Read back after writing: the state's proxy of it, what `??=` returns is the plain object.
  function kit(): PackKit {
    pack.kit ??= { tables: {}, generators: [] };
    return pack.kit;
  }
  const gens = $derived(pack.kit?.generators ?? []);
  // The tables of the interface language; a table made here has only them.
  // Sections of price lists are tables too, but their own.
  const priced = $derived(new Set((pack.kit?.lists ?? []).flatMap((l) => l.sections.map((s) => s.table))));
  const tables = $derived(Object.entries(pack.kit?.tables[lang] ?? Object.values(pack.kit?.tables ?? {})[0] ?? {}).filter(([id]) => !priced.has(id)));
  const lists = $derived(pack.kit?.lists ?? []);
  const calcs = $derived(pack.kit?.calculators ?? []);
  const forms = $derived(pack.kit?.forms ?? []);
  type Sel = { kind: 'generator' | 'table' | 'list' | 'calc' | 'form'; id: string } | null;
  let sel = $state<Sel>(null);
  const list = $derived(sel?.kind === 'list' ? lists.find((x) => x.id === sel!.id) : undefined);
  const calc = $derived(sel?.kind === 'calc' ? calcs.find((x) => x.id === sel!.id) : undefined);
  const form = $derived(sel?.kind === 'form' ? forms.find((x) => x.id === sel!.id) : undefined);
  const gen = $derived(sel?.kind === 'generator' ? gens.find((g) => g.id === sel!.id) : undefined);
  const table = $derived(sel?.kind === 'table' ? tables.find(([id]) => id === sel!.id)?.[1] : undefined);

  const titleOf = (id: string, x: GenTable) => x.head[0] || id;
  function freeId(title: string, taken: string[]) {
    const base = (keyFrom(title) || 'item').slice(0, 30);
    let id = /^[a-z]/i.test(base) ? base : `t${base}`;
    for (let i = 2; taken.includes(id); i++) id = `${base}${i}`;
    return id;
  }

  function addTable() {
    const k = kit();
    const name = t('sb.gen.newTable');
    const id = freeId(`table ${tables.length + 1}`, tables.map(([x]) => x));
    k.tables[lang] ??= {};
    k.tables[lang][id] = { head: [name], rows: [] };
    sel = { kind: 'table', id };
  }
  function addGenerator() {
    const k = kit();
    const title = t('sb.gen.newGenerator');
    const id = freeId(`gen ${gens.length + 1}`, gens.map((g) => g.id));
    k.generators.push({ id, title, steps: [] });
    sel = { kind: 'generator', id };
  }
  function addList() {
    const k = kit();
    const id = freeId(`list ${lists.length + 1}`, lists.map((x) => x.id));
    k.lists = [...lists, { id, title: t('sb.list.new'), unit: '{n}', sections: [] }];
    sel = { kind: 'list', id };
  }
  function addCalc() {
    const k = kit();
    const id = freeId(`calc ${calcs.length + 1}`, calcs.map((x) => x.id));
    const labels = { name: t('sb.calc.lName'), kind: t('sb.calc.lKind'), count: t('sb.calc.lCount'), flag: '', flagHint: '', value: t('sb.calc.lValue'), add: t('sb.calc.lAdd'), remove: t('sb.gen.remove') };
    k.calculators = [...calcs, { id, title: t('sb.calc.new'), unit: '{n}', labels, kinds: [], row: { value: 'count * value' }, totals: [{ key: 'total', title: t('sb.calc.lTotal'), formula: 'value', strong: true }] }];
    sel = { kind: 'calc', id };
  }
  function addForm() {
    const k = kit();
    const id = freeId(`form ${forms.length + 1}`, forms.map((x) => x.id));
    k.forms = [...forms, { id, title: t('sb.form.new'), inputs: [], lets: [], results: [{ kind: 'big', text: t('sb.form.newResult') }] }];
    sel = { kind: 'form', id };
  }
  function removeForm(id: string) {
    kit().forms = forms.filter((x) => x.id !== id);
    sel = null;
    tidy();
  }
  function removeList(id: string) {
    const x = lists.find((l) => l.id === id);
    for (const s of x?.sections ?? []) for (const tb of Object.values(kit().tables)) delete tb[s.table];
    kit().lists = lists.filter((l) => l.id !== id);
    sel = null;
    tidy();
  }
  function removeCalc(id: string) {
    kit().calculators = calcs.filter((c) => c.id !== id);
    sel = null;
    tidy();
  }
  function tidy() {
    // An empty kit isn't written at all.
    const k = pack.kit;
    if (k && !k.generators.length && !Object.values(k.tables).some((x) => Object.keys(x).length) && !k.lists?.length && !k.calculators?.length && !k.forms?.length) delete pack.kit;
  }
  const usedBy = (id: string) => JSON.stringify(gens).includes(`"table":"${id}"`);
  function removeTable(id: string) {
    if (usedBy(id)) return void alert(t('sb.gen.usedBy'));
    for (const list of Object.values(kit().tables)) delete list[id];
    sel = null;
    tidy();
  }
  function removeGenerator(id: string) {
    kit().generators = gens.filter((g) => g.id !== id);
    sel = null;
    tidy();
  }

</script>

<p class="faint about"><Lead text={t('sb.gen.about')} /></p>

<div class="panel">
  <div class="side">
    <h4>{t('sb.gen.tables')}</h4>
    {#each tables as [id, x] (id)}
      <button class="item" class:on={sel?.kind === 'table' && sel.id === id} onclick={() => (sel = { kind: 'table', id })}>{titleOf(id, x)} <span class="faint">{x.rows.length}</span></button>
    {/each}
    <button class="btn small" {disabled} onclick={addTable}><Plus size={13} /> {t('sb.gen.newTable')}</button>
    <h4>{t('sb.gen.generators')}</h4>
    {#each gens as g (g.id)}
      <button class="item" class:on={sel?.kind === 'generator' && sel.id === g.id} onclick={() => (sel = { kind: 'generator', id: g.id })}>{genText(g.title, lang)}</button>
    {/each}
    <button class="btn small" {disabled} onclick={addGenerator}><Plus size={13} /> {t('sb.gen.newGenerator')}</button>
    <h4>{t('sb.list.title')}</h4>
    {#each lists as x (x.id)}
      <button class="item" class:on={sel?.kind === 'list' && sel.id === x.id} onclick={() => (sel = { kind: 'list', id: x.id })}>{genText(x.title, lang)}</button>
    {/each}
    <button class="btn small" {disabled} onclick={addList}><Plus size={13} /> {t('sb.list.new')}</button>
    <h4>{t('sb.calc.title')}</h4>
    {#each calcs as x (x.id)}
      <button class="item" class:on={sel?.kind === 'calc' && sel.id === x.id} onclick={() => (sel = { kind: 'calc', id: x.id })}>{genText(x.title, lang)}</button>
    {/each}
    <button class="btn small" {disabled} onclick={addCalc}><Plus size={13} /> {t('sb.calc.new')}</button>
    <h4>{t('sb.form.title')}</h4>
    {#each forms as x (x.id)}
      <button class="item" class:on={sel?.kind === 'form' && sel.id === x.id} onclick={() => (sel = { kind: 'form', id: x.id })}>{genText(x.title, lang)}</button>
    {/each}
    <button class="btn small" {disabled} onclick={addForm}><Plus size={13} /> {t('sb.form.new')}</button>
  </div>

  <div class="main">
    {#if list}
      {#key list.id}<ListPanel {pack} {list} {disabled} onremove={() => removeList(list!.id)} />{/key}
    {:else if form}
      {#key form.id}<FormPanel {pack} {form} {disabled} onremove={() => removeForm(form!.id)} />{/key}
    {:else if calc}
      {#key calc.id}<CalcPanel {pack} {calc} {disabled} onremove={() => removeCalc(calc!.id)} />{/key}
    {:else if table && sel}
      {@const id = sel.id}
      <label class="row"><span>{t('sb.gen.name')}</span><input type="text" {disabled} value={table.head[0] ?? ''} oninput={(e) => (table.head = [e.currentTarget.value])} /></label>
      <label class="row">
        <span>{t('sb.gen.rows')}</span>
        <textarea rows="12" {disabled} placeholder={t('sb.gen.rowsPh').replace(/\\n/g, '\n')} value={textOfRows(table.rows)} onchange={(e) => (table.rows = rowsOfText(e.currentTarget.value))}></textarea>
      </label>
      <p class="faint small">{t('sb.gen.rowsHint')}</p>
      {#if table.rows.length}<p class="small">{diceOfRows(table.rows) ? t('sb.gen.dice', { dice: rollWords(diceOfRows(table.rows), lang) }) : t('sb.gen.anyRow')}</p>{/if}
      <div class="end"><button class="btn" {disabled} onclick={() => removeTable(id)}><Trash2 size={13} /> {t('sb.gen.remove')}</button></div>
    {:else if gen}
      {#key gen.id}<GeneratorEditor {pack} {tables} generator={gen} {disabled} onremove={() => removeGenerator(gen!.id)} />{/key}
    {:else}
      <p class="faint">{tables.length ? t('sb.gen.pick') : t('sb.gen.noneYet')}</p>
    {/if}
  </div>
</div>

<style>
  .about {
    margin: 0 0 12px;
  }
  .panel {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }
  .side {
    display: flex;
    flex: 1 1 200px;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    max-width: 260px;
  }
  .main {
    display: flex;
    flex: 3 1 360px;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  h4 {
    margin: 10px 0 2px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .side h4:first-child {
    margin-top: 0;
  }
  .item {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 8px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--bg-active);
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .row > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  textarea {
    width: 100%;
    resize: vertical;
    font-family: var(--font-mono, monospace);
  }
  .end {
    display: flex;
    justify-content: flex-end;
  }
  .small {
    margin: 0;
    font-size: 12px;
  }
</style>
