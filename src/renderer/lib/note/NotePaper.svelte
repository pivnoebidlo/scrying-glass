<!-- Записка: текст на «бумаге». Вписывается в родителя целиком (сохраняя пропорции листа) и масштабируется
     вместе с ним: размеры — в долях ширины листа (cqw), поэтому плитка, предпросмотр и экран игроков выглядят
     одинаково. Бумага рисуется SVG-фильтрами (зерно, пятна, затемнение к краям), края — по зерну записки. -->
<script lang="ts">
  import './fonts.css';
  import { NOTE_FONTS, NOTE_INKS, NOTE_SHAPES, STROKE_WIDTHS, strokePath, type Note, type NoteInk, type StrokeWidth } from '../../../shared/notes';
  import { noteHtml } from './markup';
  import { creaseSvg, holesMask, markDefs, marksSvg, rng } from './marks';

  // edit — редактор следов: выбранный след и нажатие на лист (id следа или null — мимо следов; x, y — доли листа).
  // pen — the pen is in hand: a drag draws a stroke (onstroke, points in fractions of the sheet), with `erase` —
  // a touch takes away the stroke under it (onerase, its index).
  interface Edit {
    selected: string | null;
    placing: boolean;
    onpick: (e: PointerEvent, id: string | null, x: number, y: number) => void;
    pen?: { ink: NoteInk; width: StrokeWidth; erase: boolean; onstroke: (points: number[]) => void; onerase: (i: number) => void } | null;
  }
  let {
    note,
    shadow = false,
    overflow = $bindable(false),
    edit,
  }: { note: Note; shadow?: boolean; overflow?: boolean; edit?: Edit } = $props();

  // У каждой записки на странице свои id фильтров (их может быть много — плитки).
  const uid = 'n' + Math.random().toString(36).slice(2, 9);

  const PAPER = {
    parchment: { base: '#e3c58f', mottle: '#9c6a2e', vignette: '#5e3815', grain: '#4a2a10', ink: '#3b2412', fiber: '#f6e6c2' },
    paper: { base: '#ecdfc0', mottle: '#b48f55', vignette: '#7a5a30', grain: '#5a4020', ink: '#2b1d10', fiber: '#fbf4e2' },
    vellum: { base: '#f4ecda', mottle: '#cbb48a', vignette: '#9a845c', grain: '#6a5a40', ink: '#1f1a14', fiber: '#fffaf0' },
    dark: { base: '#3d2b1f', mottle: '#120b06', vignette: '#000000', grain: '#000000', ink: '#ead9b2', fiber: '#5a4330' },
  } as const;

  const aspect = $derived(NOTE_SHAPES[note.shape].aspect);
  const W = 1000;
  const H = $derived(Math.round(W / aspect));
  const p = $derived(PAPER[note.paper]);
  const ink = $derived(NOTE_INKS[note.ink].color || p.ink);
  const scroll = $derived(note.shape === 'scroll');
  const rollH = 46;

  // Контур листа: ровный, рваный (мелкие острые зубцы) или обгоревший (плавные волны с выгрызами).
  const outline = $derived.by(() => {
    const r = rng(note.seed);
    const x0 = scroll ? W * 0.035 : 0;
    const x1 = scroll ? W * 0.965 : W;
    const y0 = scroll ? rollH * 0.5 : 0;
    const y1 = scroll ? H - rollH * 0.5 : H;
    const m = note.edge === 'straight' ? 4 : note.edge === 'torn' ? 16 : 26;
    if (note.edge === 'straight') return `M${x0 + m} ${y0 + m}H${x1 - m}V${y1 - m}H${x0 + m}Z`;
    const step = note.edge === 'torn' ? 13 : 34;
    const amp = note.edge === 'torn' ? 11 : 22;
    const pts: [number, number][] = [];
    // Точка на стороне: смещение внутрь листа на случайную глубину; изредка — глубокий выгрыз.
    const side = (ax: number, ay: number, bx: number, by: number, nx: number, ny: number, flat: boolean) => {
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.max(2, Math.round(len / step));
      for (let i = 0; i < n; i++) {
        const t = i / n;
        let d = flat ? m : m - amp / 2 + r() * amp;
        if (!flat && r() < 0.06) d += amp * (1 + r() * 1.5);
        pts.push([ax + (bx - ax) * t + nx * d, ay + (by - ay) * t + ny * d]);
      }
    };
    side(x0, y0, x1, y0, 0, 1, scroll);
    side(x1, y0, x1, y1, -1, 0, false);
    side(x1, y1, x0, y1, 0, -1, scroll);
    side(x0, y1, x0, y0, 1, 0, false);
    if (note.edge === 'torn') return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
    // Обгоревший: сглаживаем ломаную квадратичными кривыми через середины отрезков.
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i]!;
      const [bx, by] = pts[(i + 1) % pts.length]!;
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      d += i === 0 ? `M${mx.toFixed(1)} ${my.toFixed(1)}` : `Q${ax.toFixed(1)} ${ay.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    const [ax, ay] = pts[0]!;
    const [bx, by] = pts[1]!;
    return d + `Q${ax.toFixed(1)} ${ay.toFixed(1)} ${((ax + bx) / 2).toFixed(1)} ${((ay + by) / 2).toFixed(1)}Z`;
  });

  // Пятна «старости»: несколько бледных кругов в случайных местах (у тёмной кожи — потёртости).
  const spots = $derived.by(() => {
    const r = rng(note.seed + 7);
    const n = note.paper === 'vellum' ? 3 : 6;
    return Array.from({ length: n }, () => ({ x: W * (0.1 + r() * 0.8), y: H * (0.1 + r() * 0.8), r: 20 + r() * 70, o: 0.08 + r() * 0.12 }));
  });

  // Цвет из «#rrggbb» в доли для feColorMatrix.
  const rgb = (hex: string) => [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3));

  const marks = $derived(marksSvg(note.marks, uid, H, p.mottle));
  const crease = $derived(creaseSvg(note.crease, note.seed, H, uid));
  const mask = $derived(holesMask(note.marks, H));

  function pick(e: PointerEvent, id: string | null) {
    if (!edit || e.button !== 0) return;
    const box = (e.currentTarget as Element).closest('svg')!.getBoundingClientRect();
    edit.onpick(e, id, (e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height);
  }
  // The pen: the stroke being drawn is shown at once; a short stroke stays as a dot.
  const strokeInk = (k: NoteInk) => NOTE_INKS[k].color || ink;
  let live = $state<number[] | null>(null);
  function penDown(e: PointerEvent) {
    const pen = edit?.pen;
    if (!pen || e.button !== 0) return;
    e.preventDefault();
    const box = (e.currentTarget as Element).getBoundingClientRect();
    const at = (ev: PointerEvent) => [(ev.clientX - box.left) / box.width, (ev.clientY - box.top) / box.height] as const;
    if (pen.erase) {
      const erase = (ev: PointerEvent) => {
        const i = strokeAt(...at(ev), box.width);
        if (i >= 0) pen.onerase(i);
      };
      erase(e);
      const up = () => (window.removeEventListener('pointermove', erase), window.removeEventListener('pointerup', up));
      window.addEventListener('pointermove', erase);
      window.addEventListener('pointerup', up);
      return;
    }
    const pts: number[] = [...at(e)];
    live = pts;
    const move = (ev: PointerEvent) => {
      const [x, y] = at(ev);
      // Every point at least ~2 px from the last: a lighter file, a smoother line.
      if (Math.hypot((x - pts.at(-2)!) * box.width, (y - pts.at(-1)!) * box.height) < 2) return;
      pts.push(+x.toFixed(4), +y.toFixed(4));
      live = [...pts];
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      live = null;
      pen.onstroke(pts.length >= 4 ? pts : [...pts, pts[0]! + 0.0005, pts[1]!]);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  // The topmost stroke within reach of (x, y): the distance to its points, in pixels of the sheet on screen.
  function strokeAt(x: number, y: number, px: number): number {
    for (let i = note.strokes.length - 1; i >= 0; i--) {
      const s = note.strokes[i]!;
      const reach = Math.max(6, (s.width * px) / 2 + 4);
      for (let k = 0; k < s.points.length; k += 2) {
        if (Math.hypot((s.points[k]! - x) * px, (s.points[k + 1]! - y) * px / aspect) < reach) return i;
      }
    }
    return -1;
  }


  // Неровный почерк: каждая буква чуть повёрнута, сдвинута и другого размера (по зерну записки). Слова не
  // разрываются (буквы — inline-block, иначе строка рвалась бы где угодно).
  function shake(src: string, amount: number, seed: number): string {
    if (amount <= 0) return src;
    const r = rng(seed + 55);
    const t = document.createElement('template');
    t.innerHTML = src;
    const walker = document.createTreeWalker(t.content, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    while (walker.nextNode()) texts.push(walker.currentNode as Text);
    for (const node of texts) {
      const frag = document.createDocumentFragment();
      for (const part of node.data.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.append(part);
          continue;
        }
        const word = document.createElement('span');
        word.className = 'w';
        for (const ch of part) {
          const l = document.createElement('span');
          l.className = 'l';
          l.textContent = ch;
          const rot = (r() - 0.5) * amount * 34;
          const dx = (r() - 0.5) * amount * 0.08;
          const dy = (r() - 0.5) * amount * 0.3;
          const sc = 1 + (r() - 0.5) * amount * 0.4;
          l.style.transform = `translate(${dx.toFixed(3)}em, ${dy.toFixed(3)}em) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
          word.append(l);
        }
        frag.append(word);
      }
      node.replaceWith(frag);
    }
    return t.innerHTML;
  }

  const html = $derived(shake(noteHtml(note.text), note.shaky, note.seed));

  let content = $state<HTMLDivElement>();
  // Не влезает ли текст в лист (предупреждение в редакторе).
  $effect(() => {
    const el = content;
    void html;
    void note.size;
    void note.font;
    void note.shape;
    if (!el) return;
    const check = () => (overflow = el.scrollHeight > el.clientHeight + 2);
    check();
    document.fonts?.ready.then(check);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<div class="fit">
  <div class="sheet" class:shadow style:aspect-ratio="{aspect}" style:--a={aspect} style:--ink={ink}>
    <div class="layers" style:mask-image={mask} style:-webkit-mask-image={mask}>
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id="{uid}-clip"><path d={outline} /></clipPath>
          <filter id="{uid}-mottle" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="4" seed={note.seed % 1000} />
            <feColorMatrix type="matrix" values="0 0 0 0 {rgb(p.mottle)[0]}  0 0 0 0 {rgb(p.mottle)[1]}  0 0 0 0 {rgb(p.mottle)[2]}  1.8 0 0 0 -0.7" />
          </filter>
          <filter id="{uid}-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed={(note.seed + 3) % 1000} />
            <feColorMatrix type="matrix" values="0 0 0 0 {rgb(p.grain)[0]}  0 0 0 0 {rgb(p.grain)[1]}  0 0 0 0 {rgb(p.grain)[2]}  1.4 0 0 0 -0.55" />
          </filter>
          <filter id="{uid}-blur"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id="{uid}-soft"><feGaussianBlur stdDeviation="4" /></filter>
          <radialGradient id="{uid}-vig" cx="50%" cy="50%" r="72%">
            <stop offset="55%" stop-color={p.vignette} stop-opacity="0" />
            <stop offset="100%" stop-color={p.vignette} stop-opacity={note.paper === 'dark' ? 0.75 : 0.55} />
          </radialGradient>
          <radialGradient id="{uid}-spot">
            <stop offset="0%" stop-color={p.mottle} stop-opacity="0.9" />
            <stop offset="70%" stop-color={p.mottle} stop-opacity="0.35" />
            <stop offset="100%" stop-color={p.mottle} stop-opacity="0" />
          </radialGradient>
          <linearGradient id="{uid}-roll" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={p.vignette} />
            <stop offset="45%" stop-color={p.fiber} />
            <stop offset="100%" stop-color={p.vignette} />
          </linearGradient>
        </defs>

        <g clip-path="url(#{uid}-clip)">
          <rect width={W} height={H} fill={p.base} />
          <rect width={W} height={H} filter="url(#{uid}-mottle)" opacity={note.paper === 'vellum' ? 0.35 : 0.6} />
          {#each spots as s, i (i)}<circle cx={s.x} cy={s.y} r={s.r} fill="url(#{uid}-spot)" opacity={s.o} />{/each}
          <rect width={W} height={H} fill="url(#{uid}-vig)" />
          <rect width={W} height={H} filter="url(#{uid}-grain)" opacity="0.22" />
          {#if note.edge === 'burnt'}
            <!-- Обуглившийся край: тёмная размытая кайма по контуру, внутри листа. -->
            <path d={outline} fill="none" stroke="#1e0e04" stroke-width="70" filter="url(#{uid}-blur)" opacity="0.95" />
            <path d={outline} fill="none" stroke="#120802" stroke-width="10" filter="url(#{uid}-soft)" />
          {:else if note.edge === 'torn'}
            <!-- Рваный край: светлые волокна бумаги по разрыву. -->
            <path d={outline} fill="none" stroke={p.fiber} stroke-width="5" opacity="0.7" />
          {/if}
        </g>

        {#if scroll}
          {#each [0, H - rollH] as y (y)}
            <rect x="0" {y} width={W} height={rollH} rx={rollH / 2} fill="url(#{uid}-roll)" />
            <rect x="0" y={y + rollH * 0.2} width="22" height={rollH * 0.6} rx="6" fill="#3a2414" />
            <rect x={W - 22} y={y + rollH * 0.2} width="22" height={rollH * 0.6} rx="6" fill="#3a2414" />
          {/each}
        {/if}
      </svg>

      <div
        class="content {note.align}"
        class:scroll
        bind:this={content}
        style:font-family="'{NOTE_FONTS[note.font].family}', serif"
        style:font-size="{note.size}cqw"
      >
        <!-- Текст экранирован в noteHtml. -->
        {@html html}
        {#if note.signature.trim()}
          <div class="signature" style:font-family="'{NOTE_FONTS[note.signatureFont].family}', serif">{note.signature}</div>
        {/if}
      </div>

      <!-- Drawn with the pen: ink like the text, a little rough at the edge; the marks lie over it. -->
      {#if note.strokes.length}
        <svg class="ink" viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="{uid}-pen" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed={note.seed % 997} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
            </filter>
          </defs>
          <g clip-path="url(#{uid}-clip)" filter="url(#{uid}-pen)" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.92">
            {#each note.strokes as s, i (i)}<path d={strokePath(s.points, W, H)} stroke={strokeInk(s.ink)} stroke-width={s.width * W} />{/each}
          </g>
        </svg>
      {/if}

  
      <!-- Следы и складки — поверх текста: пятно темнит и бумагу, и буквы под собой. -->
      {#if marks.multiply || marks.normal || marks.top}
        <svg class="multiply" viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
          <!-- SVG собран из чисел в marks.ts. -->
          <defs>{@html markDefs(uid)}</defs>
          <g clip-path="url(#{uid}-clip)">{@html marks.multiply}</g>
        </svg>
        <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
          <g clip-path="url(#{uid}-clip)">{@html marks.normal}</g>
          <!-- Печати лежат на листе, а не в нём: край бумаги их не обрезает. -->
          {@html marks.top}
        </svg>
      {/if}
      {#if crease}
        <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
          <g clip-path="url(#{uid}-clip)">{@html crease}</g>
        </svg>
      {/if}
    </div>

    {#if edit?.pen}
      <svg class="edit pen" class:erase={edit.pen.erase} viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="presentation" onpointerdown={penDown}>
        {#if live}
          <path d={strokePath(live, W, H)} fill="none" stroke={strokeInk(edit.pen.ink)} stroke-width={STROKE_WIDTHS[edit.pen.width] * W} stroke-linecap="round" stroke-linejoin="round" />
        {/if}
      </svg>
    {:else if edit}
      <svg class="edit" class:placing={edit.placing} viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="presentation" onpointerdown={(e) => pick(e, null)}>
        {#each note.marks as m (m.id)}
          <circle
            class="hit"
            role="presentation"
            cx={m.x * W}
            cy={m.y * H}
            r={m.size * W * 0.4}
            onpointerdown={(e) => (e.stopPropagation(), pick(e, m.id))}
          />
          {#if m.id === edit.selected}
            <circle class="sel" cx={m.x * W} cy={m.y * H} r={(m.size * W) / 2} />
          {/if}
        {/each}
      </svg>
    {/if}
  </div>
</div>

<style>
  .fit {
    container-type: size;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }
  .sheet {
    container-type: inline-size;
    position: relative;
    /* Вписать лист в родителя: по ширине или по высоте — что раньше упрётся. */
    width: min(100cqw, calc(100cqh * var(--a, 1)));
    max-height: 100cqh;
  }
  .sheet.shadow {
    filter: drop-shadow(0 1.2cqw 3cqw rgba(0, 0, 0, 0.6));
  }
  .layers {
    position: absolute;
    inset: 0;
    mask-size: 100% 100%;
    -webkit-mask-size: 100% 100%;
  }
  svg.multiply {
    mix-blend-mode: multiply;
  }
  svg:not(.edit) {
    pointer-events: none;
  }
  .edit .hit {
    fill: transparent;
    cursor: move;
  }
  .edit.placing,
  .edit.placing .hit {
    cursor: crosshair;
  }
  .edit.pen {
    cursor: crosshair;
    touch-action: none;
  }
  .edit.pen.erase {
    cursor: cell;
  }
  .edit .sel {
    fill: none;
    stroke: #fff;
    stroke-width: 2.5;
    stroke-dasharray: 10 7;
    vector-effect: non-scaling-stroke;
    filter: drop-shadow(0 0 2px #000);
    pointer-events: none;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  /* Поле текста — 9 и 10cqw от края листа. Часть его отдана внутреннему отступу: высокие буквы рукописных шрифтов
     (краткая над «Й», завитки) и пляшущие буквы выходят за строку и иначе обрезались бы краем блока. */
  .content {
    position: absolute;
    inset: 5cqw 7cqw;
    padding: 4cqw 3cqw;
    overflow: hidden;
    color: var(--ink);
    line-height: 1.35;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .content.scroll {
    inset: 10cqw 9cqw;
  }
  .content.center {
    text-align: center;
  }
  .content.justify {
    text-align: justify;
  }
  .content :global(p) {
    margin: 0 0 0.6em;
  }
  .content :global(ul) {
    margin: 0 0 0.6em;
    padding-left: 1.2em;
  }
  .content :global(h1),
  .content :global(h2) {
    margin: 0 0 0.4em;
    font-weight: inherit;
    line-height: 1.15;
    text-align: center;
  }
  .content :global(h1) {
    font-size: 1.7em;
  }
  .content :global(h2) {
    font-size: 1.3em;
  }
  .content :global(.orn) {
    margin: 0.3em 0 0.6em;
    font-family: serif;
    text-align: center;
    opacity: 0.8;
  }
  .signature {
    margin-top: 0.4em;
    font-size: 1.35em;
    text-align: right;
  }
  .content :global(.w) {
    white-space: nowrap;
  }
  .content :global(.l) {
    display: inline-block;
  }
</style>
