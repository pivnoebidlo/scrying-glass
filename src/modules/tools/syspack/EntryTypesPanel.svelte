<!-- The builder: kinds of the system's compendium entries (SystemPack.entryTypes) — skills, moves, spells: a name, a name
     for several, the fields each entry of the kind has. Entries choose their kind on the left of this tab. -->
<script lang="ts">
  import { Plus, Trash2, X } from '@lucide/svelte';
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { keyFrom } from '../../../shared/compendium';
  import { getLang } from '../../../shared/i18n';
  import { loc, type Loc, type PackEntryType, type SystemPack } from '../../../shared/syspack';
  import LocInput from './LocInput.svelte';

  let { pack, disabled = false }: { pack: SystemPack; disabled?: boolean } = $props();

  const list = $derived(pack.entryTypes ?? []);
  const free = (base: string, taken: string[]) => {
    let id = base;
    for (let i = 2; taken.includes(id); i++) id = `${base}${i}`;
    return id;
  };
  function add() {
    const id = free(`${pack.id}-type`, list.map((x) => x.id)).slice(0, 40);
    pack.entryTypes = [...list, { id, title: t('sb.typeNew'), plural: t('sb.typeNewPlural') }];
  }
  function remove(x: PackEntryType) {
    const used = (pack.compendium ?? []).filter((e) => e.type === x.id);
    if (used.length && !confirm(t('sb.typeUsed', { count: used.length }))) return;
    for (const e of used) {
      delete e.type;
      delete e.fields;
    }
    pack.entryTypes = list.filter((y) => y !== x);
  }
  function addField(x: PackEntryType) {
    const fields = x.fields ?? [];
    const key = free(keyFrom(`field ${fields.length + 1}`).slice(0, 28) || 'field', fields.map((f) => f.key));
    x.fields = [...fields, { key, title: t('sb.typeNewField'), kind: 'text' }];
  }
  const L = (x: Loc) => loc(x, getLang());
  function setFilter(x: PackEntryType, f: NonNullable<PackEntryType['fields']>[number], on: boolean) {
    const rest = (x.filters ?? []).filter((y) => y.key !== f.key);
    const next = on ? [...rest, { key: f.key, kind: f.kind === 'bool' ? ('tri' as const) : ('chips' as const) }] : rest;
    if (next.length) x.filters = next;
    else delete x.filters;
  }
</script>

<p class="faint small"><Lead text={t('sb.typesAbout')} /></p>
{#each list as x (x.id)}
  <div class="type">
    <div class="names">
      <label class="row"><span>{t('sb.typeName')}</span><LocInput value={x.title} set={(v) => (x.title = v ?? '')} {disabled} /></label>
      <label class="row"><span>{t('sb.typePlural')}</span><LocInput value={x.plural} set={(v) => (x.plural = v ?? '')} {disabled} /></label>
      <label class="row" title={t('sb.typeLineHint')}><span>{t('sb.typeLine')}</span><LocInput value={x.subtitle} set={(v) => (v ? (x.subtitle = v) : delete x.subtitle)} {disabled} /></label>
      <button class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => remove(x)}><Trash2 size={14} /></button>
    </div>
    {#each x.fields ?? [] as f, i (f.key)}
      <div class="field">
        <LocInput value={f.title} set={(v) => (f.title = v ?? '')} {disabled} />
        <select {disabled} bind:value={f.kind}>
          <option value="text">{t('sb.typeText')}</option>
          <option value="number">{t('sb.typeNumber')}</option>
        </select>
        <label class="check" title={t('sb.typeFilterHint')}><input type="checkbox" {disabled} checked={!!x.filters?.some((y) => y.key === f.key)} onchange={(e) => setFilter(x, f, e.currentTarget.checked)} /> {t('sb.typeFilter')}</label>
        <button class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => (x.fields = x.fields!.filter((_, j) => j !== i))}><X size={13} /></button>
      </div>
    {/each}
    {#if x.fields?.some((f) => f.kind === 'number')}
      <label class="row"><span>{t('sb.typeGroup')}</span>
        <select {disabled} value={x.groupBy?.key ?? ''} onchange={(e) => (e.currentTarget.value ? (x.groupBy = { key: e.currentTarget.value, title: x.groupBy?.title ?? '{n}', ...(x.groupBy?.zero ? { zero: x.groupBy.zero } : {}) }) : delete x.groupBy)}>
          <option value="">{t('sb.typeGroupNone')}</option>
          {#each x.fields.filter((f) => f.kind === 'number') as f (f.key)}<option value={f.key}>{L(f.title)}</option>{/each}
        </select>
      </label>
      {#if x.groupBy}
        {@const g = x.groupBy}
        <label class="row" title={t('sb.typeGroupHint')}><span>{t('sb.typeGroupTitle')}</span><LocInput value={g.title} set={(v) => (g.title = v ?? '{n}')} {disabled} /></label>
      {/if}
    {/if}
    <button class="btn small" {disabled} onclick={() => addField(x)}><Plus size={13} /> {t('sb.typeAddField')}</button>
  </div>
{/each}
<button class="btn small" {disabled} onclick={add}><Plus size={13} /> {t('sb.typeAdd')}</button>

<style>
  .small {
    margin: 0 0 8px;
    font-size: 12px;
  }
  .type {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  .names {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 8px;
    align-items: end;
  }
  .row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .row > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .field {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 110px auto;
    gap: 6px;
    align-items: center;
  }
</style>
