<!-- The editor of a Pathfinder 2e character's sheet (usually from Pathbuilder; here — by hand or to correct it): who they
     are, attributes, defenses and checks, skills by rank (or recounted from ranks: proficiency + level + attribute),
     strikes and spells (shared with the creature editor), feats, gear and money. -->
<script lang="ts">
  import { Plus, Trash2 } from '@lucide/svelte';
  import { t } from '../../renderer/lib/i18n.svelte';
  import { ABILITIES, SIZES, signed } from './stats';
  import { RANKS, type Pf2eCharacter } from './character';
  import { SKILLS } from './pathbuilder';
  import StrikesEditor from './StrikesEditor.svelte';
  import SpellsEditor from './SpellsEditor.svelte';
  import './editor.css';

  let { stats = $bindable() }: { stats: Pf2eCharacter; system?: string; lang?: string } = $props();

  const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
  const num = (v: string) => {
    const n = Number(v.replace('−', '-').replace('+', ''));
    return v.trim() === '' || isNaN(n) ? 0 : n;
  };
  const SKILL_ATTR = new Map(SKILLS.map(([k, a]) => [k, a]));
  // A skill's attribute: by its name; a Lore — Int.
  const attrOf = (name: string) => SKILL_ATTR.get(name.toLowerCase()) ?? 'int';
  const counted = (name: string, rank: number) => (rank > 0 ? rank * 2 + stats.level : 0) + stats.abilities[attrOf(name)];
  function recount() {
    for (const sk of stats.skills) sk.mod = counted(sk.name, sk.rank);
  }
  // A new sheet gets the sixteen skills, untrained.
  function addAll() {
    for (const [k] of SKILLS) {
      const name = k.charAt(0).toUpperCase() + k.slice(1);
      if (!stats.skills.some((s) => s.name === name)) stats.skills.push({ name, rank: 0, mod: counted(name, 0) });
    }
  }
</script>

