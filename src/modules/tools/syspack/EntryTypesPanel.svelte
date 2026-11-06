<!-- The builder: kinds of the system's compendium entries (SystemPack.entryTypes) — skills, moves, spells: a name, a name
     for several, the fields each entry of the kind has. Entries choose their kind on the left of this tab. -->
<script lang="ts">
  import { Plus, Trash2, X } from '@lucide/svelte';
  import Lead from '../../../renderer/lib/Lead.svelte';
  import { t } from '../../../renderer/lib/i18n.svelte';
  import { keyFrom } from '../../../shared/compendium';
  import type { PackEntryType, SystemPack } from '../../../shared/syspack';
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
</script>

<p class="faint small"><Lead text={t('sb.typesAbout')} /></p>
{#each list as x (x.id)}
  <div class="type">
    <div class="names">
      <label class="row"><span>{t('sb.typeName')}</span><LocInput value={x.title} set={(v) => (x.title = v ?? '')} {disabled} /></label>
      <label class="row"><span>{t('sb.typePlural')}</span><LocInput value={x.plural} set={(v) => (x.plural = v ?? '')} {disabled} /></label>
      <button class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => remove(x)}><Trash2 size={14} /></button>
    </div>
    {#each x.fields ?? [] as f, i (f.key)}
      <div class="field">
        <LocInput value={f.title} set={(v) => (f.title = v ?? '')} {disabled} />
        <select {disabled} bind:value={f.kind}>
          <option value="text">{t('sb.typeText')}</option>
          <option value="number">{t('sb.typeNumber')}</option>
        </select>
        <button class="icon-btn" title={t('sb.remove')} {disabled} onclick={() => (x.fields = x.fields!.filter((_, j) => j !== i))}><X size={13} /></button>
      </div>
    {/each}
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
