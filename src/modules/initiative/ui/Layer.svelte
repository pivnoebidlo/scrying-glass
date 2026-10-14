<!-- Экран игроков: полоса очерёдности сверху. Хиты, КД и стресс не показываются; обводка — сторона (партия золотая,
     союзник синий, нейтрал серый, противник красный), портрет краснеет по мере ранений (настройка), побеждённые
     остаются серыми. Спрятанных (засада) не видно. Размер и подписи — в настройках «Инициативы». -->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import type { ModuleProps } from '../../../renderer/lib/contrib';
  import { assetUrl } from '../../../shared/vault';
  import { down, ordered, woundOf } from '../order';
  import type { Combatant } from '../types';

  let { ms }: ModuleProps<'initiative'> = $props();

  const d = $derived(ms.display);
  const visible = $derived(ordered(ms.combatants).filter((c) => !c.hidden));
  const shown = $derived(ms.showToPlayers && ms.turn !== null && visible.length > 0);

  // Насколько ранен: 0 — цел, 1 — при смерти (хиты или стресс и последствия).
  const wound = (c: Combatant) => (d.wounds && !c.hideWounds ? woundOf(c) : 0);
</script>

{#if shown}
  <div class="bar {d.position ?? 'top'}" style:--s={d.size} transition:fade|global={{ duration: 300 }}>
    <div class="round">Раунд {ms.round}</div>
    <div class="list">
      {#each visible as c (c.id)}
        <div class="c {c.side}" class:turn={c.id === ms.turn} class:down={down(c)} animate:flip={{ duration: 300 }} in:fly|global={{ y: -10, duration: 250 }}>
          <div class="avatar">
            {#if c.portrait}<img src={assetUrl(c.portrait)} alt="" />{:else}<span class="letter">{c.name.slice(0, 1).toUpperCase()}</span>{/if}
            <div class="wound" style:--w={wound(c)}></div>
          </div>
          {#if d.names}<div class="name">{c.name}</div>{/if}
          {#if c.conditions.length}<div class="cond">{c.conditions.join(', ')}</div>{/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .bar {
    --u: calc(1cqmin * var(--s, 1));
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    display: flex;
    align-items: flex-start;
    gap: calc(var(--u) * 2);
    padding: calc(var(--u) * 1.5) 2cqmin calc(var(--u) * 3);
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0));
    font-family: Georgia, serif;
    color: #fff;
    pointer-events: none;
  }
  /* Снизу: затемнение от нижнего края, новые ряды растут вверх. */
  .bar.bottom {
    top: auto;
    bottom: 0;
    align-items: flex-end;
    padding: calc(var(--u) * 3) 2cqmin calc(var(--u) * 1.5);
    background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0));
  }
  .bar.bottom .list {
    flex-wrap: wrap-reverse;
  }
  .bar.bottom .round {
    padding: 0 0 calc(var(--u) * 2.6);
  }
  /* Слева и справа: столбец сверху вниз, не влезло — следующий столбец ближе к центру экрана. */
  .bar.left,
  .bar.right {
    bottom: 0;
    flex-direction: column;
    align-items: center;
    padding: 2cqmin calc(var(--u) * 1.5);
  }
  .bar.left {
    right: auto;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0));
    padding-right: calc(var(--u) * 4);
  }
  .bar.right {
    left: auto;
    background: linear-gradient(to left, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0));
    padding-left: calc(var(--u) * 4);
  }
  .bar.left .list,
  .bar.right .list {
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .bar.right .list {
    flex-wrap: wrap-reverse;
  }
  .bar.left .round,
  .bar.right .round {
    padding: 0;
  }
  .round {
    flex: none;
    padding-top: calc(var(--u) * 2.6);
    font-size: calc(var(--u) * 2.2);
    opacity: 0.8;
    white-space: nowrap;
  }
  .list {
    display: flex;
    flex-wrap: wrap;
    gap: calc(var(--u) * 1.4);
    min-width: 0;
  }
  .c {
    --ring: #e04545;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: calc(var(--u) * 11);
    opacity: 0.85;
    transition: opacity 0.3s ease, transform 0.3s ease, filter 0.4s ease;
  }
  .party {
    --ring: #e8b94a;
  }
  .ally {
    --ring: #4f8de8;
  }
  .neutral {
    --ring: #9aa0a8;
  }
  .c.turn {
    opacity: 1;
    transform: scale(1.15);
  }
  /* Побеждённый: серый и полупрозрачный, но на месте — вдруг оживят. */
  .c.down {
    opacity: 0.55;
    filter: grayscale(1) brightness(0.7);
  }
  .avatar {
    position: relative;
    display: grid;
    place-items: center;
    width: calc(var(--u) * 7);
    height: calc(var(--u) * 7);
    border: calc(var(--u) * 0.45) solid var(--ring);
    border-radius: 50%;
    overflow: hidden;
    background: color-mix(in srgb, var(--ring) 45%, #000);
    font-size: calc(var(--u) * 3);
    font-weight: 600;
    box-shadow: 0 0 calc(var(--u) * 0.8) rgba(0, 0, 0, 0.8);
  }
  .c.turn .avatar {
    box-shadow:
      0 0 0 calc(var(--u) * 0.3) #fff,
      0 0 calc(var(--u) * 2.2) calc(var(--u) * 0.4) rgba(255, 255, 255, 0.7);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  /* Ранения: портрет окрашивается в красный (оттенок, яркость картинки сохраняется) и по краям наливается
     кровью — тем сильнее, чем меньше хитов осталось. */
  .wound {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #d00000;
    mix-blend-mode: color;
    opacity: calc(var(--w, 0) * 0.9);
    box-shadow: inset 0 0 calc(var(--u) * 2.2 * var(--w, 0)) calc(var(--u) * 0.8 * var(--w, 0)) rgba(255, 0, 0, 0.9);
    transition: opacity 0.6s ease, box-shadow 0.6s ease;
  }
  .name {
    max-width: 100%;
    margin-top: calc(var(--u) * 0.6);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
    text-align: center;
    line-height: 1.15;
    font-size: calc(var(--u) * 1.6);
    text-shadow: 0 0 calc(var(--u) * 0.6) #000;
  }
  .cond {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: calc(var(--u) * 1.2);
    color: #f0c45a;
  }
</style>
