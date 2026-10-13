<!-- Статблок D&D 5e. Подписи — на языке карточки, числа и справочные значения переводятся здесь. -->
<script lang="ts">
  import type { Card } from '../../shared/cards';
  import { escape, markdown } from '../../renderer/lib/markdown';
  import { Dices } from '@lucide/svelte';
  import { modeOf, rolls, ROLL_HINT } from '../../renderer/lib/rolls.svelte';
  import { ABILITIES, crText, dict, initiativeOf, mod, signed, sizeText, type Block, type Dnd5eStats, type SpeedKind } from './stats';

  let { card }: { card: Card<Dnd5eStats> } = $props();

  // Броски кнопками: подписи в журнале — по-русски, как весь интерфейс.
  const ru = dict('ru');
  const check = (e: MouseEvent, what: string, bonus: number) => rolls.check(card.name, what, bonus, modeOf(e));

  const s = $derived(card.stats);
  const t = $derived(dict(card.lang));


  // Значение из справочника по ключу; неизвестное — как есть.
  const term = (table: Record<string, string>, key: string) => table[key] ?? key;

  const speed = $derived.by(() => {
    const parts: string[] = [];
    for (const k of ['walk', 'burrow', 'climb', 'fly', 'swim'] as SpeedKind[]) {
      const v = s.speed[k];
      if (v === undefined) continue;
      const label = t.speed[k];
      parts.push(`${label ? label + ' ' : ''}${v} ${t.feet}${k === 'fly' && s.speed.hover ? ` (${t.hover})` : ''}`);
    }
    return parts.join(', ');
  });

  const senses = $derived.by(() => {
    const parts = (['blindsight', 'darkvision', 'tremorsense', 'truesight'] as const)
      .filter((k) => s.senses[k] !== undefined)
      .map((k) => `${t.senses[k]} ${s.senses[k]} ${t.feet}`);
    return [parts.join(', '), `${t.passive} ${s.senses.passivePerception}`].filter(Boolean).join('; ');
  });

  const immunities = $derived(
    [s.immunities.map((x) => term(t.damage, x)).join(', '), s.conditionImmunities.map((x) => term(t.conditions, x)).join(', ')]
      .filter(Boolean)
      .join('; ')
  );

  const sections = $derived(
    [
      { title: t.traits, blocks: s.traits, intro: '' },
      { title: t.actions, blocks: s.actions, intro: '' },
      { title: t.bonusActions, blocks: s.bonusActions, intro: '' },
      { title: t.reactions, blocks: s.reactions, intro: '' },
      { title: t.legendary, blocks: s.legendary?.actions ?? [], intro: s.legendary?.intro ?? '' },
    ].filter((x) => x.blocks.length || x.intro)
  );

  // Название действия идёт в начало первого абзаца: «Укус. Рукопашная атака…»
  function blockHtml(b: Block) {
    const name = `<strong><em>${escape(b.name)}${b.uses ? ` (${escape(b.uses)})` : ''}.</em></strong> `;
    const html = markdown(b.text);
    return html.startsWith('<p>') ? '<p>' + name + html.slice(3) : `<p>${name}</p>${html}`;
  }
</script>

