<!-- Добавление участников: в бой или в заготовку (encounter). Поле имени подсказывает карточки приключения
     (монстры, NPC, партия), библиотеки и SRD: выбор подсказки добавляет существо с его хитами, КД и картинками.
     Без подсказки — участник «вручную» с числами из полей. -->
<script lang="ts">
  import { thumb } from '../../../shared/vault';
  import { Plus, Shield, Skull, User, Users } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { dispatch } from '../../../renderer/lib/store.svelte';
  import { cardImageUrl, type CardSummary } from '../../../shared/cards';
  import { bestiary, connectCards } from '../../bestiary/ui/cards.svelte';
  import { addToInitiative } from '../../bestiary/ui/combat';
  import { SIDES, type Side } from '../types';
  import { addParty, suggest } from './quick';

  let { encounter }: { encounter?: string } = $props();

  onMount(connectCards);

  const num = (v: string) => (v.trim() === '' || isNaN(Number(v)) ? null : Number(v));

  let form = $state({ name: '', side: 'enemy' as Side, init: '', bonus: '', hp: '', ac: '', count: '1' });
  let focused = $state(false);
  let active = $state(0);
  let status = $state('');

  const hints = $derived((bestiary.all, suggest(form.name)));
  const open = $derived(focused && hints.length > 0);
  $effect(() => {
    form.name;
    active = 0;
  });

  const count = () => Math.max(1, Math.min(20, num(form.count) ?? 1));

  function flash(text: string) {
    status = text;
    setTimeout(() => (status = ''), 3000);
  }

  async function pick(c: CardSummary) {
    const n = count();
    await addToInitiative(c, { count: n, encounter });
    form = { ...form, name: '', count: '1' };
    flash(`Добавлено: ${c.name}${n > 1 ? ` ×${n}` : ''}`);
  }

  async function addManual() {
    const name = form.name.trim();
    if (!name) return;
    const n = count();
    for (let i = 1; i <= n; i++) {
      await dispatch('initiative', 'add', {
        c: { name: n > 1 ? `${name} ${i}` : name, side: form.side, init: num(form.init), bonus: num(form.bonus) ?? 0, maxHp: num(form.hp), ac: num(form.ac) },
        encounter,
      });
    }
    form = { ...form, name: '', init: '', hp: '', ac: '', count: '1' };
  }

  async function party() {
    const n = await addParty(encounter);
    flash(n ? `Партия: добавлено ${n}` : 'Вся партия уже здесь');
  }

  function onkeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') active = (active + 1) % hints.length;
    else if (e.key === 'ArrowUp') active = (active - 1 + hints.length) % hints.length;
    else if (e.key === 'Escape') focused = false;
    else if (e.key === 'Enter') pick(hints[active]!);
    else return;
    e.preventDefault();
  }

  const KIND_ICON = { monster: Skull, npc: User, character: Users } as const;
  // Где лежит и какая редакция: «SRD 2014», «библиотека 2024» — две «Крысы» из разных редакций различимы.
  const where = (c: CardSummary) =>
    [c.ref.scope === 'srd' ? 'SRD' : c.ref.scope === 'library' ? 'библиотека' : '', c.system.match(/\d{4}/)?.[0] ?? ''].filter(Boolean).join(' ');
</script>

<form class="add" onsubmit={(e) => { e.preventDefault(); addManual(); }}>
  <div class="name-wrap">
    <input
      class="f-name"
      type="text"
      placeholder="Имя или поиск: гоблин, Гилберт…"
      title="Начните вводить — появятся карточки приключения, библиотеки и SRD. ↑↓ и Enter — выбрать, Esc — ввести вручную"
      bind:value={form.name}
      onfocus={() => (focused = true)}
      onblur={() => setTimeout(() => (focused = false), 150)}
      oninput={() => (focused = true)}
      {onkeydown}
    />
    {#if open}
      <ul class="hints" role="listbox">
        {#each hints as c, i (c.ref.scope + c.ref.id)}
          {@const Icon = KIND_ICON[c.kind as keyof typeof KIND_ICON] ?? Skull}
          <li>
            <button type="button" class="hint" class:active={i === active} onmousedown={(e) => e.preventDefault()} onclick={() => pick(c)} onmouseenter={() => (active = i)}>
              {#if c.portrait}<img src={thumb(cardImageUrl(c.ref.scope, c.portrait), 40)} alt="" />{:else}<span class="noimg"><Icon size={14} /></span>{/if}
              <span class="t">
                <span class="n">{c.name}</span>
                <span class="s">{c.subtitle}</span>
              </span>
              {#if where(c)}<span class="w">{where(c)}</span>{/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  <select bind:value={form.side} title="Сторона для участника, введённого вручную (у карточки — своя)">
    {#each Object.entries(SIDES) as [v, t] (v)}<option value={v}>{t}</option>{/each}
  </select>
  {#if !encounter}
    <input class="f-num" type="text" inputmode="numeric" placeholder="Иниц." title="Инициатива (можно бросить потом)" bind:value={form.init} />
  {/if}
  <input class="f-num" type="text" inputmode="numeric" placeholder="Бонус" title="Бонус инициативы" bind:value={form.bonus} />
  <input class="f-num" type="text" inputmode="numeric" placeholder="Хиты" bind:value={form.hp} />
  <input class="f-num" type="text" inputmode="numeric" placeholder="КД" bind:value={form.ac} />
  <input class="f-num" type="text" inputmode="numeric" placeholder="×1" title="Сколько таких добавить (Гоблин 1, Гоблин 2, …)" bind:value={form.count} />
  <button class="btn" type="submit" disabled={!form.name.trim()} title="Добавить с введённым именем и числами"><Plus size={14} /> Добавить</button>
  <button class="btn" type="button" title="Персонажи игроков текущего приключения, которых здесь ещё нет" onclick={party}><Shield size={14} /> Партия</button>
  {#if status}<span class="status faint">{status}</span>{/if}
</form>

<style>
  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
  }
  .name-wrap {
    position: relative;
    flex: 1 1 220px;
    min-width: 180px;
  }
  .f-name {
    width: 100%;
  }
  .f-num {
    width: 64px;
  }
  .hints {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    z-index: 30;
    max-height: 340px;
    margin: 0;
    padding: 4px;
    overflow: auto;
    list-style: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }
  .hint {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 4px 6px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-normal);
    text-align: left;
    cursor: pointer;
  }
  .hint.active {
    background: var(--bg-active);
  }
  .hint img,
  .noimg {
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
  }
  .noimg {
    display: grid;
    place-items: center;
    background: var(--bg-active);
    color: var(--text-muted);
  }
  .t {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .n,
  .s {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .s {
    color: var(--text-faint);
    font-size: 12px;
  }
  .w {
    color: var(--text-faint);
    font-size: 11px;
  }
  .status {
    font-size: 12px;
  }
</style>
