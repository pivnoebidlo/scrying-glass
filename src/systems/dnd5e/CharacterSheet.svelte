<!-- Лист персонажа D&D 5e для мастера: шапка с главным и вкладки, как в Long Story Short. Только просмотр. -->
<script lang="ts">
  import { t } from '../../renderer/lib/i18n.svelte';
  import { labels } from '../../shared/i18n';
  import type { Card } from '../../shared/cards';
  import { markdown } from '../../renderer/lib/markdown';
  import { spellLinks } from '../../renderer/lib/entry/links';
  import { modeOf, rolls, rollHint } from '../../renderer/lib/rolls.svelte';
  import { parseBonus, parseDice } from '../../shared/dice';
  import { ABILITIES, dict, mod, signed, sizeText, SKILL_ABILITY } from './stats';
  import {
    characterInitiative, characterPb, saveBonus, skillBonus, totalLevel, type CharacterText, type Dnd5eCharacter,
    CHARACTER_TEXTS,
  } from './character';

  let { card }: { card: Card<Dnd5eCharacter> } = $props();

  const c = $derived(card.stats);
  const lb = $derived(dict(card.lang));
  const pb = $derived(characterPb(c));

  const check = (e: MouseEvent, what: string, bonus: number) => rolls.check(card.name, what, bonus, modeOf(e));

  type Tab = 'stats' | 'combat' | 'spells' | 'features' | 'equipment' | 'person' | 'notes';
  let tab = $state<Tab>('stats');

  const has = (k: CharacterText) => !!c.text[k]?.trim();
  const tabs = $derived(
    (
      [
        ['stats', t('dnd.sh.stats'), true],
        ['combat', t('dnd.attacks'), c.attacks.length > 0 || has('attacks')],
        ['spells', t('dnd.spells'), !!c.spellcasting],
        ['features', t('dnd.sh.features'), has('features') || has('traits') || has('proficiencies')],
        ['equipment', t('dnd.sh.equipment'), has('equipment') || !!c.coins],
        ['person', t('dnd.sh.person'), ['personality', 'ideals', 'bonds', 'flaws', 'appearance', 'background', 'allies'].some((k) => has(k as CharacterText)) || !!c.details],
        ['notes', t('dnd.sh.notes'), has('quests') || !!c.notes?.length],
      ] as [Tab, string, boolean][]
    ).filter(([, , show]) => show)
  );

  const classes = $derived(c.classes.map((x) => `${x.name}${x.subclass ? ` (${x.subclass})` : ''} ${x.level}`).join(' / '));
  const skills = $derived(
    Object.entries(SKILL_ABILITY)
      .map(([k, a]) => ({ key: k, name: lb.skills[k] ?? k, ability: a, level: c.skills[k] ?? 0, bonus: skillBonus(c, k, a) }))
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

  const DETAILS: Record<string, string> = labels(['age', 'height', 'weight', 'eyes', 'skin', 'hair'], 'dnd.detail');
  const COINS: Record<string, string> = labels(['pp', 'gp', 'ep', 'sp', 'cp'], 'dnd.coinShort');
  const TEXT_TITLES = labels<CharacterText>(CHARACTER_TEXTS, 'dnd.text');
  const PERSON: CharacterText[] = ['personality', 'ideals', 'bonds', 'flaws', 'appearance', 'background', 'allies'];
</script>

<article class="sheet">
  <p class="meta">
    {[classes, c.race, c.background, c.alignment, c.size ? sizeText({ size: [c.size] } as never, 'ru') : ''].filter(Boolean).join(' · ')}
    {#if c.player}<span class="faint">{t('dnd.sh.player', { name: c.player })}</span>{/if}
    {#if c.xp !== undefined}<span class="faint">{t('dnd.sh.xp', { n: c.xp })}</span>{/if}
  </p>

  <div class="vitals">
    <div class="vital"><span class="v">{c.ac}</span><span class="l">{t('dnd.ac')}</span></div>
    <div class="vital"><span class="v">{c.hpMax}</span><span class="l">{t('dnd.sh.hp')}{c.hitDie ? ` · ${totalLevel(c)}×${c.hitDie.replace(/^\d+/, '')}` : ''}</span></div>
    <div class="vital"><button class="v roll" title={t('dnd.rollInit', { hint: rollHint() })} onclick={(e) => check(e, t('dnd.initiative'), characterInitiative(c))}>{signed(characterInitiative(c))}</button><span class="l">{t('dnd.sh.initiative')}</span></div>
    <div class="vital"><span class="v">{c.speed}</span><span class="l">{t('dnd.sh.speed')}</span></div>
    <div class="vital"><span class="v">{signed(pb)}</span><span class="l">{t('dnd.sh.pb')}</span></div>
    {#if c.inspiration}<div class="vital insp"><span class="v">★</span><span class="l">{t('dnd.sh.inspiration')}</span></div>{/if}
  </div>

  <div class="abilities">
    {#each ABILITIES as a (a)}
      <div class="ability">
        <span class="abbr">{lb.abilities[a]}</span>
        <button class="mod roll" title="{t('dnd.check', { ability: lb.abilities[a] })}. {rollHint()}" onclick={(e) => check(e, t('dnd.check', { ability: lb.abilities[a] }), mod(c.abilities[a]))}>{signed(mod(c.abilities[a]))}</button>
        <span class="score faint">{c.abilities[a]}</span>
        <button class="save roll" class:prof={c.saves.includes(a)} title="{t('dnd.saveOf', { ability: lb.abilities[a] })}. {rollHint()}" onclick={(e) => check(e, t('dnd.saveOf', { ability: lb.abilities[a] }), saveBonus(c, a))}>{t('dnd.sh.save', { n: signed(saveBonus(c, a)) })}</button>
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
            <span class="dot" class:expert={s.level === 2} title={s.level === 2 ? t('dnd.expertise') : s.level ? t('dnd.proficiency') : ''}></span>
            <span class="sname">{s.name}</span>
            <span class="faint ab">{lb.abilities[s.ability]}</span>
            <button class="sb roll" title="{s.name}. {rollHint()}" onclick={(e) => check(e, s.name, s.bonus)}>{signed(s.bonus)}</button>
          </li>
        {/each}
      </ul>
      <div>
        <dl class="passive">
          <div><dt>{t('dnd.sh.passivePerception')}</dt><dd>{passive('perception')}</dd></div>
          <div><dt>{t('dnd.sh.passiveInsight')}</dt><dd>{passive('insight')}</dd></div>
          <div><dt>{t('dnd.sh.passiveInvestigation')}</dt><dd>{passive('investigation')}</dd></div>
        </dl>
        {#if has('proficiencies')}
          <h4>{TEXT_TITLES.proficiencies}</h4>
          <div class="text">{@html markdown(c.text.proficiencies!)}</div>
        {/if}
      </div>
    </div>
  {:else if tab === 'combat'}
    {#if c.attacks.length}
      <table class="attacks">
        <thead><tr><th>{t('dnd.sh.attack')}</th><th>{t('dnd.sh.bonus')}</th><th>{t('dnd.sh.damage')}</th></tr></thead>
        <tbody>
          {#each c.attacks as a, i (i)}
            {@const bonus = parseBonus(a.bonus)}
            {@const dmg = parseDice(a.damage)}
            <tr>
              <td>{a.name}{#if a.notes}<div class="faint small">{a.notes}</div>{/if}</td>
              <td>
                {#if bonus !== null}
                  <button class="roll" title={t('dnd.attackHint', { hint: rollHint() })} onclick={(e) => rolls.attack(card.name, a.name, bonus, dmg ? [a.damage] : [], modeOf(e))}>{a.bonus}</button>
                {:else}{a.bonus}{/if}
              </td>
              <td>
                {#if dmg}
                  <button class="roll" title={t('dnd.damageHint')} onclick={(e) => rolls.damage(card.name, a.name, a.damage, e.shiftKey)}>{a.damage}</button>
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
      <div class="vital"><span class="v">{lb.abilities[c.spellcasting.ability]}</span><span class="l">{t('dnd.sh.ability')}</span></div>
      <div class="vital"><span class="v">{spellDc}</span><span class="l">{t('dnd.sh.dc')}</span></div>
      <div class="vital"><button class="v roll" title={t('dnd.spellAttackHint', { hint: rollHint() })} onclick={(e) => check(e, t('dnd.spellAttack'), spellAttack)}>{signed(spellAttack)}</button><span class="l">{t('dnd.sh.atk')}</span></div>
    </div>
    {#each spellLevels as lvl (lvl)}
      <section class="spell-level">
        <h4>
          {lvl === '0' ? t('dnd.cantrips') : t('dnd.levelN', { n: lvl })}
          {#if c.spellcasting.slots[lvl]}<span class="slots">{#each Array(c.spellcasting.slots[lvl]) as _, i (i)}<span class="slot"></span>{/each} {t('dnd.sh.slots', { n: c.spellcasting.slots[lvl] })}</span>{/if}
        </h4>
        {#if c.spellcasting.spells[lvl]}<div class="text spells" use:spellLinks={'text'}>{@html markdown(c.spellcasting.spells[lvl])}</div>{/if}
      </section>
    {/each}
  {:else if tab === 'features'}
    {#if has('features')}<h4>{TEXT_TITLES.features}</h4><div class="text">{@html markdown(c.text.features!)}</div>{/if}
    {#if has('traits')}<h4>{TEXT_TITLES.traits}</h4><div class="text">{@html markdown(c.text.traits!)}</div>{/if}
    {#if has('proficiencies')}<h4>{TEXT_TITLES.proficiencies}</h4><div class="text">{@html markdown(c.text.proficiencies!)}</div>{/if}
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
    {#each PERSON as k (k)}
      {#if has(k)}<h4>{TEXT_TITLES[k]}</h4><div class="text">{@html markdown(c.text[k]!)}</div>{/if}
    {/each}
  {:else if tab === 'notes'}
    {#if has('quests')}<h4>{TEXT_TITLES.quests}</h4><div class="text">{@html markdown(c.text.quests!)}</div>{/if}
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
    color: var(--on-accent);
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
