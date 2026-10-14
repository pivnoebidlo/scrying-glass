<!-- Свои расы и подрасы: название, бонусы к характеристикам и «+1 на выбор». Подраса — к своей расе или к встроенной
     («Эльф → Лесной»). Сохраняется само, в библиотеку (общее для всех кампаний). -->
<script lang="ts">
  import { Plus, Trash2 } from '@lucide/svelte';
  import { ABILITIES, type Ability } from '../../../systems/dnd5e/stats';
  import type { RaceBonus } from '../../../systems/dnd5e/pointbuy';
  import { allRaces, custom, newId, saveRaces } from './races.svelte';

  let { onpick }: { onpick: (race: string, sub: string | null) => void } = $props();

  const SHORT: Record<Ability, string> = { str: 'Сил', dex: 'Лов', con: 'Тел', int: 'Инт', wis: 'Мдр', cha: 'Хар' };
  const races = $derived(allRaces());
  const titleOf = (id: string) => races.find((r) => r.id === id)?.title ?? '?';
  // Подрасы пользователя по расам, к которым они относятся (встроенные — отдельной группой).
  const parents = $derived([...new Set(custom.subraces.map((s) => s.parent))].filter((p) => !custom.races.some((r) => r.id === p)));

  let parentPick = $state('');

  function addRace() {
    const id = newId();
    custom.races.push({ id, title: 'Новая раса', fixed: {}, subraces: [] });
    saveRaces();
    onpick(id, null);
  }

  function addSub(parent: string) {
    if (!parent) return;
    const id = newId();
    custom.subraces.push({ id, parent, title: 'Новая подраса', fixed: {} });
    parentPick = '';
    saveRaces();
    onpick(parent, id);
  }

  function setBonus(r: RaceBonus, a: Ability, v: number) {
    r.fixed = { ...r.fixed, [a]: v || undefined };
    if (r.choose) r.choose = { ...r.choose, except: ABILITIES.filter((x) => (r.fixed[x] ?? 0) > 0) };
    saveRaces();
  }

  function setChoose(r: RaceBonus, count: number) {
    // «+1 на выбор» — к характеристикам без постоянного бонуса.
    r.choose = count ? { count, except: ABILITIES.filter((a) => (r.fixed[a] ?? 0) > 0) } : undefined;
    saveRaces();
  }

  function removeRace(id: string) {
    if (!confirm(`Удалить расу «${titleOf(id)}» и её подрасы?`)) return;
    custom.races = custom.races.filter((r) => r.id !== id);
    custom.subraces = custom.subraces.filter((s) => s.parent !== id);
    saveRaces();
  }

  function removeSub(id: string) {
    custom.subraces = custom.subraces.filter((s) => s.id !== id);
    saveRaces();
  }
</script>

{#snippet bonuses(r: RaceBonus)}
  <div class="bonuses">
    {#each ABILITIES as a (a)}
      <label title={SHORT[a]}>
        <span>{SHORT[a]}</span>
        <select value={r.fixed[a] ?? 0} onchange={(e) => setBonus(r, a, Number(e.currentTarget.value))}>
          {#each [-2, -1, 0, 1, 2, 3] as v (v)}<option value={v}>{v > 0 ? `+${v}` : v === 0 ? '—' : v}</option>{/each}
        </select>
      </label>
    {/each}
    <label title="Сколько характеристик получают +1 на выбор игрока (как у полуэльфа)">
      <span>+1 на выбор</span>
      <select value={r.choose?.count ?? 0} onchange={(e) => setChoose(r, Number(e.currentTarget.value))}>
        {#each [0, 1, 2, 3] as v (v)}<option value={v}>{v || '—'}</option>{/each}
      </select>
    </label>
  </div>
{/snippet}

<div class="editor">
  {#each custom.races as r (r.id)}
    <div class="race">
      <div class="row">
        <input class="title" type="text" bind:value={r.title} oninput={saveRaces} />
        <button class="icon-btn" title="Добавить подрасу" onclick={() => addSub(r.id)}><Plus size={14} /></button>
        <button class="icon-btn" title="Удалить расу" onclick={() => removeRace(r.id)}><Trash2 size={14} /></button>
      </div>
      {@render bonuses(r)}
      {#each custom.subraces.filter((s) => s.parent === r.id) as s (s.id)}
        <div class="sub">
          <div class="row">
            <input class="title" type="text" bind:value={s.title} oninput={saveRaces} />
            <button class="icon-btn" title="Удалить подрасу" onclick={() => removeSub(s.id)}><Trash2 size={14} /></button>
          </div>
          {@render bonuses(s)}
        </div>
      {/each}
    </div>
  {/each}

  {#each parents as p (p)}
    <div class="race">
      <div class="row"><span class="parent">{titleOf(p)}</span><span class="faint">встроенная раса</span></div>
      {#each custom.subraces.filter((s) => s.parent === p) as s (s.id)}
        <div class="sub">
          <div class="row">
            <input class="title" type="text" bind:value={s.title} oninput={saveRaces} />
            <button class="icon-btn" title="Удалить подрасу" onclick={() => removeSub(s.id)}><Trash2 size={14} /></button>
          </div>
          {@render bonuses(s)}
        </div>
      {/each}
    </div>
  {/each}

  <div class="add">
    <button class="btn" onclick={addRace}><Plus size={14} /> Новая раса</button>
    <select bind:value={parentPick} onchange={() => addSub(parentPick)}>
      <option value="">Новая подраса к…</option>
      {#each races as r (r.id)}<option value={r.id}>{r.title}</option>{/each}
    </select>
  </div>
  <p class="faint hint">Бонусы подрасы складываются с бонусами расы. Свои расы хранятся в библиотеке — они общие для всех кампаний.</p>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .race {
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-m);
  }
  .sub {
    margin: 10px 0 0 18px;
    padding-left: 10px;
    border-left: 2px solid var(--border);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .title {
    flex: 1;
    font-weight: 500;
  }
  .parent {
    font-weight: 600;
  }
  .bonuses {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
  }
  .bonuses label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .add {
    display: flex;
    gap: 8px;
  }
  .hint {
    margin: 0;
    font-size: 12px;
  }
</style>
