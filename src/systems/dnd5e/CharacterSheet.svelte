<!-- Лист персонажа D&D 5e для мастера: шапка с главным и вкладки, как в Long Story Short. Только просмотр. -->
<script lang="ts">
  import type { Card } from '../../shared/cards';
  import { markdown } from '../../renderer/lib/markdown';
  import { spellLinks } from '../../renderer/lib/entry/links';
  import { modeOf, rolls, rollHint } from '../../renderer/lib/rolls.svelte';
  import { parseBonus, parseDice } from '../../shared/dice';
  import { ABILITIES, dict, mod, signed, sizeText, SKILL_ABILITY } from './stats';
  import {
    characterInitiative, characterPb, saveBonus, skillBonus, totalLevel, type CharacterText, type Dnd5eCharacter,
  } from './character';

  let { card }: { card: Card<Dnd5eCharacter> } = $props();

  const c = $derived(card.stats);
  const t = dict('ru');
  const pb = $derived(characterPb(c));

  const check = (e: MouseEvent, what: string, bonus: number) => rolls.check(card.name, what, bonus, modeOf(e));

  type Tab = 'stats' | 'combat' | 'spells' | 'features' | 'equipment' | 'person' | 'notes';
  let tab = $state<Tab>('stats');

  const has = (k: CharacterText) => !!c.text[k]?.trim();
  const tabs = $derived(
    (
      [
        ['stats', 'Характеристики', true],
        ['combat', 'Атаки', c.attacks.length > 0 || has('attacks')],
        ['spells', 'Заклинания', !!c.spellcasting],
        ['features', 'Умения', has('features') || has('traits') || has('proficiencies')],
        ['equipment', 'Снаряжение', has('equipment') || !!c.coins],
        ['person', 'Личность', ['personality', 'ideals', 'bonds', 'flaws', 'appearance', 'background', 'allies'].some((k) => has(k as CharacterText)) || !!c.details],
        ['notes', 'Заметки', has('quests') || !!c.notes?.length],
      ] as [Tab, string, boolean][]
    ).filter(([, , show]) => show)
  );

  const classes = $derived(c.classes.map((x) => `${x.name}${x.subclass ? ` (${x.subclass})` : ''} ${x.level}`).join(' / '));
  const skills = $derived(
    Object.entries(SKILL_ABILITY)
      .map(([k, a]) => ({ key: k, name: t.skills[k] ?? k, ability: a, level: c.skills[k] ?? 0, bonus: skillBonus(c, k, a) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  );
  const passive = (skill: string) => 10 + skillBonus(c, skill, SKILL_ABILITY[skill]!);

  const spellDc = $derived(c.spellcasting ? (c.spellcasting.dc ?? 8 + pb + mod(c.abilities[c.spellcasting.ability])) : 0);
  const spellAttack = $derived(c.spellcasting ? (c.spellcasting.attack ?? pb + mod(c.abilities[c.spellcasting.ability])) : 0);
  const spellLevels = $derived(
    c.spellcasting
      ? [...new Set([...Object.keys(c.spellcasting.spells), ...Object.keys(c.spellcasting.slots)])].sort((a, b) => Number(a) - Number(b))
      : []
  );

  const DETAILS: Record<string, string> = { age: 'Возраст', height: 'Рост', weight: 'Вес', eyes: 'Глаза', skin: 'Кожа', hair: 'Волосы' };
  const COINS: Record<string, string> = { pp: 'ПМ', gp: 'ЗМ', ep: 'ЭМ', sp: 'СМ', cp: 'ММ' };
  const PERSON: [CharacterText, string][] = [
    ['personality', 'Черты характера'], ['ideals', 'Идеалы'], ['bonds', 'Привязанности'], ['flaws', 'Слабости'],
    ['appearance', 'Внешность'], ['background', 'Предыстория'], ['allies', 'Союзники и организации'],
  ];
</script>

<article class="sheet">
  <p class="meta">
    {[classes, c.race, c.background, c.alignment, c.size ? sizeText({ size: [c.size] } as never, 'ru') : ''].filter(Boolean).join(' · ')}
    {#if c.player}<span class="faint"> · игрок {c.player}</span>{/if}
    {#if c.xp !== undefined}<span class="faint"> · опыт {c.xp}</span>{/if}
  </p>

  <div class="vitals">
    <div class="vital"><span class="v">{c.ac}</span><span class="l">КД</span></div>
    <div class="vital"><span class="v">{c.hpMax}</span><span class="l">хиты{c.hitDie ? ` · ${totalLevel(c)}×${c.hitDie.replace(/^\d+/, '')}` : ''}</span></div>
    <div class="vital"><button class="v roll" title="Бросить инициативу. {rollHint()}" onclick={(e) => check(e, 'Инициатива', characterInitiative(c))}>{signed(characterInitiative(c))}</button><span class="l">инициатива</span></div>
    <div class="vital"><span class="v">{c.speed}</span><span class="l">скорость, фт.</span></div>
    <div class="vital"><span class="v">{signed(pb)}</span><span class="l">мастерство</span></div>
    {#if c.inspiration}<div class="vital insp"><span class="v">★</span><span class="l">вдохновение</span></div>{/if}
  </div>

  <div class="abilities">
    {#each ABILITIES as a (a)}
      <div class="ability">
        <span class="abbr">{t.abilities[a]}</span>
        <button class="mod roll" title="Проверка {t.abilities[a]}. {rollHint()}" onclick={(e) => check(e, `Проверка ${t.abilities[a]}`, mod(c.abilities[a]))}>{signed(mod(c.abilities[a]))}</button>
        <span class="score faint">{c.abilities[a]}</span>
        <button class="save roll" class:prof={c.saves.includes(a)} title="Спасбросок {t.abilities[a]}. {rollHint()}" onclick={(e) => check(e, `Спасбросок ${t.abilities[a]}`, saveBonus(c, a))}>спас {signed(saveBonus(c, a))}</button>
      </div>
    {/each}
  </div>

  <nav class="tabs">
    {#each tabs as [id, title] (id)}
      <button class:active={tab === id} onclick={() => (tab = id)}>{title}</button>
    {/each}
  </nav>

  {#if tab === 'stats'}
    <div class="cols">
      <ul class="skills">
        {#each skills as s (s.key)}
          <li class:prof={s.level > 0}>
            <span class="dot" class:expert={s.level === 2} title={s.level === 2 ? 'Компетентность' : s.level ? 'Владение' : ''}></span>
            <span class="sname">{s.name}</span>
            <span class="faint ab">{t.abilities[s.ability]}</span>
            <button class="sb roll" title="{s.name}. {rollHint()}" onclick={(e) => check(e, s.name, s.bonus)}>{signed(s.bonus)}</button>
          </li>
        {/each}
      </ul>
      <div>
        <dl class="passive">
          <div><dt>Пассивная Внимательность</dt><dd>{passive('perception')}</dd></div>
          <div><dt>Пассивная Проницательность</dt><dd>{passive('insight')}</dd></div>
          <div><dt>Пассивный Анализ</dt><dd>{passive('investigation')}</dd></div>
        </dl>
        {#if has('proficiencies')}
          <h4>Владения и языки</h4>
          <div class="text">{@html markdown(c.text.proficiencies!)}</div>
        {/if}
      </div>
    </div>
  {:else if tab === 'combat'}
    {#if c.attacks.length}
      <table class="attacks">
        <thead><tr><th>Атака</th><th>Бонус</th><th>Урон</th></tr></thead>
        <tbody>
          {#each c.attacks as a, i (i)}
            {@const bonus = parseBonus(a.bonus)}
            {@const dmg = parseDice(a.damage)}
            <tr>
              <td>{a.name}{#if a.notes}<div class="faint small">{a.notes}</div>{/if}</td>
              <td>
                {#if bonus !== null}
                  <button class="roll" title="Атака и урон. {rollHint()}" onclick={(e) => rolls.attack(card.name, a.name, bonus, dmg ? [a.damage] : [], modeOf(e))}>{a.bonus}</button>
                {:else}{a.bonus}{/if}
              </td>
              <td>
                {#if dmg}
                  <button class="roll" title="Только урон. Shift — критический (кубы ×2)" onclick={(e) => rolls.damage(card.name, a.name, a.damage, e.shiftKey)}>{a.damage}</button>
                {:else}{a.damage}{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
    {#if has('attacks')}<div class="text">{@html markdown(c.text.attacks!)}</div>{/if}
  {:else if tab === 'spells' && c.spellcasting}
    <div class="vitals small-vitals">
      <div class="vital"><span class="v">{t.abilities[c.spellcasting.ability]}</span><span class="l">характеристика</span></div>
      <div class="vital"><span class="v">{spellDc}</span><span class="l">СЛ спасброска</span></div>
      <div class="vital"><button class="v roll" title="Атака заклинанием. {rollHint()}" onclick={(e) => check(e, 'Атака заклинанием', spellAttack)}>{signed(spellAttack)}</button><span class="l">бонус атаки</span></div>
    </div>
    {#each spellLevels as lvl (lvl)}
      <section class="spell-level">
        <h4>
          {lvl === '0' ? 'Заговоры' : `${lvl}-й уровень`}
          {#if c.spellcasting.slots[lvl]}<span class="slots">{#each Array(c.spellcasting.slots[lvl]) as _, i (i)}<span class="slot"></span>{/each} ячеек: {c.spellcasting.slots[lvl]}</span>{/if}
        </h4>
        {#if c.spellcasting.spells[lvl]}<div class="text spells" use:spellLinks={'text'}>{@html markdown(c.spellcasting.spells[lvl])}</div>{/if}
      </section>
    {/each}
  {:else if tab === 'features'}
    {#if has('features')}<h4>Умения</h4><div class="text">{@html markdown(c.text.features!)}</div>{/if}
    {#if has('traits')}<h4>Особенности и черты</h4><div class="text">{@html markdown(c.text.traits!)}</div>{/if}
    {#if has('proficiencies')}<h4>Владения и языки</h4><div class="text">{@html markdown(c.text.proficiencies!)}</div>{/if}
  {:else if tab === 'equipment'}
    {#if c.coins}
      <div class="coins">
        {#each Object.entries(COINS) as [k, l] (k)}{#if c.coins[k as keyof typeof c.coins]}<span><b>{c.coins[k as keyof typeof c.coins]}</b> {l}</span>{/if}{/each}
      </div>
    {/if}
    {#if has('equipment')}<div class="text">{@html markdown(c.text.equipment!)}</div>{/if}
  {:else if tab === 'person'}
    {#if c.details}
      <dl class="details">
        {#each Object.entries(c.details) as [k, v] (k)}<div><dt>{DETAILS[k] ?? k}</dt><dd>{v}</dd></div>{/each}
      </dl>
    {/if}
    {#each PERSON as [k, title] (k)}
      {#if has(k)}<h4>{title}</h4><div class="text">{@html markdown(c.text[k]!)}</div>{/if}
    {/each}
  {:else if tab === 'notes'}
    {#if has('quests')}<h4>Задания</h4><div class="text">{@html markdown(c.text.quests!)}</div>{/if}
    {#each c.notes ?? [] as n, i (i)}<h4>{n.title}</h4><div class="text">{@html markdown(n.text)}</div>{/each}
  {/if}
</article>

<style>
  /* Число, по которому можно бросить: выглядит как текст, подсвечивается при наведении. */
  .roll {
    padding: 0 2px;
    border: 0;
    border-radius: 3px;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .roll:hover {
    background: var(--accent);
    color: #fff;
  }
  .sheet {
    max-width: 820px;
    line-height: 1.5;
    user-select: text;
  }
  .meta {
    margin: 0 0 12px;
    color: var(--text-muted);
  }
  .vitals {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .vital {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 84px;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .vital .v {
    font-size: 20px;
    font-weight: 600;
  }
  .vital .l {
    color: var(--text-faint);
    font-size: 11px;
  }
  .insp .v {
    color: var(--accent-hover);
  }
  .small-vitals .vital .v {
    font-size: 16px;
  }
  .abilities {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 14px;
  }
  .ability {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  .abbr {
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
  }
  .mod {
    font-size: 20px;
    font-weight: 600;
  }
  .score {
    font-size: 12px;
  }
  .save {
    margin-top: 2px;
    color: var(--text-faint);
    font-size: 11px;
  }
  .save.prof {
    color: var(--accent-hover);
    font-weight: 600;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }
  .tabs button {
    padding: 6px 12px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .tabs button.active {
    border-bottom-color: var(--accent);
    color: var(--text-normal);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(240px, 300px) 1fr;
    gap: 24px;
  }
  .skills {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .skills li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
    color: var(--text-muted);
  }
  .skills li.prof {
    color: var(--text-normal);
  }
  .dot {
    width: 8px;
    height: 8px;
    border: 1px solid var(--text-faint);
    border-radius: 50%;
  }
  .prof .dot {
    border-color: var(--accent);
    background: var(--accent);
  }
  .dot.expert {
    box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 3px var(--accent);
  }
  .sname {
    flex: 1;
  }
  .ab {
    font-size: 10px;
  }
  .sb {
    width: 32px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  dl {
    margin: 0 0 12px;
  }
  dl div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 2px 0;
    border-bottom: 1px solid var(--border);
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    margin: 0;
    font-weight: 600;
  }
  .details {
    max-width: 360px;
  }
  h4 {
    margin: 16px 0 6px;
    color: var(--accent-hover);
    font-size: 14px;
  }
  .text :global(p) {
    margin: 0 0 6px;
  }
  .text :global(ul) {
    margin: 0 0 6px;
    padding-left: 20px;
  }
  .spells :global(p) {
    margin: 0;
  }
  .slots {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-left: 10px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 400;
  }
  .slot {
    width: 9px;
    height: 9px;
    border: 1px solid var(--accent);
    border-radius: 2px;
  }
  .attacks {
    width: 100%;
    margin-bottom: 12px;
    border-collapse: collapse;
  }
  .attacks th {
    padding: 4px 8px;
    color: var(--text-faint);
    font-size: 11px;
    font-weight: 500;
    text-align: left;
    text-transform: uppercase;
  }
  .attacks td {
    padding: 6px 8px;
    border-top: 1px solid var(--border);
  }
  .small {
    font-size: 11px;
  }
  .coins {
    display: flex;
    gap: 16px;
    margin-bottom: 10px;
  }
</style>
