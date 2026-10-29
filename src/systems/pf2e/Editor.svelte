<!-- The editor of a Pathfinder 2e creature, in the order of the stat block. Lists are typed with commas; dice in a
     damage («1d6+2 slashing») become rolls by themselves. Labels — in the interface language. -->
<script lang="ts">
  import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/svelte';
  import { markdownKeys } from '../../renderer/lib/markdownKeys';
  import { t } from '../../renderer/lib/i18n.svelte';
  import { ABILITIES, SIZES, type ActionCost, type Feature, type Pf2eStats } from './stats';
  import StrikesEditor from './StrikesEditor.svelte';
  import SpellsEditor from './SpellsEditor.svelte';
  import './editor.css';

  let { stats = $bindable() }: { stats: Pf2eStats; system?: string; lang?: string } = $props();

  const RARITIES = ['common', 'uncommon', 'rare', 'unique'] as const;
  const COSTS: { v: string; label: string }[] = [
    { v: '', label: '—' },
    { v: '1', label: '◆' },
    { v: '2', label: '◆◆' },
    { v: '3', label: '◆◆◆' },
    { v: 'reaction', label: '⟲' },
    { v: 'free', label: '◇' },
  ];

  const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);
  const num = (v: string) => {
    const n = Number(v.replace('−', '-').replace('+', ''));
    return v.trim() === '' || isNaN(n) ? 0 : n;
  };
  const costOf = (v: string): ActionCost => (v === '' ? null : v === 'reaction' || v === 'free' ? v : (Number(v) as 1 | 2 | 3));

  function move<T>(arr: T[], i: number, d: -1 | 1) {
    const j = i + d;
    if (j >= 0 && j < arr.length) [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  const rows = (s: string) => Math.min(12, Math.max(2, Math.ceil(s.length / 70) + (s.match(/\n/g)?.length ?? 0)));
  const blankFeature = (): Feature => ({ name: '', actions: null, traits: [], text: '' });
</script>

{#snippet features(arr: Feature[], add: string)}
  {#each arr as f, i (i)}
    <div class="block">
      <div class="head">
        <input class="name" type="text" placeholder={t('pf2e.ed.name')} bind:value={f.name} />
        <select title={t('pf2e.ed.actions')} value={f.actions === null ? '' : String(f.actions)} onchange={(e) => (f.actions = costOf(e.currentTarget.value))}>
          {#each COSTS as c (c.v)}<option value={c.v}>{c.label}</option>{/each}
        </select>
        <input class="traits" type="text" placeholder={t('pf2e.ed.traits')} value={f.traits.join(', ')} onchange={(e) => (f.traits = list(e.currentTarget.value))} />
        <button type="button" class="icon-btn" title={t('pf2e.ed.up')} disabled={i === 0} onclick={() => move(arr, i, -1)}><ArrowUp size={14} /></button>
        <button type="button" class="icon-btn" title={t('pf2e.ed.down')} disabled={i === arr.length - 1} onclick={() => move(arr, i, 1)}><ArrowDown size={14} /></button>
        <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => arr.splice(i, 1)}><Trash2 size={14} /></button>
      </div>
      <textarea use:markdownKeys rows={rows(f.text)} placeholder={t('pf2e.ed.textPh')} bind:value={f.text}></textarea>
    </div>
  {/each}
  <button type="button" class="btn add" onclick={() => arr.push(blankFeature())}><Plus size={14} /> {add}</button>
{/snippet}

<div class="pf2e-ed">
<section>
  <h4>{t('pf2e.ed.basics')}</h4>
  <div class="grid">
    <label class="field small"><span>{t('pf2e.ed.level')}</span><input type="number" min="-1" max="25" bind:value={stats.level} /></label>
    <label class="field">
      <span>{t('pf2e.ed.rarity')}</span>
      <select bind:value={stats.rarity}>{#each RARITIES as r (r)}<option value={r}>{t(`pf2e.rarity.${r}`)}</option>{/each}</select>
    </label>
    <label class="field">
      <span>{t('pf2e.ed.size')}</span>
      <select bind:value={stats.size}>{#each SIZES as s (s)}<option value={s}>{t(`pf2e.size.${s}`)}</option>{/each}</select>
    </label>
    <label class="field wide"><span>{t('pf2e.ed.traits')}</span><input type="text" placeholder="goblin, humanoid" value={stats.traits.join(', ')} onchange={(e) => (stats.traits = list(e.currentTarget.value))} /></label>
  </div>
  <div class="grid">
    <label class="field small"><span>{t('pf2e.sb.perception')}</span><input type="text" value={stats.perception} onchange={(e) => (stats.perception = num(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.ed.senses')}</span><input type="text" placeholder="darkvision, scent (imprecise) 30 feet" value={stats.senses.join(', ')} onchange={(e) => (stats.senses = list(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.sb.languages')}</span><input type="text" placeholder="Common, Goblin" value={stats.languages.join(', ')} onchange={(e) => (stats.languages = list(e.currentTarget.value))} /></label>
  </div>
</section>

<section>
  <h4>{t('pf2e.sb.skills')}</h4>
  <div class="chips">
    {#each stats.skills as sk, i (i)}
      <span class="chip">
        <input class="sk-name" type="text" placeholder={t('pf2e.ed.skill')} bind:value={sk.name} />
        <input class="sk-mod" type="text" value={sk.mod} onchange={(e) => (sk.mod = num(e.currentTarget.value))} />
        <button type="button" class="icon-btn" title={t('pf2e.ed.delete')} onclick={() => stats.skills.splice(i, 1)}><Trash2 size={12} /></button>
      </span>
    {/each}
    <button type="button" class="btn" onclick={() => stats.skills.push({ name: '', mod: 0 })}><Plus size={14} /> {t('pf2e.ed.addSkill')}</button>
  </div>
</section>

<section>
  <h4>{t('pf2e.ed.abilities')}</h4>
  <div class="abilities">
    {#each ABILITIES as a (a)}
      <label class="ability"><span class="abbr">{t(`pf2e.ab.${a}`)}</span><input type="text" value={stats.abilities[a]} onchange={(e) => (stats.abilities[a] = num(e.currentTarget.value))} /></label>
    {/each}
  </div>
  <label class="field wide one"><span>{t('pf2e.sb.items')}</span><input type="text" placeholder="dogslicer, shortbow, leather armor" value={stats.items.join(', ')} onchange={(e) => (stats.items = list(e.currentTarget.value))} /></label>
  {@render features(stats.interaction, t('pf2e.ed.addInteraction'))}
</section>

<section>
  <h4>{t('pf2e.ed.defense')}</h4>
  <div class="grid">
    <label class="field small"><span>{t('pf2e.sb.ac')}</span><input type="number" bind:value={stats.ac} /></label>
    <label class="field small"><span>{t('pf2e.sb.fort')}</span><input type="text" value={stats.saves.fort} onchange={(e) => (stats.saves.fort = num(e.currentTarget.value))} /></label>
    <label class="field small"><span>{t('pf2e.sb.ref')}</span><input type="text" value={stats.saves.ref} onchange={(e) => (stats.saves.ref = num(e.currentTarget.value))} /></label>
    <label class="field small"><span>{t('pf2e.sb.will')}</span><input type="text" value={stats.saves.will} onchange={(e) => (stats.saves.will = num(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.ed.saveNote')}</span><input type="text" placeholder="+1 status to all saves vs. magic" value={stats.saves.note ?? ''} onchange={(e) => (e.currentTarget.value.trim() ? (stats.saves.note = e.currentTarget.value.trim()) : delete stats.saves.note)} /></label>
  </div>
  <div class="grid">
    <label class="field small"><span>{t('pf2e.sb.hp')}</span><input type="number" bind:value={stats.hp} /></label>
    <label class="field wide"><span>{t('pf2e.ed.hpNote')}</span><input type="text" placeholder="regeneration 10 (deactivated by fire)" value={stats.hpNote ?? ''} onchange={(e) => (e.currentTarget.value.trim() ? (stats.hpNote = e.currentTarget.value.trim()) : delete stats.hpNote)} /></label>
  </div>
  <div class="grid">
    <label class="field wide"><span>{t('pf2e.sb.immunities')}</span><input type="text" placeholder="fire, paralyzed" value={stats.immunities.join(', ')} onchange={(e) => (stats.immunities = list(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.sb.weaknesses')}</span><input type="text" placeholder="cold iron 5" value={stats.weaknesses.join(', ')} onchange={(e) => (stats.weaknesses = list(e.currentTarget.value))} /></label>
    <label class="field wide"><span>{t('pf2e.sb.resistances')}</span><input type="text" placeholder="physical 3 (except silver)" value={stats.resistances.join(', ')} onchange={(e) => (stats.resistances = list(e.currentTarget.value))} /></label>
  </div>
  {@render features(stats.defensive, t('pf2e.ed.addDefensive'))}
</section>

<section>
  <h4>{t('pf2e.ed.offense')}</h4>
  <label class="field wide one"><span>{t('pf2e.sb.speed')}</span><input type="text" placeholder="25 feet, climb 20 feet" value={stats.speeds.join(', ')} onchange={(e) => (stats.speeds = list(e.currentTarget.value))} /></label>
  <StrikesEditor bind:strikes={stats.strikes} />
  <SpellsEditor bind:spellcasting={stats.spellcasting} level={stats.level} />

  {@render features(stats.offensive, t('pf2e.ed.addOffensive'))}
</section>
</div>
