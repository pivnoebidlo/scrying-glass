<!-- Редактор листа персонажа игрока D&D 5e. Что считается само (бонус мастерства, инициатива, СЛ заклинаний,
     бонусы навыков), показано подсказкой в пустом поле; вписанное число заменяет расчёт. -->
<script lang="ts">
  import { markdownKeys } from '../../renderer/lib/markdownKeys';
  import { locale, t } from '../../renderer/lib/i18n.svelte';
  import { labels } from '../../shared/i18n';
  import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/svelte';
  import { ABILITIES, SIZES, SKILL_ABILITY, dict, mod, signed, type Ability, type Size } from './stats';
  import {
    CHARACTER_TEXTS, characterInitiative, characterPb, saveBonus, skillBonus, totalLevel, type CharacterText, type Dnd5eCharacter,
  } from './character';

  let { stats = $bindable() }: { stats: Dnd5eCharacter; system: string } = $props();

  const lb = $derived(dict(locale.lang));
  const ABILITY_NAMES = labels<Ability>(ABILITIES, 'dnd.ability');
  const DETAILS = labels(['age', 'height', 'weight', 'eyes', 'skin', 'hair'] as const, 'dnd.detail');
  const COINS = labels(['pp', 'gp', 'ep', 'sp', 'cp'] as const, 'dnd.coin');
  // Placeholders: only some texts have one.
  const TEXT_PH: Partial<Record<CharacterText, string>> = labels(['features', 'traits', 'proficiencies', 'equipment', 'attacks', 'background', 'quests'], 'dnd.textPh');
  const TEXT_TITLES = labels<CharacterText>(CHARACTER_TEXTS, 'dnd.text');
  const alignments = $derived(t('dnd.alignments').split('|'));

  // Число из поля или undefined, если поле пустое.
  const num = (v: string) => {
    const n = Number(v.replace('−', '-').replace('+', ''));
    return v.trim() === '' || isNaN(n) ? undefined : n;
  };
  const rows = (s: string | undefined) => Math.min(16, Math.max(2, Math.ceil((s?.length ?? 0) / 80) + (s?.match(/\n/g)?.length ?? 0)));

  function setOptional<K extends 'xp' | 'initiative' | 'pb'>(k: K, v: string) {
    const n = num(v);
    if (n === undefined) delete stats[k];
    else stats[k] = n;
  }

  function toggleSave(a: Ability, on: boolean) {
    stats.saves = on ? [...new Set([...stats.saves, a])] : stats.saves.filter((x) => x !== a);
  }

  function setSkill(skill: string, level: 0 | 1 | 2) {
    if (level) stats.skills[skill] = level;
    else delete stats.skills[skill];
  }

  function setDetail(k: keyof typeof DETAILS, v: string) {
    stats.details ??= {};
    if (v.trim()) stats.details[k] = v.trim();
    else delete stats.details[k];
  }

  function setCoin(k: keyof typeof COINS, v: string) {
    stats.coins ??= {};
    const n = num(v);
    if (n) stats.coins[k] = n;
    else delete stats.coins[k];
  }

  function setText(k: CharacterText, v: string) {
    if (v.trim()) stats.text[k] = v;
    else delete stats.text[k];
  }

  function move<T>(list: T[], i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
  }

  // Заклинания: уровни, которые показываем — заговоры, уровни с ячейками или списком, и добавленные.
  let extraLevels = $state<string[]>([]);
  const spellLevels = $derived.by(() => {
    const sc = stats.spellcasting;
    if (!sc) return [];
    return [...new Set(['0', ...Object.keys(sc.slots), ...Object.keys(sc.spells), ...extraLevels])].sort((a, b) => Number(a) - Number(b));
  });

  function setSlots(level: string, v: string) {
    if (!stats.spellcasting) return;
    const n = num(v);
    if (n) stats.spellcasting.slots[level] = n;
    else delete stats.spellcasting.slots[level];
  }

  function setSpells(level: string, v: string) {
    if (!stats.spellcasting) return;
    if (v.trim()) stats.spellcasting.spells[level] = v;
    else delete stats.spellcasting.spells[level];
  }

  function setSpellNumber(k: 'dc' | 'attack', v: string) {
    if (!stats.spellcasting) return;
    const n = num(v);
    if (n === undefined) delete stats.spellcasting[k];
    else stats.spellcasting[k] = n;
  }

  const pb = $derived(characterPb({ ...stats, pb: undefined }));
</script>

