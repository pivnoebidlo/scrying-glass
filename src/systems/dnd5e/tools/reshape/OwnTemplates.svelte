<!-- The GM's templates for Reshape a stat block: a list on the left, the picked one on the right — abilities, size,
     speeds, senses, resistances and immunities, saves and skills, traits / actions / reactions, language and subtype.
     Saved by itself into the library (common to all campaigns). -->
<script lang="ts">
  import Lead from '../../../../renderer/lib/Lead.svelte';
  import { Plus, Trash2, X } from '@lucide/svelte';
  import { locale, t } from '../../../../renderer/lib/i18n.svelte';
  import { ABILITIES, dict, SIZES, SPEEDS, type Ability, type Size } from '../../stats';
  import type { OwnTemplate } from '../../reshape';
  import { addOwn, own, removeOwn, saveOwn } from './store.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const L = $derived(dict(locale.lang));
  let picked = $state<string | null>(own.list[0]?.id ?? null);
  const tpl = $derived(own.list.find((x) => x.id === picked) ?? null);
  const OTHER_SPEEDS = SPEEDS.filter((k) => k !== 'walk') as ('fly' | 'swim' | 'climb' | 'burrow')[];
  const DAMAGE = Object.keys(dict('en').damage);
  const SKILLS = Object.keys(dict('en').skills);

  function add() {
    picked = addOwn(t('reshape.own.new'));
  }
  function remove(x: OwnTemplate) {
    if (!confirm(t('reshape.own.deleteQ', { name: x.name }))) return;
    removeOwn(x.id);
    picked = own.list[0]?.id ?? null;
  }
  // A number field: empty or 0 — none.
  const n = (v: string) => (Number(v) ? Number(v) : undefined);
  function setAbility(x: OwnTemplate, a: Ability, v: string) {
    x.abilities = { ...x.abilities, [a]: n(v) };
    saveOwn();
  }
  function toggle(list: string[] | undefined, v: string): string[] {
    const l = list ?? [];
    return l.includes(v) ? l.filter((y) => y !== v) : [...l, v];
  }
</script>

