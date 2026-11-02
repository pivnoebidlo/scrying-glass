<!-- Имя под портретом у игроков: просто текст с тенью, лента, свиток, табличка, камень, картуш, мазок кистью или
     свечение (portraits.plate). Размеры — в em:
     размер задаёт тот, кто показывает (экран игроков — от экрана, настройки — образец). -->
<script lang="ts">
  import '../../../renderer/lib/note/fonts.css';
  import { NOTE_FONTS } from '../../../shared/notes';
  import type { NamePlate } from '../types';

  // stretch — подложка во всю ширину (под портретом — по ширине картинки), иначе по размеру имени.
  let { name, plate, stretch = false }: { name: string; plate: NamePlate; stretch?: boolean } = $props();

  // Светлый ли цвет: от этого — цвет текста на ленте и табличке.
  function luma(hex: string) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  const light = (hex: string) => luma(hex) > 150;

  const family = $derived(plate.font ? `'${NOTE_FONTS[plate.font].family}', Georgia, serif` : 'Georgia, serif');
  const ink = $derived.by(() => {
    const c = plate.color;
    switch (plate.style) {
      case 'shadow':
      case 'scroll':
        return c;
      case 'plaque':
        return light(c) ? '#2a1d10' : '#ecd28c';
      // Engraved letters: darker than the stone; only on very dark stone — lighter.
      case 'stone':
        return luma(c) > 70 ? 'color-mix(in srgb, var(--c) 30%, #000)' : 'color-mix(in srgb, var(--c) 45%, #fff)';
      case 'cartouche':
        return light(c) ? '#1b130c' : '#f3e2b0';
      case 'glow':
        return 'color-mix(in srgb, var(--c) 18%, #fff)';
      default:
        return light(c) ? '#1b130c' : '#f7eedb';
    }
  });

  const svg = (body: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' ${body}</svg>`)}")`;
  // Brush stroke: the outline of the paint, its edges torn by noise; stretched over the whole plate.
  const BRUSH = svg(
    `viewBox='0 0 400 100' preserveAspectRatio='none'><filter id='r' x='-5%' y='-20%' width='110%' height='140%'><feTurbulence type='fractalNoise' baseFrequency='0.035 0.6' numOctaves='3' seed='7'/><feDisplacementMap in='SourceGraphic' scale='16'/></filter><path filter='url(#r)' d='M16 34 Q110 14 250 20 T388 30 L380 70 Q300 90 170 84 T22 72 Q6 52 16 34 Z'/>`
  );
  // Stone grain: gray noise laid over the colour.
  const GRAIN = svg(
    `width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/>`
  );
</script>

<div class="wrap {plate.style}" class:stretch>
  <span class="plate" style:--c={plate.color} style:--ink={ink} style:--brush={BRUSH} style:--grain={GRAIN} style:font-family={family}><span class="text">{name}</span></span>
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
  .stretch .plate {
    flex: 1;
  }
  /* Обрезка длинного имени — у текста, чтобы украшения подложки (валики свитка) не срезались. Поля сверху и
     снизу — для высоких букв рукописных шрифтов («Небрежный почерк»), которые выходят за строку: без них край
     блока срезал бы их; отрицательный отступ возвращает высоту строки как была. */
  .text {
    display: block;
    margin: -0.25em 0;
    padding: 0.25em 0;
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
  /* Камень: плита с отбитыми углами, зерно поверх цвета, буквы высечены (тень снизу — светлая кромка выемки). */
  .stone {
    filter: drop-shadow(0 0.12em 0.2em rgba(0, 0, 0, 0.7));
  }
  .stone .plate {
    padding: 0.25em 1.2em;
    background:
      var(--grain),
      radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.18), transparent 60%),
      linear-gradient(to bottom, color-mix(in srgb, var(--c) 85%, #fff), var(--c) 50%, color-mix(in srgb, var(--c) 75%, #000));
    clip-path: polygon(0.4em 0, 38% 0, 40% 0.06em, calc(100% - 0.55em) 0, 100% 0.35em, 100% calc(100% - 0.3em),
      calc(100% - 0.3em) 100%, 62% 100%, 59% calc(100% - 0.07em), 0.5em 100%, 0 calc(100% - 0.45em), 0 0.3em);
    box-shadow:
      inset 0 0.08em 0.06em rgba(255, 255, 255, 0.25),
      inset 0 -0.1em 0.12em rgba(0, 0, 0, 0.45);
    text-shadow:
      0 0.04em 0 rgba(255, 255, 255, 0.35),
      0 -0.03em 0.02em rgba(0, 0, 0, 0.6);
    letter-spacing: 0.06em;
  }

  /* Картуш: поле в золотой рамке, по краям — ромбы. */
  .cartouche {
    padding: 0 0.5em;
    filter: drop-shadow(0 0.12em 0.2em rgba(0, 0, 0, 0.7));
  }
  .cartouche .plate {
    padding: 0.22em 1.3em;
    border: 0.1em solid #c9a24a;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.2), transparent 70%),
      linear-gradient(to bottom, color-mix(in srgb, var(--c) 85%, #fff), var(--c) 50%, color-mix(in srgb, var(--c) 70%, #000));
    box-shadow:
      inset 0 0 0 0.08em color-mix(in srgb, var(--c) 60%, #000),
      inset 0 0 0 0.13em rgba(233, 200, 120, 0.7);
    text-shadow: 0 0.05em 0.08em rgba(0, 0, 0, 0.55);
    letter-spacing: 0.04em;
  }
  .cartouche .plate::before,
  .cartouche .plate::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 0.62em;
    height: 0.62em;
    border: 0.08em solid #8c6a26;
    background: linear-gradient(135deg, #f3dc98, #c9a24a 50%, #8c6a26);
    transform: translateY(-50%) rotate(45deg);
  }
  .cartouche .plate::before {
    left: -0.45em;
  }
  .cartouche .plate::after {
    right: -0.45em;
  }

  /* Мазок кистью: краска с рваными краями (маска) и следами щетины. */
  .brush {
    filter: drop-shadow(0 0.08em 0.12em rgba(0, 0, 0, 0.5));
  }
  .brush .plate {
    padding: 0.4em 1.7em;
    background:
      repeating-linear-gradient(to bottom, transparent 0 0.09em, rgba(0, 0, 0, 0.12) 0.09em 0.12em, transparent 0.12em 0.2em),
      linear-gradient(100deg, color-mix(in srgb, var(--c) 80%, #fff) 0%, var(--c) 18%, var(--c) 80%, color-mix(in srgb, var(--c) 85%, #000) 100%);
    mask: var(--brush) center / 100% 100% no-repeat;
    text-shadow: 0 0.04em 0.06em rgba(0, 0, 0, 0.35);
  }

  /* Свечение: светлые буквы в ореоле цвета; поля у текста шире — иначе обрезка длинного имени срежет ореол. */
  .glow .text {
    margin: -0.8em -1em;
    padding: 0.8em 1em;
  }
  .glow .plate {
    text-shadow:
      0 0 0.06em var(--c),
      0 0 0.2em var(--c),
      0 0 0.45em var(--c),
      0 0 0.8em var(--c),
      0 0 1.4em color-mix(in srgb, var(--c) 70%, transparent);
    letter-spacing: 0.04em;
  }
</style>
