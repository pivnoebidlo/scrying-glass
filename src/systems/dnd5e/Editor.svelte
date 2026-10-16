<!-- Редактор статблока D&D 5e. Подписи интерфейса — по-русски, справочные значения хранятся ключами. -->
<script lang="ts">
  import { Calculator, Plus, X } from '@lucide/svelte';
  import BlockList from './BlockList.svelte';
  import TermList from './TermList.svelte';
  import SpellEditor from './SpellEditor.svelte';
  import {
    ABILITIES, CRS, SENSES, SIZES, SKILL_ABILITY, SPEEDS, averageHp, crText, dict, mod, pbFor, signed, xpFor,
    type Ability, type Dnd5eStats, type SenseKind, type SpeedKind,
  } from './stats';

  let { stats = $bindable(), system, lang = 'ru' }: { stats: Dnd5eStats; system: string; lang?: string } = $props();

  // Интерфейс редактора по-русски, независимо от языка карточки.
  const t = dict('ru');
  const ABILITY_NAMES: Record<Ability, string> = {
    str: 'Сила', dex: 'Ловкость', con: 'Телосложение', int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма',
  };
  const SPEED_NAMES: Record<SpeedKind, string> = { walk: 'Ходьба', fly: 'Полёт', swim: 'Плавание', climb: 'Лазание', burrow: 'Копание' };
  const SENSE_NAMES: Record<SenseKind, string> = {
    darkvision: 'Тёмное зрение', blindsight: 'Слепое зрение', tremorsense: 'Чувство вибрации', truesight: 'Истинное зрение',
  };
  const ALIGNMENTS = [
    'законно-добрый', 'нейтрально-добрый', 'хаотично-добрый', 'законно-нейтральный', 'нейтральный',
    'хаотично-нейтральный', 'законно-злой', 'нейтрально-злой', 'хаотично-злой', 'без мировоззрения', 'любое мировоззрение',
  ];

  // Число из поля или undefined, если поле пустое.
  const num = (v: string) => {
    const n = Number(v.replace('−', '-').replace('+', ''));
    return v.trim() === '' || isNaN(n) ? undefined : n;
  };

  function setSpeed(k: SpeedKind, v: string) {
    const n = num(v);
    if (n === undefined) delete stats.speed[k];
    else stats.speed[k] = n;
  }

  function setSense(k: SenseKind, v: string) {
    const n = num(v);
    if (n === undefined) delete stats.senses[k];
    else stats.senses[k] = n;
  }

  function toggleSave(a: Ability, on: boolean) {
    if (on) stats.saves[a] = mod(stats.abilities[a]) + stats.pb;
    else delete stats.saves[a];
  }

  function setCr(cr: number) {
    stats.cr = cr;
    stats.xp = xpFor(cr);
    stats.pb = pbFor(cr);
  }

  function addSkill(skill: string) {
    if (!skill || stats.skills.some((s) => s.skill === skill)) return;
    const a = SKILL_ABILITY[skill];
    stats.skills.push({ skill, bonus: (a ? mod(stats.abilities[a]) : 0) + stats.pb });
  }

  const autoPassive = $derived(10 + (stats.skills.find((s) => s.skill === 'perception')?.bonus ?? mod(stats.abilities.wis)));
</script>