<div class="own">
  <header>
    <h3>{t('reshape.own.title')}</h3>
    <button class="icon-btn" title={t('maps.close')} onclick={onclose}><X size={15} /></button>
  </header>
  <div class="cols">
    <ul class="list">
      {#each own.list as x (x.id)}
        <li><button class:active={x.id === picked} onclick={() => (picked = x.id)}>{x.name || '—'}</button></li>
      {/each}
      <li><button class="add" onclick={add}>{t('reshape.own.add')}</button></li>
    </ul>

    {#if tpl}
      <div class="form">
        <div class="row">
          <input class="name" type="text" bind:value={tpl.name} oninput={saveOwn} placeholder={t('reshape.own.namePh')} />
          <button class="icon-btn" title={t('reshape.own.delete')} onclick={() => remove(tpl)}><Trash2 size={14} /></button>
        </div>

        <label class="people" title={t('reshape.own.peopleHint')}>
          <input type="checkbox" bind:checked={tpl.people} onchange={saveOwn} /> {t('reshape.own.people')}
        </label>

        <span class="label">{t('reshape.abilities')}</span>
        <div class="abilities">
          {#each ABILITIES as a (a)}
            <label><span class="faint">{L.abilities[a]}</span><input type="number" min="-10" max="10" value={tpl.abilities?.[a] ?? ''} placeholder="0" onchange={(e) => setAbility(tpl, a, e.currentTarget.value)} /></label>
          {/each}
        </div>

        <div class="grid">
          <label><span class="label">{t('reshape.ch.size')}</span>
            <select value={tpl.size ?? ''} onchange={(e) => { tpl.size = (e.currentTarget.value || undefined) as Size | undefined; saveOwn(); }}>
              <option value="">{t('reshape.own.asBase')}</option>
              {#each SIZES as sz (sz)}<option value={sz}>{L.sizes[sz]}</option>{/each}
            </select>
          </label>
          <label><span class="label">{t('reshape.own.walk')}</span>
            <input type="number" min="0" step="5" value={tpl.speed ?? ''} placeholder="—" onchange={(e) => { tpl.speed = n(e.currentTarget.value); saveOwn(); }} />
          </label>
          {#each OTHER_SPEEDS as k (k)}
            <label><span class="label">{L.speed[k]}</span>
              <input type="number" min="0" step="5" value={tpl.speeds?.[k] ?? ''} onchange={(e) => { tpl.speeds = { ...tpl.speeds, [k]: n(e.currentTarget.value) }; saveOwn(); }} />
            </label>
          {/each}
          <label><span class="label">{L.senses.darkvision}</span>
            <input type="number" min="0" step="10" value={tpl.darkvision ?? ''} onchange={(e) => { tpl.darkvision = n(e.currentTarget.value); saveOwn(); }} />
          </label>
        </div>

        <span class="label">{t('reshape.own.resist')}</span>
        <div class="chips">
          {#each DAMAGE as d (d)}
            <button class="chip" class:active={tpl.resistances?.includes(d)} onclick={() => { tpl.resistances = toggle(tpl.resistances, d); saveOwn(); }}>{L.damage[d]}</button>
          {/each}
        </div>
        <span class="label">{t('reshape.own.immune')}</span>
        <div class="chips">
          {#each DAMAGE as d (d)}
            <button class="chip" class:active={tpl.immunities?.includes(d)} onclick={() => { tpl.immunities = toggle(tpl.immunities, d); saveOwn(); }}>{L.damage[d]}</button>
          {/each}
        </div>
        <span class="label">{t('reshape.own.saves')}</span>
        <div class="chips">
          {#each ABILITIES as a (a)}
            <button class="chip" class:active={tpl.saves?.includes(a)} onclick={() => { tpl.saves = toggle(tpl.saves, a) as Ability[]; saveOwn(); }}>{L.abilities[a]}</button>
          {/each}
        </div>
        <span class="label">{t('reshape.own.skills')}</span>
        <div class="chips">
          {#each SKILLS as k (k)}
            <button class="chip" class:active={tpl.skills?.includes(k)} onclick={() => { tpl.skills = toggle(tpl.skills, k); saveOwn(); }}>{L.skills[k]}</button>
          {/each}
        </div>

        <span class="label">{t('reshape.own.blocks')}</span>
        {#each tpl.blocks ?? [] as b, i (i)}
          <div class="block">
            <div class="row">
              <select bind:value={b.list} onchange={saveOwn}>
                <option value="traits">{t('reshape.own.trait')}</option>
                <option value="actions">{t('reshape.own.action')}</option>
                <option value="reactions">{t('reshape.own.reaction')}</option>
              </select>
              <input type="text" bind:value={b.name} oninput={saveOwn} placeholder={t('reshape.own.blockName')} />
              <button class="icon-btn" title={t('reshape.removeWeapon')} onclick={() => { tpl.blocks = tpl.blocks!.filter((_, j) => j !== i); saveOwn(); }}><X size={13} /></button>
            </div>
            <textarea rows="2" bind:value={b.text} oninput={saveOwn} placeholder={t('reshape.own.blockText')}></textarea>
          </div>
        {/each}
        <button class="btn" onclick={() => { tpl.blocks = [...(tpl.blocks ?? []), { list: 'traits', name: '', text: '' }]; saveOwn(); }}><Plus size={13} /> {t('reshape.own.addBlock')}</button>

        <div class="grid two">
          <label><span class="label">{t('reshape.own.language')}</span><input type="text" bind:value={tpl.language} oninput={saveOwn} /></label>
          <label><span class="label">{t('reshape.own.subtype')}</span><input type="text" bind:value={tpl.subtype} oninput={saveOwn} placeholder={t('reshape.own.subtypePh')} /></label>
        </div>
        <p class="faint hint"><Lead text={t('reshape.own.hint')} /></p>
      </div>
    {:else}
      <p class="faint hint">{t('reshape.own.none')}</p>
    {/if}
  </div>
</div>

<style>
  .own {
    margin-bottom: 16px;
    padding: 10px 12px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-s);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h3 {
    margin: 0;
    font-size: 13px;
  }
  /* The list as a row of names above the form: the page column is narrow. */
  .cols {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
  }
  .list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list button {
    padding: 3px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    font: inherit;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
  }
  .list button.active {
    border-color: var(--accent);
    font-weight: 600;
  }
  .list .add {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--accent);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .row input {
    flex: 1;
    min-width: 0;
  }
  .people {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .label {
    color: var(--text-muted);
    font-size: 11px;
  }
  .abilities {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .abilities label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }
  .grid label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
  }
  .abilities input {
    width: 100%;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .grid.two {
    grid-template-columns: 1fr 1fr;
  }
  .grid input,
  .grid select {
    width: 100%;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .chip {
    padding: 1px 8px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: none;
    color: var(--text-normal);
    font: inherit;
    font-size: 11px;
    cursor: pointer;
  }
  .chip.active {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }
  .block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .block textarea {
    width: 100%;
    resize: vertical;
  }
  .hint {
    margin: 4px 0 0;
    font-size: 12px;
  }
</style>