<article class="statblock">
  <p class="meta">{[sizeText(s, card.lang), [s.type, s.alignment].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</p>

  <div class="rule"></div>
  <dl class="top">
    <div><dt>{t.ac}</dt><dd>{s.ac}{s.acNote ? ` (${s.acNote})` : ''}</dd></div>
    <div><dt>{t.hp}</dt><dd>{s.hp}{s.hpFormula ? ` (${s.hpFormula})` : ''}</dd></div>
    <div><dt>{t.speedLabel}</dt><dd>{speed}</dd></div>
    {#if card.system === 'dnd5e-2024' || s.initiative !== undefined}
      <div><dt>{t.initiative}</dt><dd>
        <button class="roll" title="Бросить инициативу. {ROLL_HINT}" onclick={(e) => check(e, 'Инициатива', initiativeOf(s))}>{signed(initiativeOf(s))}</button>
        ({10 + initiativeOf(s)})
      </dd></div>
    {/if}
  </dl>

  <div class="rule"></div>
  <table class="abilities">
    <thead>
      <tr><th></th>{#each ABILITIES as a (a)}<th>{t.abilities[a]}</th>{/each}</tr>
    </thead>
    <tbody>
      <tr><th></th>{#each ABILITIES as a (a)}<td class="score">{s.abilities[a]}</td>{/each}</tr>
      <tr>
        <th>{t.mod}</th>
        {#each ABILITIES as a (a)}
          {@const what = `Проверка ${ru.abilities[a]}`}
          <td><button class="roll" title="{what}. {ROLL_HINT}" onclick={(e) => check(e, what, mod(s.abilities[a]))}>{signed(mod(s.abilities[a]))}</button></td>
        {/each}
      </tr>
      <tr>
        <th>{t.save}</th>
        {#each ABILITIES as a (a)}
          {@const what = `Спасбросок ${ru.abilities[a]}`}
          {@const bonus = s.saves[a] ?? mod(s.abilities[a])}
          <td class:prof={s.saves[a] !== undefined}>
            <button class="roll" title="{what}. {ROLL_HINT}" onclick={(e) => check(e, what, bonus)}>{signed(bonus)}</button>
          </td>
        {/each}
      </tr>
    </tbody>
  </table>

  <div class="rule"></div>
  <dl class="props">
    {#if s.skills.length}
      <div><dt>{t.skillsLabel}</dt><dd>
          {#each s.skills as x, i (i)}{#if i > 0},{' '}{/if}{term(t.skills, x.skill)}
            <button class="roll" title="{term(ru.skills, x.skill)}. {ROLL_HINT}" onclick={(e) => check(e, term(ru.skills, x.skill), x.bonus)}>{signed(x.bonus)}</button
            >{/each}
        </dd></div>
    {/if}
    {#if s.vulnerabilities.length}
      <div><dt>{t.vulnerabilities}</dt><dd>{s.vulnerabilities.map((x) => term(t.damage, x)).join(', ')}</dd></div>
    {/if}
    {#if s.resistances.length}
      <div><dt>{t.resistances}</dt><dd>{s.resistances.map((x) => term(t.damage, x)).join(', ')}</dd></div>
    {/if}
    {#if immunities}
      <div><dt>{t.immunities}</dt><dd>{immunities}</dd></div>
    {/if}
    {#if s.gear}
      <div><dt>{t.gear}</dt><dd>{s.gear}</dd></div>
    {/if}
    <div><dt>{t.sensesLabel}</dt><dd>{senses}</dd></div>
    <div><dt>{t.languages}</dt><dd>{s.languages || '—'}</dd></div>
    <div><dt>{t.cr}</dt><dd>{crText(s.cr)} ({t.xp} {s.xp.toLocaleString(card.lang)}; {t.pb} {signed(s.pb)})</dd></div>
  </dl>

  {#each sections as sec (sec.title)}
    <h3>{sec.title}</h3>
    {#if sec.intro}<div class="text">{@html markdown(sec.intro)}</div>{/if}
    {#each sec.blocks as b, i (i)}
      <div class="text block">
        {@html blockHtml(b)}
        {#if b.attack}
          {@const atk = b.attack}
          <div class="rolls">
            <button class="roll-btn" title="Атака и урон. {ROLL_HINT}" onclick={(e) => rolls.attack(card.name, b.name, atk.bonus, atk.damage, modeOf(e))}>
              <Dices size={13} /> Атака {signed(atk.bonus)}
            </button>
            {#each atk.damage as d, j (j)}
              <button class="roll-btn" title="Только урон. Shift — критический (кубы ×2)" onclick={(e) => rolls.damage(card.name, b.name, d, e.shiftKey)}>{d}</button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {/each}
</article>

<style>
  .statblock {
    max-width: 720px;
    line-height: 1.5;
    user-select: text;
  }
  .meta {
    margin: 0;
    color: var(--text-muted);
    font-style: italic;
  }
  .rule {
    height: 2px;
    margin: 10px 0;
    background: linear-gradient(to right, var(--accent), transparent);
    opacity: 0.6;
  }
  dl {
    margin: 0;
  }
  dl div {
    margin: 2px 0;
  }
  dt {
    display: inline;
    font-weight: 600;
  }
  dt::after {
    content: ' ';
  }
  dd {
    display: inline;
    margin: 0;
  }
  .abilities {
    border-collapse: collapse;
    text-align: center;
  }
  .abilities {
    width: 100%;
    max-width: 460px;
  }
  .abilities th,
  .abilities td {
    padding: 2px 4px;
  }
  .abilities thead th {
    font-size: 11px;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .abilities tbody th {
    font-weight: 400;
    font-size: 11px;
    color: var(--text-faint);
    text-align: right;
  }
  .score {
    font-weight: 600;
    font-size: 15px;
  }
  .prof {
    color: var(--accent-hover);
    font-weight: 600;
  }
  h3 {
    margin: 18px 0 6px;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--border);
    font-size: 15px;
    font-weight: 600;
    color: var(--accent-hover);
  }
  .text :global(p) {
    margin: 0 0 6px;
  }
  .text :global(ul) {
    margin: 0 0 6px;
    padding-left: 20px;
  }
  .block {
    margin-bottom: 4px;
  }
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
  .rolls {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: -2px 0 8px;
  }
  .roll-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .roll-btn:hover {
    border-color: var(--accent);
    color: var(--text-normal);
  }
</style>
