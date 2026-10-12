<!-- Сцена экрана игроков: слои модулей + затемнение. Используется и в окне игроков, и в превью. -->
<script lang="ts">
  import type { AppState } from '../../shared/types';
  import { displayContributions } from './registry';

  let { state }: { state: AppState } = $props();
</script>

<div class="stage">
  {#each displayContributions as c (c.id)}
    <div class="layer">
      <c.layer ms={state[c.id]} {state} />
    </div>
  {/each}
  <div class="blackout" class:on={state.core.blackout}></div>
</div>

<style>
  /* Размеры внутри сцены задаются в единицах контейнера (cqmin), поэтому превью — точная уменьшенная копия. */
  .stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #000;
    container-type: size;
  }
  /* Сцена не зависит от стилей окна, в котором открыта. */
  .stage,
  .stage :global(*) {
    box-sizing: border-box;
  }
  .layer {
    position: absolute;
    inset: 0;
  }
  .blackout {
    position: absolute;
    inset: 0;
    background: #000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
  }
  .blackout.on {
    opacity: 1;
  }
</style>
