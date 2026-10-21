<!-- Tools → Reshape a stat block (D&D): a base card, templates (age, build, people), abilities by hand and other
     weapons; on the right — the stat block as it comes out and what changed. "Create card" opens it in the editor. -->
<script lang="ts">
  import { IdCard, Minus, Plus, RotateCcw, Wand2, X } from '@lucide/svelte';
  import { locale, t } from '../../../renderer/lib/i18n.svelte';
  import type { Card } from '../../../shared/cards';
  import { attackBlocks, changesOf, reshape, TEMPLATES, WEAPONS, type Template } from '../../../systems/dnd5e/reshape';
  import StatBlock from '../../../systems/dnd5e/StatBlock.svelte';
  import { ABILITIES, dict, mod, signed, type Ability, type Dnd5eStats } from '../../../systems/dnd5e/stats';
  import { bestiary } from '../../bestiary/ui/cards.svelte';
  import CardSearch from '../../maps/ui/CardSearch.svelte';
  import { editionOf, pickBase, rs } from './store.svelte';

  const base = $derived(rs.base);
  const lang = $derived(base?.lang === 'ru' ? 'ru' : 'en');
  // Labels in the interface language; texts that go into the card — in the card's.
  const L = $derived(dict(locale.lang));
  const ui = $derived(locale.lang === 'ru' ? 'ru' : 'en');
  const tpls = $derived(rs.r.templates.map((id) => TEMPLATES.find((x) => x.id === id)).filter((x): x is Template => !!x));
  const name = $derived(rs.name.trim() || (base ? (tpls.length ? `${base.name} (${tpls.map((x) => x.name[lang].toLowerCase()).join(', ')})` : base.name) : ''));
  const stats = $derived(base ? reshape($state.snapshot(base.stats) as Dnd5eStats, $state.snapshot(rs.r), lang, editionOf(base.system)) : null);
  const card = $derived(base && stats ? ({ ...$state.snapshot(base), name, stats } as Card<Dnd5eStats>) : null);
  const attacks = $derived(base ? attackBlocks(base.stats) : []);
  const changes = $derived(base && stats ? changesOf(base.stats, stats, (k) => (k in L.abilities ? L.abilities[k as Ability] : t(`reshape.ch.${k}` as never)), (x) => L.sizes[x] ?? x) : []);
  const touched = $derived(rs.r.templates.length > 0 || Object.values(rs.r.abilities).some(Boolean) || Object.keys(rs.r.weapons).length > 0);

  const GROUPS = ['age', 'build', 'people'] as const;
  // One age and one people at a time; builds go together.
  function toggle(tp: Template) {
    const on = rs.r.templates.includes(tp.id);
    const rest = rs.r.templates.filter((id) => id !== tp.id && (tp.group === 'build' || TEMPLATES.find((x) => x.id === id)?.group !== tp.group));
    rs.r.templates = on ? rest : [...rest, tp.id];
  }
  function bump(a: Ability, d: number) {
    rs.r.abilities[a] = (rs.r.abilities[a] ?? 0) + d;
  }
  function setWeapon(key: string, id: string) {
    if (id) rs.r.weapons[key] = id;
    else delete rs.r.weapons[key];
  }
  function reset() {
    rs.r = { templates: [], abilities: {}, weapons: {} };
    rs.name = '';
  }
  function toCard() {
    if (!base || !stats) return;
    const from = t('reshape.basedOn', { name: base.name });
    void bestiary.create(undefined, {
      name,
      kind: base.kind === 'character' ? 'npc' : base.kind,
      lang: base.lang,
      system: base.system,
      stats: $state.snapshot(stats),
      ...(base.description ? { description: base.description } : {}),
      notes: from,
    });
  }
</script>

