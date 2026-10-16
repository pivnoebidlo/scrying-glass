<!-- Имя под портретом у игроков: просто текст с тенью, лента, свиток или табличка (portraits.plate). Размеры — в em:
     размер задаёт тот, кто показывает (экран игроков — от экрана, настройки — образец). -->
<script lang="ts">
  import '../../../renderer/lib/note/fonts.css';
  import { NOTE_FONTS } from '../../../shared/notes';
  import type { NamePlate } from '../types';

  let { name, plate }: { name: string; plate: NamePlate } = $props();

  // Светлый ли цвет: от этого — цвет текста на ленте и табличке.
  function light(hex: string) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return 0.299 * r + 0.587 * g + 0.114 * b > 150;
  }

  const family = $derived(plate.font ? `'${NOTE_FONTS[plate.font].family}', Georgia, serif` : 'Georgia, serif');
  const ink = $derived(
    plate.style === 'shadow' || plate.style === 'scroll' ? plate.color : plate.style === 'plaque' ? (light(plate.color) ? '#2a1d10' : '#ecd28c') : light(plate.color) ? '#1b130c' : '#f7eedb'
  );
</script>

<div class="wrap {plate.style}">
  <span class="plate" style:--c={plate.color} style:--ink={ink} style:font-family={family}><span class="text">{name}</span></span>
</div>

<style>
  .wrap {
    display: flex;
    justify-content: center;
    max-width: 100%;
  }
  .plate {
    position: relative;
    display: block;
    max-width: 100%;
    color: var(--ink);
    line-height: 1.2;
    text-align: center;
  }
  /* Обрезка длинного имени — у текста, чтобы украшения подложки (валики свитка) не срезались. */
  .text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Тень: текст как есть. */
  .shadow .plate {
    text-shadow: 0 0 0.5em #000, 0 0.05em 0.1em #000;
  }

  /* Лента: ткань с вырезами на концах; тень — у обёртки (clip-path срезал бы box-shadow). */
  .ribbon {
    filter: drop-shadow(0 0.12em 0.15em rgba(0, 0, 0, 0.6));
  }
  .ribbon .plate {
    padding: 0.28em 1.5em;
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--c) 70%, #fff) 0%,
      var(--c) 22%,
      var(--c) 70%,
      color-mix(in srgb, var(--c) 65%, #000) 100%
    );
    clip-path: polygon(0 0, 100% 0, calc(100% - 0.65em) 50%, 100% 100%, 0 100%, 0.65em 50%);
    text-shadow: 0 0.05em 0.1em rgba(0, 0, 0, 0.45);
  }

  /* Свиток: полоса пергамента со свёрнутыми краями. */
  .scroll {
    padding: 0 0.4em;
    filter: drop-shadow(0 0.12em 0.18em rgba(0, 0, 0, 0.6));
  }
  .scroll .plate {
    padding: 0.25em 1.4em;
    border-radius: 0.1em;
    background:
      radial-gradient(ellipse at 50% 40%, rgba(255, 255, 255, 0.35), transparent 70%),
      linear-gradient(to bottom, #e9d6ab, #f3e5c4 30%, #e2cb98 85%, #c9ab72);
    text-shadow: 0 0.03em 0 rgba(255, 255, 255, 0.4);
    /* Свёрнутые края — тёмные полосы-цилиндры по бокам. */
    box-shadow:
      inset 0.55em 0 0.35em -0.3em rgba(110, 75, 30, 0.75),
      inset -0.55em 0 0.35em -0.3em rgba(110, 75, 30, 0.75);
  }
  /* Валики — свёрнутый пергамент по краям, чуть выше полосы. */
  .scroll .plate::before,
  .scroll .plate::after {
    content: '';
    position: absolute;
    top: -0.14em;
    bottom: -0.14em;
    width: 0.6em;
    border-radius: 0.3em;
    background: linear-gradient(to right, #9c7a42, #f1e1b8 40%, #e0c896 60%, #8c6a36);
    box-shadow: 0 0.05em 0.12em rgba(0, 0, 0, 0.45);
  }
  .scroll .plate::before {
    left: -0.3em;
  }
  .scroll .plate::after {
    right: -0.3em;
  }

  /* Табличка: пластина с рамкой под металл и утопленным текстом. */
  .plaque {
    filter: drop-shadow(0 0.12em 0.2em rgba(0, 0, 0, 0.7));
  }
  .plaque .plate {
    padding: 0.22em 1em;
    border: 0.12em solid #b8923f;
    border-radius: 0.3em;
    background: linear-gradient(to bottom, color-mix(in srgb, var(--c) 80%, #fff), var(--c) 45%, color-mix(in srgb, var(--c) 70%, #000));
    box-shadow:
      inset 0 0 0 0.06em rgba(255, 230, 160, 0.5),
      inset 0 0.1em 0.25em rgba(0, 0, 0, 0.5);
    text-shadow: 0 0.05em 0.08em rgba(0, 0, 0, 0.55);
    letter-spacing: 0.03em;
  }
</style>
