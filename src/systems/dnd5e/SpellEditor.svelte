<!-- Раздел «Колдовство» редактора статблока: характеристика, СЛ и бонус атаки (пусто — посчитаются), группы
     заклинаний. Названия подсказываются из справочника. Колдовство, записанное текстом особенности или действия
     (как в SRD), можно перенести сюда одной кнопкой. -->
<script lang="ts">
  import { Plus, Wand2, X } from '@lucide/svelte';
  import { knownSpells } from '../../renderer/lib/entry/peek.svelte';
  import { ABILITIES, type Ability, type Dnd5eStats } from './stats';
  import {
    GROUP_KINDS, defaultSpellName, groupLabel, looksLikeSpellcasting, newSpellcasting, parseSpellcasting, spellAttack, spellDc,
    type SpellGroup,
  } from './spells';

  let { stats = $bindable(), system, lang }: { stats: Dnd5eStats; system: string; lang: string } = $props();

  const ABILITY_NAMES: Record<Ability, string> = { str: 'Сила', dex: 'Ловкость', con: 'Телосложение', int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма' };
  const KIND_NAMES: Record<SpellGroup['kind'], string> = { cantrips: 'Заговоры', will: 'По желанию', day: 'N раз в день', level: 'Уровень с ячейками' };
  const suggestions = knownSpells();

  const num = (v: string) => {
    const n = Number(v.replace('−', '-').replace('+', ''));
    return v.trim() === '' || isNaN(n) ? undefined : n;
  };

  // Колдовство, записанное текстом: первая подходящая особенность или действие, которое удаётся разобрать.
  const written = $derived.by(() => {
    if (stats.spellcasting) return null;
    for (const where of ['traits', 'actions'] as const)
      for (const b of stats[where]) if (looksLikeSpellcasting(b) && parseSpellcasting(b, where, stats)) return { where, block: b };
    return null;
  });

  function takeWritten() {
    if (!written) return;
    const sc = parseSpellcasting(written.block, written.where, stats);
    if (!sc) return;
    stats[written.where] = stats[written.where].filter((b) => b !== written.block);
    stats.spellcasting = sc;
  }

  function setKind(i: number, kind: SpellGroup['kind']) {
    const sc = stats.spellcasting!;
    const spells = sc.groups[i]!.spells;
    const g: SpellGroup =
      kind === 'day' ? { kind, times: 1, each: true, spells } : kind === 'level' ? { kind, level: 1, spells } : { kind, spells };
    sc.groups[i] = g;
  }

  function addSpells(g: SpellGroup, input: HTMLInputElement) {
    const names = input.value.split(',').map((x) => x.trim()).filter((x) => x && !g.spells.includes(x));
    g.spells.push(...names);
    input.value = '';
  }

  function addGroup() {
    const sc = stats.spellcasting!;
    const last = sc.groups.at(-1);
    sc.groups.push(last?.kind === 'level' ? { kind: 'level', level: last.level + 1, spells: [] } : { kind: 'level', level: 1, spells: [] });
  }
</script>

<datalist id="dnd-spells">{#each suggestions as s (s)}<option value={s}></option>{/each}</datalist>

{#if stats.spellcasting}
  {@const sc = stats.spellcasting}
  <div class="grid">
    <label class="field wide">
      <span>Название</span>
      <input type="text" placeholder={defaultSpellName(lang, system)} bind:value={sc.name} />
    </label>
    <label class="field">
      <span>Где показывать</span>
      <select bind:value={sc.where}>
        <option value="traits">в особенностях</option>
        <option value="actions">в действиях</option>
      </select>
    </label>
    <label class="field">
      <span>Характеристика</span>
      <select bind:value={sc.ability}>{#each ABILITIES as a (a)}<option value={a}>{ABILITY_NAMES[a]}</option>{/each}</select>
    </label>
    <label class="field small" title="Пусто — 8 + бонус мастерства + модификатор характеристики">
      <span>СЛ спасброска</span>
      <input type="number" placeholder={String(spellDc(stats, { ...sc, dc: undefined }))} value={sc.dc ?? ''} onchange={(e) => (sc.dc = num(e.currentTarget.value))} />
    </label>
    <label class="field small" title="Пусто — бонус мастерства + модификатор характеристики">
      <span>Атака</span>
      <input type="number" placeholder={String(spellAttack(stats, { ...sc, attack: undefined }))} value={sc.attack ?? ''} onchange={(e) => (sc.attack = num(e.currentTarget.value))} />
    </label>
    <label class="field wide">
      <span>Примечание</span>
      <input type="text" placeholder="Не требует материальных компонентов." bind:value={sc.note} />
    </label>
  </div>

  <div class="groups">
    {#each sc.groups as g, i (i)}
      <div class="group">
        <div class="head">
          <select value={g.kind} onchange={(e) => setKind(i, e.currentTarget.value as SpellGroup['kind'])}>
            {#each GROUP_KINDS as k (k)}<option value={k}>{KIND_NAMES[k]}</option>{/each}
          </select>
          {#if g.kind === 'day'}
            <label class="inline"><input type="number" min="1" bind:value={g.times} /> раз в день</label>
            <label class="inline"><input type="checkbox" bind:checked={g.each} /> каждое</label>
          {:else if g.kind === 'level'}
            <label class="inline"><input type="number" min="1" max="9" bind:value={g.level} /> уровень</label>
            <label class="inline" title="Пусто — без ячеек"
              ><input type="number" min="0" value={g.slots ?? ''} onchange={(e) => (g.slots = num(e.currentTarget.value) || undefined)} /> ячеек</label
            >
          {/if}
          <span class="faint preview">{groupLabel(g, lang)}</span>
          <button type="button" class="icon-btn" title="Убрать группу" onclick={() => sc.groups.splice(i, 1)}><X size={14} /></button>
        </div>
        <div class="spells">
          {#each g.spells as s, j (s)}
            <span class="chip">{s}<button type="button" title="Убрать" onclick={() => g.spells.splice(j, 1)}><X size={11} /></button></span>
          {/each}
          <input
            type="text"
            list="dnd-spells"
            placeholder="Заклинание (Enter — добавить)"
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSpells(g, e.currentTarget);
              }
            }}
            onchange={(e) => addSpells(g, e.currentTarget)}
          />
        </div>
      </div>
    {/each}
  </div>
  <div class="buttons">
    <button type="button" class="btn" onclick={addGroup}><Plus size={14} /> Группа заклинаний</button>
    <button type="button" class="btn danger" onclick={() => delete stats.spellcasting}>Убрать колдовство</button>
  </div>
{:else}
  <div class="buttons">
    <button type="button" class="btn" onclick={() => (stats.spellcasting = newSpellcasting(stats, system))}><Wand2 size={14} /> Добавить колдовство</button>
    {#if written}
      <button
        type="button"
        class="btn"
        title="Разобрать текст «{written.block.name}» на характеристику и группы заклинаний; сам текст уберётся"
        onclick={takeWritten}>Перенести из «{written.block.name}»</button
      >
    {/if}
  </div>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    margin-bottom: 10px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .field.wide {
    grid-column: 1 / -1;
  }
  .field > span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .groups {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;
  }
  .group {
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .inline {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 12px;
  }
  .inline input[type='number'] {
    width: 56px;
  }
  .preview {
    flex: 1;
    font-size: 12px;
    text-align: right;
  }
  .spells {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .spells input {
    flex: 1;
    min-width: 180px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px 2px 8px;
    border-radius: 999px;
    background: var(--bg-active);
    font-size: 12px;
    font-style: italic;
  }
  .chip button {
    display: grid;
    place-items: center;
    padding: 1px;
    border: 0;
    background: none;
    color: var(--text-faint);
    cursor: pointer;
  }
  .chip button:hover {
    color: var(--danger);
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
