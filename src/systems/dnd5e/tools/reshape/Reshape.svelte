<!-- Tools → Reshape a stat block (D&D): a base card, templates (age, build, people), abilities by hand and other
     weapons; on the right — the stat block as it comes out and what changed. "Create card" opens it in the editor. -->
<script lang="ts">
  import { IdCard, Image, Minus, Plus, RotateCcw, Wand2, X } from '@lucide/svelte';
  import { locale, t } from '../../../../renderer/lib/i18n.svelte';
  import type { Card } from '../../../../shared/cards';
  import { attackBlocks, changesOf, NO_WEAPON, ownTemplate, ownWeapon, POWER_CRS, reshape, templateFits, TEMPLATES, WEAPONS, type Template, type Weapon } from '../../reshape';
  import Slider from '../../../../renderer/lib/Slider.svelte';
  import StatBlock from '../../StatBlock.svelte';
  import { ABILITIES, crText, dict, mod, signed, type Ability, type Dnd5eStats } from '../../stats';
  import { bestiary } from '../../../../modules/bestiary/ui/cards.svelte';
  import CardSearch from '../../../../modules/maps/ui/CardSearch.svelte';
  import { editionOf, loadOwn, own, pickBase, rs } from './store.svelte';
  import OwnTemplates from './OwnTemplates.svelte';
  import OwnWeapons from './OwnWeapons.svelte';
  import { onMount } from 'svelte';

  const base = $derived(rs.base);
  const lang = $derived(base?.lang === 'ru' ? 'ru' : 'en');
  // Labels in the interface language; texts that go into the card — in the card's.
  const L = $derived(dict(locale.lang));
  const ui = $derived(locale.lang === 'ru' ? 'ru' : 'en');
  onMount(loadOwn);
  // The GM's templates (library) beside the built-in ones.
  const owned = $derived(own.list.map(ownTemplate));
  const all = $derived([...TEMPLATES, ...owned]);
  let editOwn = $state(false);
  // The GM's weapons beside the SRD ones (the pickers and the reshape).
  const ownWeapons = $derived(own.weapons.map(ownWeapon));
  const weaponOf = (id: string | undefined): Weapon | undefined => (id ? (WEAPONS.find((x) => x.id === id) ?? ownWeapons.find((x) => x.id === id)) : undefined);
  let editWeapons = $state(false);
  const tpls = $derived(
    rs.r.templates.map((id) => all.find((x) => x.id === id)).filter((x): x is Template => !!x && (!base || templateFits(x, base.stats, owned))),
  );
  const name = $derived(rs.name.trim() || rs.target?.name || (base ? (tpls.length ? `${base.name} (${tpls.map((x) => (x.id.startsWith('own-') ? x.name[lang] : x.name[lang].toLowerCase())).join(', ')})` : base.name) : ''));
  const stats = $derived(base ? reshape($state.snapshot(base.stats) as Dnd5eStats, $state.snapshot(rs.r), lang, editionOf(base.system), owned, $state.snapshot(ownWeapons) as Weapon[]) : null);
  const card = $derived(base && stats ? ({ ...$state.snapshot(base), name, stats } as Card<Dnd5eStats>) : null);
  const attacks = $derived(base ? attackBlocks(base.stats) : []);
  const changes = $derived(base && stats ? changesOf(base.stats, stats, (k) => (k in L.abilities ? L.abilities[k as Ability] : t(`reshape.ch.${k}` as never)), (x) => L.sizes[x] ?? x) : []);
  const touched = $derived(rs.r.cr !== undefined || !!rs.r.added?.length || !!rs.r.gear?.trim() || rs.r.templates.length > 0 || Object.values(rs.r.abilities).some(Boolean) || Object.keys(rs.r.weapons).length > 0 || Object.values(rs.r.names ?? {}).some((x) => x.trim()));

  const GROUPS = ['age', 'build', 'role', 'people'] as const;
  // One template of a group at a time (brawny and frail exclude each other); the GM's go together.
  function toggle(tp: Template) {
    const on = rs.r.templates.includes(tp.id);
    const rest = rs.r.templates.filter((id) => id !== tp.id && (tp.group === 'own' || all.find((x) => x.id === id)?.group !== tp.group));
    rs.r.templates = on ? rest : [...rest, tp.id];
  }
  function bump(a: Ability, d: number) {
    rs.r.abilities[a] = (rs.r.abilities[a] ?? 0) + d;
  }
  // The power slider walks the CRs; the base's own CR clears it.
  const crIndex = (cr: number) => Math.max(0, POWER_CRS.findIndex((x) => x >= cr));
  const shownCr = $derived(rs.r.cr ?? base?.stats.cr ?? 0);
  function setCr(i: number) {
    if (!base) return;
    const cr = POWER_CRS[Math.round(i)] ?? base.stats.cr;
    if (cr === base.stats.cr) delete rs.r.cr;
    else rs.r.cr = cr;
  }
  function setWeapon(key: string, id: string) {
    if (id) rs.r.weapons[key] = id;
    else delete rs.r.weapons[key];
  }
  function addWeapon(id: string) {
    if (id) rs.r.added = [...(rs.r.added ?? []), { weapon: id, attack: true }];
  }
  function cancel() {
    reset();
    rs.base = null;
    rs.ref = null;
    rs.target = null;
  }
  function reset() {
    rs.r = { templates: [], abilities: {}, weapons: {}, names: {} };
    rs.name = '';
  }
  function toCard() {
    if (!base || !stats) return;
    const from = t('reshape.basedOn', { name: base.name });
    if (rs.target) {
      bestiary.createFor(rs.target.portrait, name, {
        system: base.system,
        lang: base.lang,
        // A named character: the base's general description («Commoners include…») would only be noise.
        stats: $state.snapshot(stats),
        notes: from,
      });
      rs.target = null;
      return;
    }
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

{#snippet weaponOptions()}
  <optgroup label="SRD">
    {#each WEAPONS as wp (wp.id)}<option value={wp.id}>{wp.name[ui]} — {wp.dice}{wp.versatile ? ` / ${wp.versatile}` : ''}</option>{/each}
  </optgroup>
  {#if ownWeapons.length}
    <optgroup label={t('reshape.ow.title')}>
      {#each ownWeapons as wp (wp.id)}<option value={wp.id}>{wp.name[ui] || '—'} — {wp.dice}{wp.bonus ? ` +${wp.bonus}` : ''}{wp.extra ? ` + ${wp.extra.dice}` : ''}</option>{/each}
    </optgroup>
  {/if}
{/snippet}

<div class="page">
  <header>
    <h2><Wand2 size={18} /> {t('reshape.title')}</h2>
    <p class="faint">{t('reshape.intro')}</p>
  </header>

  <div class="cols">
    <div class="controls">
      {#if rs.target}
        <section class="target">
          <Image size={14} />
          <span>{t('reshape.forPortrait', { name: rs.target.name })}</span>
          <button class="icon-btn" title={t('reshape.notForPortrait')} onclick={() => (rs.target = null)}><X size={13} /></button>
        </section>
      {/if}
      <section>
        <h3>{t('reshape.base')}</h3>
        {#if base}
          <div class="base">
            <span class="base-name">{base.name}</span>
            <span class="faint">{L.crShort} {crText(base.stats.cr)}</span>
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
                {#each all.filter((x) => x.group === g) as tp (tp.id)}
                  {@const off = !templateFits(tp, base.stats, owned)}
                  <button class="chip" class:active={!off && rs.r.templates.includes(tp.id)} disabled={off} title={off ? t(tp.group === 'age' ? 'reshape.humanoidOnly' : 'reshape.ownPeople') : undefined} onclick={() => toggle(tp)}>{tp.name[ui]}</button>
                {/each}
              </div>
            </div>
          {/each}
          <div class="group">
            <span class="faint label">{t('reshape.group.own')}</span>
            <div class="chips">
              {#each owned.filter((x) => x.group === 'own') as tp (tp.id)}
                <button class="chip" class:active={rs.r.templates.includes(tp.id)} onclick={() => toggle(tp)}>{tp.name[ui] || '—'}</button>
              {/each}
              <button class="chip edit" class:active={editOwn} onclick={() => (editOwn = !editOwn)}>{owned.length ? t('reshape.own.edit') : t('reshape.own.add')}</button>
            </div>
          </div>
        </section>
        {#if editOwn}<OwnTemplates onclose={() => (editOwn = false)} />{/if}

        <section>
          <h3>{t('reshape.power')}</h3>
          <div class="power">
            <span class="faint">{t('reshape.weaker')}</span>
            <span class="slider"><Slider value={crIndex(shownCr)} min={0} max={POWER_CRS.length - 1} step={1} oninput={setCr} /></span>
            <span class="faint">{t('reshape.stronger')}</span>
          </div>
          <p class="cr">
            {L.crShort} {crText(base.stats.cr)}{#if rs.r.cr !== undefined}&nbsp;→ <b>{crText(rs.r.cr)}</b>
              <button class="link" onclick={() => setCr(crIndex(base.stats.cr))}>{t('reshape.asBase')}</button>{/if}
          </p>
          <p class="faint hint">{t('reshape.powerHint')}</p>
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

        <section>
          <h3>{t('reshape.weapons')}</h3>
          {#each attacks as at (at.key)}
            {@const swap = rs.r.weapons[at.key]}
            <div class="attack">
              <div class="weapon">
                <span class:gone={swap === NO_WEAPON}>{at.name}</span>
                <select value={swap ?? ''} onchange={(e) => setWeapon(at.key, e.currentTarget.value)}>
                  <option value="">{t('reshape.keep')}</option>
                  <option value={NO_WEAPON}>{t('reshape.noWeapon')}</option>
                  {@render weaponOptions()}
                </select>
              </div>
              {#if swap !== NO_WEAPON}
                <input
                  class="rename"
                  type="text"
                  title={t('reshape.renameHint')}
                  placeholder={t('reshape.renamePh', { name: (swap && weaponOf(swap)?.name[lang]) || at.name })}
                  value={rs.r.names?.[at.key] ?? ''}
                  oninput={(e) => (rs.r.names = { ...rs.r.names, [at.key]: e.currentTarget.value })}
                />
              {/if}
            </div>
          {/each}
          {#each rs.r.added ?? [] as a, i (i)}
            <div class="attack">
              <div class="weapon added">
                <span>+ {weaponOf(a.weapon)?.name[ui]}</span>
                <label class="faint" title={t('reshape.asAttackHint')}><input type="checkbox" bind:checked={a.attack} /> {t('reshape.asAttack')}</label>
                <button class="icon-btn" title={t('reshape.removeWeapon')} onclick={() => (rs.r.added = rs.r.added!.filter((_, j) => j !== i))}><X size={13} /></button>
              </div>
              <input class="rename" type="text" title={t('reshape.renameHint')} placeholder={t('reshape.renamePh', { name: weaponOf(a.weapon)?.name[lang] ?? '' })} bind:value={a.name} />
            </div>
          {/each}
          <select class="add" value="" onchange={(e) => { addWeapon(e.currentTarget.value); e.currentTarget.value = ''; }}>
            <option value="">{t('reshape.addWeapon')}</option>
            {@render weaponOptions()}
          </select>
          <button class="link own-weapons" onclick={() => (editWeapons = !editWeapons)}>{own.weapons.length ? t('reshape.ow.edit') : t('reshape.ow.add')}</button>
          {#if editWeapons}<OwnWeapons onclose={() => (editWeapons = false)} />{/if}
        </section>

        <section>
          <h3>{t('reshape.gear')}</h3>
          <input type="text" placeholder={t('reshape.gearPh')} bind:value={rs.r.gear} />
        </section>

        <div class="buttons">
          <button class="btn primary" onclick={toCard}><IdCard size={14} /> {t('reshape.toCard')}</button>
          <button class="btn" disabled={!touched} onclick={reset}><RotateCcw size={14} /> {t('reshape.reset')}</button>
          <button class="btn" title={t('reshape.cancelHint')} onclick={cancel}><X size={14} /> {t('reshape.cancel')}</button>
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
  .own-weapons {
    display: block;
    margin: 6px 0 8px;
  }
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
  .target {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-s);
    font-size: 13px;
  }
  .target span {
    flex: 1;
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
  .chip:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .chip.edit {
    border-style: dashed;
    color: var(--text-muted);
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
  .attack {
    margin-bottom: 8px;
  }
  .attack .weapon {
    margin-bottom: 3px;
  }
  .gone {
    text-decoration: line-through;
    opacity: 0.6;
  }
  .rename {
    width: 100%;
    font-size: 12px;
  }
  .weapon.added span {
    font-weight: 500;
  }
  .weapon.added label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }
  select.add {
    width: 100%;
  }
  .power {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .power .slider {
    flex: 1;
  }
  .cr {
    margin: 6px 0 0;
    font-size: 13px;
  }
  .link {
    margin-left: 6px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
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