<div class="pf2e-ed">
  <section>
    <h4>{t('pf2e.ed.who')}</h4>
    <div class="grid">
      <label class="field wide"><span>{t('pf2e.ed.class')}</span><input type="text" placeholder="Fighter" bind:value={stats.class} /></label>
      <label class="field small"><span>{t('pf2e.ed.level')}</span><input type="number" min="1" max="20" bind:value={stats.level} /></label>
      <label class="field">
        <span>{t('pf2e.ed.key')}</span>
        <select bind:value={stats.keyAttribute}>{#each ABILITIES as a (a)}<option value={a}>{t(`pf2e.ab.${a}`)}</option>{/each}</select>
      </label>
    </div>
    <div class="grid">
      <label class="field wide"><span>{t('cmp.type.pf2e-ancestry')}</span><input type="text" placeholder="Elf" bind:value={stats.ancestry} /></label>
      <label class="field wide"><span>{t('cmp.type.pf2e-heritage')}</span><input type="text" placeholder="Cavern Elf" bind:value={stats.heritage} /></label>
      <label class="field wide"><span>{t('pf2e.ed.background')}</span><input type="text" placeholder="Acolyte" bind:value={stats.background} /></label>
    </div>
    <div class="grid">
      <label class="field">
        <span>{t('pf2e.ed.size')}</span>
        <select bind:value={stats.size}>{#each SIZES as s (s)}<option value={s}>{t(`pf2e.size.${s}`)}</option>{/each}</select>
      </label>
      <label class="field wide"><span>{t('pf2e.sb.languages')}</span><input type="text" placeholder="Common, Elven" value={stats.languages.join(', ')} onchange={(e) => (stats.languages = list(e.currentTarget.value))} /></label>
    </div>
  </section>

  <section>
    <h4>{t('pf2e.ed.abilities')}</h4>
    <div class="abilities">
      {#each ABILITIES as a (a)}
        <label class="ability"><span class="abbr">{t(`pf2e.ab.${a}`)}</span><input type="text" value={stats.abilities[a]} onchange={(e) => (stats.abilities[a] = num(e.currentTarget.value))} /></label>
      {/each}
    </div>
  </section>

  <section>
    <h4>{t('pf2e.ed.defense')}</h4>
    <div class="grid">
      <label class="field small"><span>{t('pf2e.sb.ac')}</span><input type="number" bind:value={stats.ac} /></label>
      <label class="field small"><span>{t('pf2e.sb.hp')}</span><input type="number" bind:value={stats.hp} /></label>
      <label class="field small"><span>{t('pf2e.sb.perception')}</span><input type="text" value={stats.perception} onchange={(e) => (stats.perception = num(e.currentTarget.value))} /></label>
      <label class="field small"><span>{t('pf2e.sb.fort')}</span><input type="text" value={stats.saves.fort} onchange={(e) => (stats.saves.fort = num(e.currentTarget.value))} /></label>
      <label class="field small"><span>{t('pf2e.sb.ref')}</span><input type="text" value={stats.saves.ref} onchange={(e) => (stats.saves.ref = num(e.currentTarget.value))} /></label>
      <label class="field small"><span>{t('pf2e.sb.will')}</span><input type="text" value={stats.saves.will} onchange={(e) => (stats.saves.will = num(e.currentTarget.value))} /></label>
      <label class="field small"><span>{t('pf2e.sh.classDC')}</span><input type="number" bind:value={stats.classDC} /></label>
      <label class="field small"><span>{t('pf2e.sb.speed')}</span><input type="number" bind:value={stats.speed} /></label>
    </div>
  </section>

  <section>
    <h4>{t('pf2e.sb.skills')}</h4>
    <div class="chips">
      {#each stats.skills as sk, i (i)}
        <span class="chip">
          <select class="rank" title={t(`pf2e.sh.rank.${RANKS[sk.rank] ?? 'U'}`)} value={sk.rank} onchange={(e) => ((sk.rank = Number(e.currentTarget.value)), (sk.mod = counted(sk.name, sk.rank)))}>
            {#each RANKS as r, n (r)}<option value={n}>{r}</option>{/each}
          </select>
          <input class="sk-name" type="text" placeholder={t('pf2e.ed.skill')} bind:value={sk.name} />
          <input class="sk-mod" type="text" title={signed(counted(sk.name, sk.rank))} value={sk.mod} onchange={(e) => (sk.mod = num(e.currentTarget.value))} />
          <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => stats.skills.splice(i, 1)}><Trash2 size={12} /></button>
        </span>
      {/each}
      <button type="button" class="btn" onclick={() => stats.skills.push({ name: '', rank: 1, mod: 0 })}><Plus size={14} /> {t('pf2e.ed.addSkill')}</button>
      {#if stats.skills.length < SKILLS.length}<button type="button" class="btn" onclick={addAll}>{t('pf2e.ed.allSkills')}</button>{/if}
      <button type="button" class="btn" title={t('pf2e.ed.recountHint')} onclick={recount}>{t('pf2e.ed.recount')}</button>
    </div>
  </section>

  <section>
    <h4>{t('pf2e.ed.offense')}</h4>
    <StrikesEditor bind:strikes={stats.strikes} />
    <SpellsEditor bind:spellcasting={stats.spellcasting} level={stats.level} />
  </section>

  <section>
    <h4>{t('pf2e.sh.feats')}</h4>
    {#each stats.feats as f, i (i)}
      <div class="rank">
        <input class="bonus" type="number" min="1" max="20" title={t('pf2e.ed.level')} bind:value={f.level} />
        <input class="spells" type="text" placeholder={t('pf2e.ed.name')} bind:value={f.name} />
        <input class="spells" type="text" placeholder={t('pf2e.ed.featType')} bind:value={f.type} />
        <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => stats.feats.splice(i, 1)}><Trash2 size={12} /></button>
      </div>
    {/each}
    <button type="button" class="btn add" onclick={() => stats.feats.push({ name: '', type: '', level: stats.level })}><Plus size={14} /> {t('pf2e.ed.addFeat')}</button>
  </section>

  <section>
    <h4>{t('pf2e.sh.equipment')}</h4>
    <label class="field wide one"><span>{t('pf2e.sh.equipment')}</span><input type="text" placeholder="Longsword, Leather Armor, Backpack" value={stats.equipment.join(', ')} onchange={(e) => (stats.equipment = list(e.currentTarget.value))} /></label>
    <div class="grid">
      {#each ['pp', 'gp', 'sp', 'cp'] as const as k (k)}
        <label class="field small"><span>{k}</span><input type="number" min="0" bind:value={stats.money[k]} /></label>
      {/each}
    </div>
  </section>
</div>
