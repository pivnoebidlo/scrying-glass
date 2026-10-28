<!-- A D&D character as a paper character sheet — for a picture sent to a player (Telegram): parchment, the six
     abilities in framed boxes down the left, saves and skills with proficiency dots, AC / initiative / speed / HP in the
     middle, attacks and spellcasting, features and equipment on the right. Fixed width; the sender scales it to fit.
     Colours are of the paper, not of the theme (a picture). -->
<script lang="ts">
  import { tr, type Key } from '../../shared/i18n';
  import { LANGS, type Lang } from '../../shared/i18n/core';
  import { cardImageUrl, type Card, type CardScope } from '../../shared/cards';
  import { markdown } from '../../renderer/lib/markdown';
  import { ABILITIES, dict, mod, signed, SKILL_ABILITY } from './stats';
  import {
    characterInitiative, characterPb, saveBonus, skillBonus, type CharacterText, type Dnd5eCharacter,
  } from './character';

  let { card, scope }: { card: Card<Dnd5eCharacter>; scope: CardScope } = $props();

  const c = $derived(card.stats);
  const lb = $derived(dict(card.lang));
  const pb = $derived(characterPb(c));
  // Labels in the card's language, not the GM's interface: the sheet is the player's.
  const lang = $derived((card.lang in LANGS ? card.lang : 'en') as Lang);
  const t = (key: string, params?: Record<string, string | number>) => tr(lang, key as Key, params);
  const COINS = ['pp', 'gp', 'ep', 'sp', 'cp'];

  const classes = $derived(c.classes.map((x) => `${x.name}${x.subclass ? ` (${x.subclass})` : ''} ${x.level}`).join(' / '));
  const skills = $derived(
    Object.entries(SKILL_ABILITY)
      .map(([k, a]) => ({ key: k, name: lb.skills[k] ?? k, ability: a, level: c.skills[k] ?? 0, bonus: skillBonus(c, k, a) }))
      .sort((a, b) => a.name.localeCompare(b.name, card.lang)),
  );
  const passive = $derived(10 + skillBonus(c, 'perception', 'wis'));
  const sc = $derived(c.spellcasting);
  const spellDc = $derived(sc ? (sc.dc ?? 8 + pb + mod(c.abilities[sc.ability])) : 0);
  const spellAttack = $derived(sc ? (sc.attack ?? pb + mod(c.abilities[sc.ability])) : 0);
  const spellLevels = $derived(
    sc ? [...new Set([...Object.keys(sc.spells), ...Object.keys(sc.slots)])].filter((l) => sc.spells[l]?.trim() || sc.slots[l]).sort((a, b) => Number(a) - Number(b)) : [],
  );
  const portrait = $derived(card.portraits?.[0] ? cardImageUrl(scope, card.portraits[0]) : '');
  const text = (k: CharacterText) => c.text[k]?.trim() ?? '';
  const right = $derived((['features', 'traits', 'proficiencies', 'equipment'] as CharacterText[]).filter((k) => text(k)));
  const person = $derived((['personality', 'ideals', 'bonds', 'flaws'] as CharacterText[]).filter((k) => text(k)));
  const coins = $derived(COINS.filter((k) => c.coins?.[k as 'gp']));
</script>