<datalist id="dnd-char-alignments">{#each alignments as a (a)}<option value={a}></option>{/each}</datalist>

<section>
  <h4>{t('dnd.ce.character')}</h4>
  <div class="grid">
    <label class="field wide"><span>{t('dnd.ce.race')}</span><input type="text" placeholder={t('dnd.ce.racePh')} bind:value={stats.race} /></label>
    <label class="field wide"><span>{t('dnd.diff.background')}</span><input type="text" placeholder={t('dnd.ce.backgroundPh')} bind:value={stats.background} /></label>
    <label class="field wide">
      <span>{t('dnd.alignment')}</span><input type="text" list="dnd-char-alignments" placeholder={t('dnd.ce.alignmentPh')} bind:value={stats.alignment} />
    </label>
  </div>
  <div class="grid">
    <label class="field wide"><span>{t('dnd.player')}</span><input type="text" placeholder={t('dnd.ce.playerPh')} bind:value={stats.player} /></label>
    <label class="field small">
      <span>{t('dnd.xp')}</span><input type="number" value={stats.xp ?? ''} onchange={(e) => setOptional('xp', e.currentTarget.value)} />
    </label>
    <label class="field">
      <span>{t('dnd.size')}</span>
      <select value={stats.size ?? 'medium'} onchange={(e) => (stats.size = e.currentTarget.value as Size)}>
        {#each SIZES as s (s)}<option value={s}>{lb.sizes[s]}</option>{/each}
      </select>
    </label>
  </div>
  <div class="grid">
    {#each Object.entries(DETAILS) as [k, l] (k)}
      <label class="field small">
        <span>{l}</span>
        <input type="text" value={stats.details?.[k as keyof typeof DETAILS] ?? ''} onchange={(e) => setDetail(k as keyof typeof DETAILS, e.currentTarget.value)} />
      </label>
    {/each}
  </div>
</section>

<section>
  <h4>{t('dnd.ce.classes')} <span class="hint">{t('dnd.ce.level', { n: totalLevel(stats) })}</span></h4>
  {#each stats.classes as c, i (i)}
    <div class="row-line">
      <input class="grow" type="text" placeholder={t('dnd.ce.classPh')} bind:value={c.name} />
      <input class="grow" type="text" placeholder={t('dnd.ce.subclassPh')} bind:value={c.subclass} />
      <input class="lvl" type="number" min="1" max="20" title={t('dnd.ce.classLevelHint')} bind:value={c.level} />
      <button type="button" class="icon-btn" title={t('dnd.ce.removeClass')} disabled={stats.classes.length === 1} onclick={() => stats.classes.splice(i, 1)}><Trash2 size={14} /></button>
    </div>
  {/each}
  <button type="button" class="btn" onclick={() => stats.classes.push({ name: '', level: 1 })}><Plus size={14} /> {t('dnd.ce.multiclass')}</button>
</section>

<section>
  <h4>{t('dnd.ce.abilitiesSaves')}</h4>
  <div class="abilities">
    {#each ABILITIES as a (a)}
      <div class="ability">
        <span class="abbr" title={ABILITY_NAMES[a]}>{lb.abilities[a]}</span>
        <input type="number" bind:value={stats.abilities[a]} />
        <span class="faint">{signed(mod(stats.abilities[a]))}</span>
        <label class="save" title={t('dnd.saveHint')}>
          <input type="checkbox" checked={stats.saves.includes(a)} onchange={(e) => toggleSave(a, e.currentTarget.checked)} />
          {t('dnd.sh.save', { n: signed(saveBonus(stats, a)) })}
        </label>
      </div>
    {/each}
  </div>
</section>

<section>
  <h4>{t('dnd.skills')}</h4>
  <div class="skills">
    {#each Object.entries(SKILL_ABILITY).sort((a, b) => (lb.skills[a[0]] ?? '').localeCompare(lb.skills[b[0]] ?? '', 'ru')) as [k, a] (k)}
      {@const level = stats.skills[k] ?? 0}
      <div class="skill">
        <span class="sname">{lb.skills[k]} <span class="faint">{lb.abilities[a]}</span></span>
        <span class="seg" role="group">
          <button type="button" class:on={level === 0} title={t('dnd.ce.noProf')} onclick={() => setSkill(k, 0)}>—</button>
          <button type="button" class:on={level === 1} title={t('dnd.proficiency')} onclick={() => setSkill(k, 1)}>{t('dnd.ce.profShort')}</button>
          <button type="button" class:on={level === 2} title={t('dnd.ce.expertiseHint')} onclick={() => setSkill(k, 2)}>{t('dnd.ce.expShort')}</button>
        </span>
        <span class="sb">{signed(skillBonus(stats, k, a))}</span>
      </div>
    {/each}
  </div>
</section>

<section>
  <h4>{t('dnd.ce.combat')}</h4>
  <div class="grid">
    <label class="field small"><span>{t('dnd.ac')}</span><input type="number" bind:value={stats.ac} /></label>
    <label class="field small"><span>{t('dnd.ce.maxHp')}</span><input type="number" bind:value={stats.hpMax} /></label>
    <label class="field small"><span>{t('dnd.hitDie')}</span><input type="text" placeholder="1d8" bind:value={stats.hitDie} /></label>
    <label class="field small"><span>{t('dnd.ce.speedFt')}</span><input type="number" bind:value={stats.speed} /></label>
    <label class="field small">
      <span>{t('dnd.initiative')}</span>
      <input
        type="text"
        placeholder="{signed(characterInitiative({ ...stats, initiative: undefined }))} ({lb.abilities.dex})"
        value={stats.initiative === undefined ? '' : signed(stats.initiative)}
        onchange={(e) => setOptional('initiative', e.currentTarget.value)}
      />
    </label>
    <label class="field small">
      <span>{t('dnd.pbFull')}</span>
      <input
        type="text"
        placeholder={t('dnd.ce.pbPh', { n: signed(pb) })}
        value={stats.pb === undefined ? '' : signed(stats.pb)}
        onchange={(e) => setOptional('pb', e.currentTarget.value)}
      />
    </label>
    <label class="check"><input
        type="checkbox"
        checked={!!stats.inspiration}
        onchange={(e) => (e.currentTarget.checked ? (stats.inspiration = true) : delete stats.inspiration)}
      /> {t('dnd.ce.inspiration')}</label>
  </div>
</section>

<section>
  <h4>{t('dnd.attacks')}</h4>
  {#each stats.attacks as a, i (i)}
    <div class="row-line">
      <input class="grow" type="text" placeholder={t('dnd.ce.attackPh')} bind:value={a.name} />
      <input class="short" type="text" placeholder="+5" title={t('dnd.ce.bonusHint')} bind:value={a.bonus} />
      <input class="grow" type="text" placeholder={t('dnd.ce.damagePh')} title={t('dnd.ce.damage')} bind:value={a.damage} />
      <input class="grow" type="text" placeholder={t('dnd.ce.notePh')} bind:value={a.notes} />
      <button type="button" class="icon-btn" title={t('dnd.up')} disabled={i === 0} onclick={() => move(stats.attacks, i, -1)}><ArrowUp size={14} /></button>
      <button type="button" class="icon-btn" title={t('dnd.down')} disabled={i === stats.attacks.length - 1} onclick={() => move(stats.attacks, i, 1)}><ArrowDown size={14} /></button>
      <button type="button" class="icon-btn" title={t('dnd.delete')} onclick={() => stats.attacks.splice(i, 1)}><Trash2 size={14} /></button>
    </div>
  {/each}
  <button type="button" class="btn" onclick={() => stats.attacks.push({ name: '', bonus: '', damage: '' })}><Plus size={14} /> {t('dnd.ce.attack')}</button>
</section>

<section>
  <h4>{t('dnd.spells')}</h4>
  {#if stats.spellcasting}
    {@const sc = stats.spellcasting}
    <div class="grid">
      <label class="field">
        <span>{t('dnd.ce.ability')}</span>
        <select bind:value={sc.ability}>
          {#each ABILITIES as a (a)}<option value={a}>{ABILITY_NAMES[a]}</option>{/each}
        </select>
      </label>
      <label class="field small">
        <span>{t('dnd.ce.dc')}</span>
        <input type="text" placeholder={String(8 + characterPb(stats) + mod(stats.abilities[sc.ability]))} value={sc.dc ?? ''} onchange={(e) => setSpellNumber('dc', e.currentTarget.value)} />
      </label>
      <label class="field small">
        <span>{t('dnd.ce.atk')}</span>
        <input type="text" placeholder={signed(characterPb(stats) + mod(stats.abilities[sc.ability]))} value={sc.attack === undefined ? '' : signed(sc.attack)} onchange={(e) => setSpellNumber('attack', e.currentTarget.value)} />
      </label>
    </div>
    {#each spellLevels as lvl (lvl)}
      <div class="spell-level">
        <div class="lvl-head">
          <span class="lvl-title">{lvl === '0' ? t('dnd.cantrips') : t('dnd.levelN', { n: lvl })}</span>
          {#if lvl !== '0'}
            <label class="slots">{t('dnd.ce.slots')} <input type="number" min="0" max="9" value={sc.slots[lvl] ?? ''} onchange={(e) => setSlots(lvl, e.currentTarget.value)} /></label>
          {/if}
        </div>
        <textarea use:markdownKeys
          rows={rows(sc.spells[lvl])}
          placeholder={t('dnd.ce.spellsPh')}
          value={sc.spells[lvl] ?? ''}
          oninput={(e) => setSpells(lvl, e.currentTarget.value)}
        ></textarea>
      </div>
    {/each}
    <div class="row-line">
      <select
        value=""
        onchange={(e) => {
          if (e.currentTarget.value) extraLevels = [...extraLevels, e.currentTarget.value];
          e.currentTarget.value = '';
        }}
      >
        <option value="">{t('dnd.ce.addLevel')}</option>
        {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'].filter((l) => !spellLevels.includes(l)) as l (l)}<option value={l}>{t('dnd.levelN', { n: l })}</option>{/each}
      </select>
      <div class="grow"></div>
      <button type="button" class="btn danger" onclick={() => delete stats.spellcasting}>{t('dnd.ce.removeSpells')}</button>
    </div>
  {:else}
    <button type="button" class="btn" onclick={() => (stats.spellcasting = { ability: 'wis', slots: {}, spells: {} })}><Plus size={14} /> {t('dnd.ce.casts')}</button>
  {/if}
</section>

<section>
  <h4>{t('dnd.ce.coins')}</h4>
  <div class="grid">
    {#each Object.entries(COINS) as [k, l] (k)}
      <label class="field small">
        <span>{l}</span>
        <input type="number" min="0" value={stats.coins?.[k as keyof typeof COINS] ?? ''} onchange={(e) => setCoin(k as keyof typeof COINS, e.currentTarget.value)} />
      </label>
    {/each}
  </div>
</section>

{#each CHARACTER_TEXTS as k (k)}
  <section>
    <h4>{TEXT_TITLES[k]}</h4>
    <textarea use:markdownKeys
      rows={rows(stats.text[k])}
      placeholder={TEXT_PH[k] || t('dnd.markupPh')}
      value={stats.text[k] ?? ''}
      oninput={(e) => setText(k, e.currentTarget.value)}
    ></textarea>
  </section>
{/each}

<section>
  <h4>{t('dnd.ce.ownNotes')}</h4>
  {#each stats.notes ?? [] as n, i (i)}
    <div class="note">
      <div class="row-line">
        <input class="grow title" type="text" placeholder={t('dnd.ce.titlePh')} bind:value={n.title} />
        <button type="button" class="icon-btn" title={t('dnd.delete')} onclick={() => stats.notes?.splice(i, 1)}><Trash2 size={14} /></button>
      </div>
      <textarea use:markdownKeys rows={rows(n.text)} bind:value={n.text}></textarea>
    </div>
  {/each}
  <button type="button" class="btn" onclick={() => (stats.notes ??= []).push({ title: '', text: '' })}><Plus size={14} /> {t('dnd.ce.note')}</button>
</section>

<style>
  section {
    margin-bottom: 18px;
  }
  h4 {
    margin: 0 0 8px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .hint {
    margin-left: 6px;
    color: var(--text-faint);
    font-weight: 400;
    text-transform: none;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 8px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 150px;
  }
  .field.small {
    width: 110px;
  }
  .field.wide {
    flex: 1;
    min-width: 160px;
  }
  .field > span:first-child {
    color: var(--text-faint);
    font-size: 11px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-bottom: 6px;
    color: var(--text-muted);
  }
  .row-line {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .grow {
    flex: 1;
    min-width: 0;
  }
  .short,
  .lvl {
    width: 64px;
  }
  .icon-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .abilities {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
  }
  .ability {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .abbr {
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
  }
  .ability input[type='number'] {
    width: 100%;
    min-width: 0;
    font-weight: 600;
    text-align: center;
  }
  .save {
    display: flex;
    align-items: center;
    gap: 3px;
    color: var(--text-muted);
    font-size: 11px;
  }
  .skills {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2px 16px;
  }
  .skill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
  }
  .sname {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sname .faint {
    font-size: 10px;
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .seg button {
    padding: 1px 7px;
    border: 0;
    background: none;
    color: var(--text-faint);
    font-size: 11px;
    cursor: pointer;
  }
  .seg button.on {
    background: var(--accent-soft);
    color: var(--text-normal);
  }
  .sb {
    width: 30px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .spell-level {
    margin-bottom: 8px;
  }
  .lvl-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
  }
  .lvl-title {
    font-weight: 600;
  }
  .slots {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-faint);
    font-size: 12px;
  }
  .slots input {
    width: 56px;
  }
  textarea {
    width: 100%;
  }
  .note {
    margin-bottom: 8px;
  }
  .note .title {
    font-weight: 600;
  }
</style>