<datalist id="dnd-alignments">{#each ALIGNMENTS as a (a)}<option value={a}></option>{/each}</datalist>

<section>
  <h4>Основное</h4>
  <div class="grid">
    <label class="field size">
      <span>Размер</span>
      <span class="pair">
        <select value={stats.size[0]} onchange={(e) => (stats.size = [e.currentTarget.value as never, ...stats.size.slice(1)])}>
          {#each SIZES as s (s)}<option value={s}>{t.sizes[s]}</option>{/each}
        </select>
        <select
          value={stats.size[1] ?? ''}
          title="Второй размер: «Средний или Маленький»"
          onchange={(e) => (stats.size = e.currentTarget.value ? [stats.size[0]!, e.currentTarget.value as never] : [stats.size[0]!])}
        >
          <option value="">—</option>
          {#each SIZES as s (s)}<option value={s}>или {(t.sizes[s] ?? s).toLowerCase()}</option>{/each}
        </select>
      </span>
    </label>
    <label class="field wide"><span>Тип</span><input type="text" placeholder="Гуманоид (гоблиноид)" bind:value={stats.type} /></label>
    <label class="field wide">
      <span>Мировоззрение</span><input type="text" list="dnd-alignments" placeholder="хаотично-злой" bind:value={stats.alignment} />
    </label>
  </div>
</section>

<section>
  <h4>Защита и движение</h4>
  <div class="grid">
    <label class="field"><span>КД</span><input type="number" bind:value={stats.ac} /></label>
    <label class="field wide"><span>Доспех</span><input type="text" placeholder="природный доспех" bind:value={stats.acNote} /></label>
    <label class="field"><span>Хиты</span><input type="number" bind:value={stats.hp} /></label>
    <label class="field">
      <span>Формула хитов</span>
      <span class="pair">
        <input type="text" placeholder="3d6+3" bind:value={stats.hpFormula} />
        <button
          type="button"
          class="icon-btn"
          title="Посчитать средние хиты по формуле"
          disabled={averageHp(stats.hpFormula ?? '') === null}
          onclick={() => (stats.hp = averageHp(stats.hpFormula ?? '') ?? stats.hp)}
        ><Calculator size={14} /></button>
      </span>
    </label>
    <label class="field">
      <span>Инициатива</span>
      <input
        type="text"
        placeholder="{signed(mod(stats.abilities.dex))} (ЛОВ)"
        value={stats.initiative === undefined ? '' : signed(stats.initiative)}
        onchange={(e) => (stats.initiative = num(e.currentTarget.value))}
      />
    </label>
  </div>
  <div class="grid">
    {#each SPEEDS as k (k)}
      <label class="field small">
        <span>{SPEED_NAMES[k]}, фт.</span>
        <input type="number" value={stats.speed[k] ?? ''} onchange={(e) => setSpeed(k, e.currentTarget.value)} />
      </label>
    {/each}
    <label class="check"><input
        type="checkbox"
        checked={!!stats.speed.hover}
        onchange={(e) => (e.currentTarget.checked ? (stats.speed.hover = true) : delete stats.speed.hover)}
      /> парит</label>
  </div>
</section>

<section>
  <h4>Характеристики</h4>
  <div class="abilities">
    {#each ABILITIES as a (a)}
      <div class="ability">
        <span class="abbr" title={ABILITY_NAMES[a]}>{t.abilities[a]}</span>
        <input type="number" bind:value={stats.abilities[a]} />
        <span class="faint">{signed(mod(stats.abilities[a]))}</span>
        <label class="save" title="Владение спасброском">
          <input type="checkbox" checked={stats.saves[a] !== undefined} onchange={(e) => toggleSave(a, e.currentTarget.checked)} /> спас
        </label>
        {#if stats.saves[a] !== undefined}
          <input class="save-val" type="text" value={signed(stats.saves[a]!)} onchange={(e) => (stats.saves[a] = num(e.currentTarget.value) ?? 0)} />
        {/if}
      </div>
    {/each}
  </div>
</section>

<section>
  <h4>Навыки</h4>
  <div class="skills">
    {#each stats.skills as s, i (s.skill)}
      <span class="skill">
        {t.skills[s.skill] ?? s.skill}
        <input type="text" value={signed(s.bonus)} onchange={(e) => (s.bonus = num(e.currentTarget.value) ?? 0)} />
        <button type="button" class="icon-btn" title="Убрать" onclick={() => stats.skills.splice(i, 1)}><X size={12} /></button>
      </span>
    {/each}
    <select
      value=""
      onchange={(e) => {
        addSkill(e.currentTarget.value);
        e.currentTarget.value = '';
      }}
    >
      <option value="">+ навык</option>
      {#each Object.entries(t.skills).filter(([k]) => !stats.skills.some((s) => s.skill === k)) as [k, l] (k)}<option value={k}>{l}</option>{/each}
    </select>
  </div>
</section>

<section>
  <h4>Урон и состояния</h4>
  <div class="rows">
    <div class="row"><span class="lbl">Уязвимости</span><TermList bind:values={stats.vulnerabilities} table={t.damage} /></div>
    <div class="row"><span class="lbl">Сопротивления</span><TermList bind:values={stats.resistances} table={t.damage} /></div>
    <div class="row"><span class="lbl">Иммунитеты</span><TermList bind:values={stats.immunities} table={t.damage} /></div>
    <div class="row"><span class="lbl">Иммунитет к состояниям</span><TermList bind:values={stats.conditionImmunities} table={t.conditions} /></div>
  </div>
</section>

<section>
  <h4>Чувства и языки</h4>
  <div class="grid">
    {#each SENSES as k (k)}
      <label class="field small">
        <span>{SENSE_NAMES[k]}</span>
        <input type="number" value={stats.senses[k] ?? ''} onchange={(e) => setSense(k, e.currentTarget.value)} />
      </label>
    {/each}
    <label class="field small">
      <span>Пасс. Внимательность</span>
      <input type="number" placeholder={String(autoPassive)} bind:value={stats.senses.passivePerception} onblur={() => {
        if (typeof stats.senses.passivePerception !== 'number') stats.senses.passivePerception = autoPassive;
      }} />
    </label>
  </div>
  <div class="grid">
    <label class="field wide"><span>Языки</span><input type="text" placeholder="Общий, Гоблинский" bind:value={stats.languages} /></label>
    <label class="field wide"><span>Снаряжение</span><input type="text" placeholder="скимитар, щит" bind:value={stats.gear} /></label>
  </div>
</section>

<section>
  <h4>Опасность</h4>
  <div class="grid">
    <label class="field">
      <span>Показатель опасности</span>
      <select value={stats.cr} onchange={(e) => setCr(Number(e.currentTarget.value))}>
        {#each CRS as cr (cr)}<option value={cr}>{crText(cr)}</option>{/each}
      </select>
    </label>
    <label class="field small"><span>Опыт</span><input type="number" bind:value={stats.xp} /></label>
    <label class="field small"><span>Бонус мастерства</span><input type="number" bind:value={stats.pb} /></label>
  </div>
</section>

<section>
  <h4>Колдовство</h4>
  <SpellEditor bind:stats {system} {lang} />
</section>

<section>
  <h4>Особенности</h4>
  <BlockList bind:blocks={stats.traits} addLabel="Особенность" />
</section>
<section>
  <h4>Действия</h4>
  <BlockList bind:blocks={stats.actions} addLabel="Действие" />
</section>
<section>
  <h4>Бонусные действия</h4>
  <BlockList bind:blocks={stats.bonusActions} addLabel="Бонусное действие" />
</section>
<section>
  <h4>Реакции</h4>
  <BlockList bind:blocks={stats.reactions} addLabel="Реакция" />
</section>
<section>
  <h4>Легендарные действия</h4>
  {#if stats.legendary}
    <textarea rows="3" placeholder="Вступление: сколько легендарных действий и когда" bind:value={stats.legendary.intro}></textarea>
    <BlockList bind:blocks={stats.legendary.actions} addLabel="Легендарное действие" />
    <button type="button" class="btn danger" onclick={() => delete stats.legendary}>Убрать легендарные действия</button>
  {:else}
    <button type="button" class="btn" onclick={() => (stats.legendary = { intro: '', actions: [] })}><Plus size={14} /> Добавить легендарные действия</button>
  {/if}
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
    width: 120px;
  }
  .field.size {
    width: 250px;
  }
  .field.small {
    width: 110px;
  }
  .field.wide {
    flex: 1;
    min-width: 180px;
  }
  .field > span:first-child {
    color: var(--text-faint);
    font-size: 11px;
  }
  .pair {
    display: flex;
    gap: 4px;
  }
  .pair > * {
    flex: 1;
    min-width: 0;
  }
  .pair .icon-btn {
    flex: none;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-bottom: 6px;
    color: var(--text-muted);
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
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .ability input[type='number'] {
    width: 100%;
    min-width: 0;
    text-align: center;
    font-weight: 600;
  }
  .save {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .save-val {
    width: 52px;
    padding: 2px 4px !important;
    text-align: center;
  }
  .skills {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .skill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 2px 2px 8px;
    border-radius: var(--radius-s);
    background: var(--bg-active);
  }
  .skill input {
    width: 44px;
    padding: 1px 4px !important;
    text-align: center;
  }
  .skill .icon-btn {
    width: 20px;
    height: 20px;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: grid;
    grid-template-columns: 150px 1fr;
    align-items: center;
    gap: 8px;
  }
  .lbl {
    color: var(--text-faint);
    font-size: 12px;
  }
  textarea {
    width: 100%;
    margin-bottom: 8px;
  }
</style>