<div class="paper">
  <header>
    {#if portrait}<img class="portrait" src={portrait} alt="" />{/if}
    <div class="name-box">
      <div class="name">{card.name}</div>
      <div class="label">{t('pap.name')}</div>
    </div>
    <div class="facts">
      <div><b>{classes || '—'}</b><span class="label">{t('pap.classLevel')}</span></div>
      <div><b>{c.background || '—'}</b><span class="label">{t('pap.background')}</span></div>
      <div><b>{c.player || '—'}</b><span class="label">{t('pap.player')}</span></div>
      <div><b>{c.race || '—'}</b><span class="label">{t('pap.race')}</span></div>
      <div><b>{c.alignment || '—'}</b><span class="label">{t('pap.alignment')}</span></div>
      <div><b>{c.xp ?? '—'}</b><span class="label">{t('pap.xp')}</span></div>
    </div>
  </header>

  <div class="cols">
    <!-- Left: abilities, saves, skills -->
    <div class="col left">
      <div class="abil-row">
        <div class="abilities">
          {#each ABILITIES as a (a)}
            <div class="ability">
              <div class="label">{lb.abilities[a]}</div>
              <div class="mod">{signed(mod(c.abilities[a]))}</div>
              <div class="score">{c.abilities[a]}</div>
            </div>
          {/each}
        </div>
        <div class="abil-side">
          <div class="pill"><span class="round">{signed(pb)}</span><span class="label">{t('dnd.sh.pb')}</span></div>
          <div class="pill"><span class="round">{c.inspiration ? '★' : ''}</span><span class="label">{t('dnd.sh.inspiration')}</span></div>
          <div class="box list">
            {#each ABILITIES as a (a)}
              <div class="line"><span class="dot" class:on={c.saves.includes(a)}></span><span class="num">{signed(saveBonus(c, a))}</span>{lb.abilities[a]}</div>
            {/each}
            <div class="label center">{t('pap.saves')}</div>
          </div>
          <div class="box list">
            {#each skills as s (s.key)}
              <div class="line"><span class="dot" class:on={s.level > 0} class:two={s.level === 2}></span><span class="num">{signed(s.bonus)}</span>{s.name}</div>
            {/each}
            <div class="label center">{t('pap.skills')}</div>
          </div>
        </div>
      </div>
      <div class="pill wide"><span class="round">{passive}</span><span class="label">{t('dnd.sh.passivePerception')}</span></div>
    </div>

    <!-- Middle: combat -->
    <div class="col mid">
      <div class="box combat">
        <div class="trio">
          <div class="shield"><div class="big">{c.ac}</div><div class="label">{t('dnd.ac')}</div></div>
          <div class="sq"><div class="big">{signed(characterInitiative(c))}</div><div class="label">{t('dnd.sh.initiative')}</div></div>
          <div class="sq"><div class="big">{c.speed}</div><div class="label">{t('dnd.sh.speed')}</div></div>
        </div>
        <div class="hp">
          <div class="small">{t('pap.hpMax')}: <b>{c.hpMax}</b></div>
          <div class="blank"></div>
          <div class="label center">{t('pap.hpNow')}</div>
        </div>
        <div class="hp short">
          <div class="blank"></div>
          <div class="label center">{t('pap.hpTemp')}</div>
        </div>
        <div class="duo">
          <div class="hp"><div class="small">{c.hitDie ? `${c.classes.reduce((n, x) => n + (x.level || 0), 0) || 1}${c.hitDie.replace(/^1/, '')}` : '—'}</div><div class="label center">{t('pap.hitDice')}</div></div>
          <div class="hp"><div class="deaths"><span>✓ ○○○</span><span>✗ ○○○</span></div><div class="label center">{t('pap.deathSaves')}</div></div>
        </div>
      </div>

      <div class="box">
        <table class="attacks">
          <thead><tr><th>{t('dnd.sh.attack')}</th><th>{t('dnd.sh.bonus')}</th><th>{t('dnd.sh.damage')}</th></tr></thead>
          <tbody>
            {#each c.attacks as a, i (i)}
              <tr><td>{a.name}</td><td>{a.bonus}</td><td>{a.damage}{a.notes ? ` · ${a.notes}` : ''}</td></tr>
            {:else}
              <tr><td>&nbsp;</td><td></td><td></td></tr><tr><td>&nbsp;</td><td></td><td></td></tr>
            {/each}
          </tbody>
        </table>
        {#if text('attacks')}<div class="md">{@html markdown(text('attacks'))}</div>{/if}
        <div class="label center">{t('pap.attacks')}</div>
      </div>

      {#if sc}
        <div class="box">
          <div class="spellhead">
            <span><span class="label">{t('dnd.sh.ability')}</span> {lb.abilities[sc.ability]}</span>
            <span><span class="label">{t('dnd.sh.dc')}</span> {spellDc}</span>
            <span><span class="label">{t('dnd.sh.atk')}</span> {signed(spellAttack)}</span>
          </div>
          {#each spellLevels as l (l)}
            <div class="spells">
              <b>{l === '0' ? t('dnd.cantrips') : t('dnd.levelN', { n: l })}</b>{#if sc.slots[l]}<span class="slots">{'○'.repeat(sc.slots[l]!)}</span>{/if}
              <div class="md">{@html markdown(sc.spells[l] ?? '')}</div>
            </div>
          {/each}
          <div class="label center">{t('dnd.spells')}</div>
        </div>
      {/if}

      {#if coins.length}
        <div class="box coins">
          {#each coins as k (k)}<span><b>{c.coins?.[k as 'gp']}</b> {t(`dnd.coinShort.${k}`)}</span>{/each}
        </div>
      {/if}
    </div>

    <!-- Right: personality, features, equipment -->
    <div class="col right">
      {#each person as k (k)}
        <div class="box"><div class="md">{@html markdown(text(k))}</div><div class="label center">{t(`dnd.text.${k}`)}</div></div>
      {/each}
      {#each right as k (k)}
        <div class="box"><div class="md">{@html markdown(text(k))}</div><div class="label center">{t(`dnd.text.${k}`)}</div></div>
      {/each}
    </div>
  </div>
</div>

<style>
  .paper {
    --ink: #2b2118;
    --line: #6b5a45;
    --faint: #7a6a55;
    box-sizing: border-box;
    width: 1180px;
    padding: 26px 28px 30px;
    background:
      radial-gradient(ellipse at 20% 10%, rgba(255, 255, 255, 0.55), transparent 60%),
      radial-gradient(ellipse at 90% 90%, rgba(160, 120, 70, 0.25), transparent 55%),
      #f3e9d2;
    color: var(--ink);
    font-family: Georgia, 'Palatino', 'Times New Roman', serif;
    font-size: 13px;
    line-height: 1.3;
    border: 2px solid #a08a68;
  }
  .label {
    color: var(--faint);
    font-family: -apple-system, 'Helvetica Neue', sans-serif;
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .center {
    display: block;
    margin-top: 4px;
    text-align: center;
  }
  header {
    display: flex;
    align-items: stretch;
    gap: 14px;
    margin-bottom: 14px;
  }
  .portrait {
    width: 92px;
    height: 92px;
    border: 2px solid var(--line);
    border-radius: 8px;
    object-fit: cover;
  }
  .name-box {
    display: flex;
    flex: 0 0 300px;
    flex-direction: column;
    justify-content: center;
    padding: 8px 14px;
    border: 2px solid var(--line);
    border-radius: 10px 30px 30px 10px;
    background: rgba(255, 255, 255, 0.45);
  }
  .name {
    border-bottom: 1px solid var(--line);
    font-size: 26px;
    font-weight: 700;
  }
  .facts {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px 14px;
    padding: 8px 14px;
    border: 2px solid var(--line);
    border-radius: 10px;
  }
  .facts > div {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid #b9a582;
  }
  .facts b {
    overflow: hidden;
    font-size: 13.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cols {
    display: grid;
    grid-template-columns: 360px 1fr 1fr;
    gap: 14px;
    align-items: start;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .abil-row {
    display: flex;
    gap: 10px;
  }
  .abilities {
    display: flex;
    flex: 0 0 92px;
    flex-direction: column;
    gap: 8px;
    padding: 8px 6px;
    border-radius: 10px;
    background: #d9c8a6;
  }
  .ability {
    position: relative;
    padding: 5px 4px 16px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: #fbf6ea;
    text-align: center;
  }
  .ability .label {
    font-size: 8.5px;
  }
  .ability .mod {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.1;
  }
  .ability .score {
    position: absolute;
    bottom: -9px;
    left: 50%;
    min-width: 30px;
    padding: 0 4px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: #fbf6ea;
    font-size: 12px;
    font-weight: 700;
    transform: translateX(-50%);
  }
  .abil-side {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
  }
  .pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-right: 8px;
    border: 2px solid var(--line);
    border-radius: 20px;
  }
  .pill.wide {
    align-self: stretch;
  }
  .round {
    display: grid;
    width: 34px;
    height: 30px;
    place-items: center;
    border-right: 2px solid var(--line);
    border-radius: 18px 0 0 18px;
    background: #fbf6ea;
    font-weight: 700;
  }
  .box {
    padding: 8px 10px 6px;
    border: 2px solid var(--line);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.35);
  }
  .list .line {
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid #cdbb98;
    font-size: 12px;
  }
  .num {
    min-width: 24px;
    font-weight: 700;
    text-align: right;
  }
  .dot {
    flex: none;
    width: 9px;
    height: 9px;
    border: 1.5px solid var(--ink);
    border-radius: 50%;
  }
  .dot.on {
    background: var(--ink);
  }
  .dot.two {
    box-shadow: 0 0 0 2px #f3e9d2, 0 0 0 3.5px var(--ink);
  }
  .combat {
    background: #e6d8bb;
  }
  .trio {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .shield,
  .sq {
    flex: 1;
    padding: 6px 4px;
    border: 2px solid var(--line);
    background: #fbf6ea;
    text-align: center;
  }
  .shield {
    border-radius: 8px 8px 50% 50% / 8px 8px 30% 30%;
  }
  .sq {
    border-radius: 8px;
  }
  .big {
    font-size: 26px;
    font-weight: 700;
  }
  .hp {
    margin-bottom: 8px;
    padding: 6px 10px 4px;
    border: 2px solid var(--line);
    border-radius: 8px;
    background: #fbf6ea;
  }
  .hp .blank {
    height: 38px;
  }
  .hp.short .blank {
    height: 22px;
  }
  .small {
    color: var(--faint);
    font-size: 12px;
  }
  .small b {
    color: var(--ink);
  }
  .duo {
    display: flex;
    gap: 8px;
  }
  .duo .hp {
    flex: 1;
    margin-bottom: 0;
    text-align: center;
  }
  .deaths {
    display: flex;
    flex-direction: column;
    font-size: 12px;
  }
  .attacks {
    width: 100%;
    border-collapse: collapse;
  }
  .attacks th {
    color: var(--faint);
    font-family: -apple-system, 'Helvetica Neue', sans-serif;
    font-size: 9.5px;
    text-align: left;
    text-transform: uppercase;
  }
  .attacks td {
    padding: 3px 4px;
    border-bottom: 1px solid #cdbb98;
    background: rgba(255, 255, 255, 0.4);
  }
  .spellhead {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    justify-content: space-between;
    margin-bottom: 6px;
    font-weight: 700;
  }
  .spells {
    margin-bottom: 4px;
  }
  .slots {
    margin-left: 8px;
    letter-spacing: 1px;
  }
  .coins {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
  }
  .md :global(p) {
    margin: 0 0 4px;
  }
  .md :global(ul) {
    margin: 0 0 4px;
    padding-left: 16px;
  }
  .md {
    font-size: 12.5px;
  }
</style>
