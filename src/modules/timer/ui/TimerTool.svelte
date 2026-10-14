<!-- «Инструменты» → «Таймер»: запуск (заготовки времени или своё), подпись, вид на экране игроков. Идущим
     таймером управляют здесь же или в правой панели. -->
<script lang="ts">
  import { Play } from '@lucide/svelte';
  import { dispatch, store } from '../../../renderer/lib/store.svelte';
  import type { TimerPosition, TimerStyle } from '../types';
  import Controls from './Controls.svelte';
  import Hourglass from './Hourglass.svelte';

  const ms = $derived(store.state.timer);

  let label = $state('');
  let minutes = $state(2);
  let seconds = $state(0);

  const PRESETS = [
    { t: '30 с', ms: 30_000 },
    { t: '1 мин', ms: 60_000 },
    { t: '2 мин', ms: 120_000 },
    { t: '3 мин', ms: 180_000 },
    { t: '5 мин', ms: 300_000 },
    { t: '10 мин', ms: 600_000 },
    { t: '15 мин', ms: 900_000 },
    { t: '30 мин', ms: 1_800_000 },
  ];
  const LABELS = ['Пока горит факел', 'До обрушения потолка', 'Пока действует заклинание', 'До прихода стражи', 'Пока не догорит фитиль', 'На раздумья'];
  const STYLES: [TimerStyle, string][] = [['hourglass', 'Песочные часы'], ['digits', 'Только цифры']];
  const POSITIONS: [TimerPosition, string][] = [['top-right', 'Справа вверху'], ['bottom-right', 'Справа внизу'], ['center', 'По центру, крупно']];

  const start = (duration: number) => dispatch('timer', 'start', { duration, label });
</script>

<div class="view">
  <header class="head"><h2>Таймер</h2></header>
  <p class="faint intro">
    Песочные часы или цифры на экране игроков: «пока горит факел», «до обрушения потолка», время на раздумья.
    Когда время выходит, часы вспыхивают, а у вас звучит сигнал.
  </p>

  {#if ms.active}
    <section class="running">
      <Controls {ms} big />
    </section>
  {/if}

  <section>
    <h3>{ms.active ? 'Запустить заново' : 'Запустить'}</h3>
    <label class="field">
      <span>Подпись (видят игроки, можно без неё)</span>
      <input type="text" bind:value={label} list="timer-labels" placeholder="Пока горит факел" />
      <datalist id="timer-labels">{#each LABELS as l (l)}<option value={l}></option>{/each}</datalist>
    </label>
    <div class="presets">
      {#each PRESETS as p (p.ms)}<button class="btn" onclick={() => start(p.ms)}>{p.t}</button>{/each}
    </div>
    <div class="custom">
      <input type="number" min="0" max="999" bind:value={minutes} title="Минуты" /> мин
      <input type="number" min="0" max="59" bind:value={seconds} title="Секунды" /> с
      <button class="btn primary" disabled={(minutes || 0) * 60 + (seconds || 0) < 1} onclick={() => start(((minutes || 0) * 60 + (seconds || 0)) * 1000)}>
        <Play size={14} /> Запустить
      </button>
    </div>
  </section>

  <section class="look">
    <div>
      <h3>Как видят игроки</h3>
      <div class="seg">
        {#each STYLES as [id, t] (id)}<button class:active={ms.style === id} onclick={() => dispatch('timer', 'setView', { style: id })}>{t}</button>{/each}
      </div>
      <div class="seg">
        {#each POSITIONS as [id, t] (id)}<button class:active={ms.position === id} onclick={() => dispatch('timer', 'setView', { position: id })}>{t}</button>{/each}
      </div>
      <label class="check"><input type="checkbox" checked={ms.shown} onchange={(e) => dispatch('timer', 'setView', { shown: e.currentTarget.checked })} /> Показывать игрокам</label>
      <label class="check"><input type="checkbox" checked={ms.sound} onchange={(e) => dispatch('timer', 'setView', { sound: e.currentTarget.checked })} /> Сигнал, когда время вышло (через устройство вывода музыки)</label>
    </div>
    {#if ms.style === 'hourglass'}<div class="sample"><Hourglass left={0.62} running /></div>{/if}
  </section>
</div>

<style>
  .view {
    max-width: 760px;
    padding: 16px 20px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  h3 {
    margin: 0 0 10px;
    font-size: 14px;
  }
  .intro {
    margin: 8px 0 16px;
  }
  section {
    margin-bottom: 22px;
  }
  .running {
    padding: 14px 16px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--bg-secondary);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 420px;
    margin-bottom: 10px;
  }
  .field span {
    color: var(--text-muted);
    font-size: 12px;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  .custom {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .custom input {
    width: 64px;
  }
  .look {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }
  .seg {
    display: inline-flex;
    margin: 0 8px 10px 0;
    padding: 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }
  .seg button {
    padding: 4px 10px;
    border: 0;
    border-radius: 3px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .seg button.active {
    background: var(--accent);
    color: #fff;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }
  .sample {
    flex: none;
    width: 70px;
    height: 112px;
    padding: 8px;
    border-radius: var(--radius-m);
    background: #17130f;
  }
</style>