<div class="page">
  <header>
    <h2><Wand2 size={18} /> {t('reshape.title')}</h2>
    <p class="faint">{t('reshape.intro')}</p>
  </header>

  <div class="cols">
    <div class="controls">
      <section>
        <h3>{t('reshape.base')}</h3>
        {#if base}
          <div class="base">
            <span class="base-name">{base.name}</span>
            <span class="faint">{L.crShort} {base.stats.cr}</span>
            <button class="icon-btn" title={t('reshape.otherBase')} onclick={() => (rs.base = null)}><X size={14} /></button>
          </div>
        {:else}
          <CardSearch placeholder={t('reshape.pickBase')} onpick={(c) => pickBase(c.ref)} />
          <p class="faint hint">{t('reshape.pickHint')}</p>
        {/if}
      </section>

      {#if base}
        <section>
          <h3>{t('reshape.name')}</h3>
          <input type="text" placeholder={name} bind:value={rs.name} />
        </section>

        <section>
          <h3>{t('reshape.templates')}</h3>
          {#each GROUPS as g (g)}
            <div class="group">
              <span class="faint label">{t(`reshape.group.${g}`)}</span>
              <div class="chips">
                {#each TEMPLATES.filter((x) => x.group === g) as tp (tp.id)}
                  <button class="chip" class:active={rs.r.templates.includes(tp.id)} onclick={() => toggle(tp)}>{tp.name[ui]}</button>
                {/each}
              </div>
            </div>
          {/each}
        </section>

        <section>
          <h3>{t('reshape.abilities')}</h3>
          <div class="abilities">
            {#each ABILITIES as a (a)}
              {@const now = stats?.abilities[a] ?? 0}
              {@const was = base.stats.abilities[a]}
              <div class="ab" class:changed={now !== was}>
                <span class="faint">{L.abilities[a]}</span>
                <span class="val">{now} <span class="faint">({signed(mod(now))})</span></span>
                <div class="steps">
                  <button class="icon-btn" title="−1" onclick={() => bump(a, -1)}><Minus size={12} /></button>
                  <button class="icon-btn" title="+1" onclick={() => bump(a, 1)}><Plus size={12} /></button>
                </div>
              </div>
            {/each}
          </div>
        </section>

        {#if attacks.length}
          <section>
            <h3>{t('reshape.weapons')}</h3>
            {#each attacks as at (at.key)}
              <label class="weapon">
                <span>{at.name}</span>
                <select value={rs.r.weapons[at.key] ?? ''} onchange={(e) => setWeapon(at.key, e.currentTarget.value)}>
                  <option value="">{t('reshape.keep')}</option>
                  {#each WEAPONS as wp (wp.id)}<option value={wp.id}>{wp.name[ui]} — {wp.dice}{wp.versatile ? ` / ${wp.versatile}` : ''}</option>{/each}
                </select>
              </label>
            {/each}
          </section>
        {/if}

        <div class="buttons">
          <button class="btn primary" onclick={toCard}><IdCard size={14} /> {t('reshape.toCard')}</button>
          <button class="btn" disabled={!touched} onclick={reset}><RotateCcw size={14} /> {t('reshape.reset')}</button>
        </div>
        <p class="faint hint">{t('reshape.note')}</p>
      {/if}
    </div>

    {#if card}
      <div class="result">
        {#if changes.length}
          <ul class="changes">
            {#each changes as c, i (i)}
              <li><span class="faint">{c.what}</span> {c.from} → <b>{c.to}</b></li>
            {/each}
          </ul>
        {/if}
        <div class="block"><StatBlock {card} /></div>
      </div>
    {/if}
  </div>
</div>

<style>
  .page {
    height: 100%;
    overflow: auto;
    padding: 20px 24px;
  }
  header h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px;
  }
  header p {
    margin: 0 0 16px;
    max-width: 720px;
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .cols {
      grid-template-columns: 1fr;
    }
  }
  section {
    margin-bottom: 16px;
  }
  h3 {
    margin: 0 0 6px;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  input[type='text'] {
    width: 100%;
  }
  .base {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .base-name {
    flex: 1;
    font-weight: 600;
  }
  .hint {
    margin: 6px 0 0;
    font-size: 12px;
  }
  .group {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
  }
  .label {
    width: 70px;
    flex-shrink: 0;
    font-size: 12px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chip {
    padding: 2px 10px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: none;
    color: var(--text-normal);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .chip.active {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }
  .abilities {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .ab {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    font-size: 12px;
  }
  .ab.changed {
    border-color: var(--accent);
  }
  .val {
    font-size: 15px;
    font-weight: 600;
  }
  .steps {
    display: flex;
    gap: 2px;
  }
  .weapon {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 13px;
  }
  .weapon span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .weapon select {
    max-width: 60%;
  }
  .buttons {
    display: flex;
    gap: 8px;
  }
  .changes {
    margin: 0 0 12px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    list-style: none;
    font-size: 13px;
  }
  .block {
    max-width: 720px;
  }
</style>
