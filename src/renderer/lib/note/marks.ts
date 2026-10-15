// Следы на записке (кровь, отпечатки, подпалины…) и помятость бумаги — SVG-строками по зерну: тот же след —
// тот же рисунок на плитке, в редакторе и у игроков. Лист — 1000 единиц в ширину (как у NotePaper), след
// рисуется в своих единицах (поперечник 200) и ставится на лист преобразованием.
// Слои: `multiply` (пятна темнят бумагу и текст под собой) и `normal` (воск, блики, тлеющий край).
import { markTint, NOTE_MARKS, NOTE_TINTS, type NoteCrease, type NoteMark } from '../../../shared/notes';

export const SHEET_W = 1000;

// Детерминированный генератор случайных чисел.
export function rng(seed: number) {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
type Pt = [number, number];

const f = (n: number) => n.toFixed(1);

// Темнее или светлее: k < 1 — к чёрному, k > 1 — к белому.
export function shade(hex: string, k: number): string {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const out = c.map((v) => Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1)));
  return '#' + out.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

// Замкнутая ломаная → плавный контур (квадратичные кривые через середины отрезков).
export function smooth(pts: Pt[]): string {
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const m = mid(a, pts[(i + 1) % pts.length]!);
    d += i === 0 ? `M${f(m[0])} ${f(m[1])}` : `Q${f(a[0])} ${f(a[1])} ${f(m[0])} ${f(m[1])}`;
  }
  const a = pts[0]!;
  const m = mid(a, pts[1]!);
  return d + `Q${f(a[0])} ${f(a[1])} ${f(m[0])} ${f(m[1])}Z`;
}

const poly = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';

// Неровное пятно: радиус гуляет плавно (сумма синусов) и чуть-чуть случайно.
function blobPts(r: Rand, cx: number, cy: number, R: number, irr: number, n = 24): Pt[] {
  const waves = [2, 3, 5].map((k) => ({ k, ph: r() * Math.PI * 2, a: r() }));
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const w = waves.reduce((s, v) => s + v.a * Math.sin(v.k * t + v.ph), 0) / 1.5;
    const rad = R * (1 + irr * (w + (r() - 0.5) * 0.5));
    return [cx + Math.cos(t) * rad, cy + Math.sin(t) * rad] as Pt;
  });
}
const blob = (r: Rand, cx: number, cy: number, R: number, irr: number, n?: number) => smooth(blobPts(r, cx, cy, R, irr, n));

const circle = (x: number, y: number, rad: number, fill: string, op = 1) =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${fill}" opacity="${op.toFixed(2)}"/>`;

// Мелкие брызги вокруг: направление `dir` с разбросом `spread` (рад), дальше — мельче.
function satellites(r: Rand, c: string, n: number, from: number, to: number, size: number, dir: number, spread: number): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = dir + (r() - 0.5) * spread;
    const t = Math.pow(r(), 1.4);
    const d = from + t * (to - from);
    s += circle(Math.cos(a) * d, Math.sin(a) * d, 0.6 + r() * size * (1 - t * 0.7), c, 0.75 + r() * 0.25);
  }
  return s;
}

// Пятно жидкости: заливка + темнее по краю (так высыхает кровь и чернила).
const liquid = (d: string, c: string, op = 0.9) =>
  `<path d="${d}" fill="${c}" opacity="${op}"/><path d="${d}" fill="none" stroke="${shade(c, 0.55)}" stroke-width="2.5" opacity="0.55"/>`;

interface Parts {
  multiply: string;
  normal: string;
}

// Что рисует каждый вид — в своих единицах (поперечник около 200, середина в 0, 0).
// uid — для id фильтров и масок; stain — цвет пятен бумаги (разводы воды).
export function markShape(m: NoteMark, uid: string, stain: string): Parts {
  const r = rng(m.seed);
  const tint = markTint(m);
  const c = tint ? NOTE_TINTS[tint].color : '#000000';
  const key = `${uid}-${m.id}`;
  const rough = `filter="url(#${uid}-rough)"`;
  switch (m.kind) {
    case 'splatter': {
      const R = 26 + r() * 12;
      const dir = r() * Math.PI * 2;
      let spikes = '';
      const n = 6 + Math.floor(r() * 8);
      for (let i = 0; i < n; i++) {
        const a = dir + (r() - 0.5) * Math.PI * 1.6;
        const len = 25 + r() * 50;
        const w = 3 + r() * 7;
        const base = R * 0.7;
        const nx = -Math.sin(a);
        const ny = Math.cos(a);
        const bx = Math.cos(a) * base;
        const by = Math.sin(a) * base;
        const tx = Math.cos(a) * (base + len);
        const ty = Math.sin(a) * (base + len);
        spikes += `<path d="M${f(bx + nx * w)} ${f(by + ny * w)}Q${f((bx + tx) / 2 + nx * w * 0.4)} ${f((by + ty) / 2 + ny * w * 0.4)} ${f(tx)} ${f(ty)}Q${f((bx + tx) / 2 - nx * w * 0.4)} ${f((by + ty) / 2 - ny * w * 0.4)} ${f(bx - nx * w)} ${f(by - ny * w)}Z" fill="${c}" opacity="0.88"/>`;
        spikes += circle(tx + Math.cos(a) * (3 + w * 0.4), ty + Math.sin(a) * (3 + w * 0.4), 1.5 + w * 0.45, c, 0.9);
      }
      const multiply = `<g ${rough}>${liquid(blob(r, 0, 0, R, 0.25), c)}${spikes}${satellites(r, c, 22 + Math.floor(r() * 26), R * 1.1, 98, 3.8, dir, Math.PI * 1.3)}</g>`;
      return { multiply, normal: '' };
    }
    case 'drops': {
      const n = 3 + Math.floor(r() * 4);
      let s = '';
      for (let i = 0; i < n; i++) {
        const x = -70 + (140 * i) / (n - 1) + (r() - 0.5) * 20;
        const y = (r() - 0.5) * 50;
        const R = 7 + r() * 14;
        s += liquid(blob(r, x, y, R, 0.12, 16), c, 0.88);
        s += `<g transform="translate(${f(x)} ${f(y)})">${satellites(r, c, Math.floor(r() * 5), R * 1.2, R * 2.2, 1.6, r() * 6.3, 6.3)}</g>`;
      }
      return { multiply: `<g ${rough}>${s}</g>`, normal: '' };
    }
    case 'blot': {
      const R = 42 + r() * 10;
      let spikes = '';
      for (let i = 0; i < 4; i++) {
        const a = r() * Math.PI * 2;
        spikes += `<path d="M0 0L${f(Math.cos(a + 0.12) * R)} ${f(Math.sin(a + 0.12) * R)}L${f(Math.cos(a) * (R + 14 + r() * 22))} ${f(Math.sin(a) * (R + 14 + r() * 22))}L${f(Math.cos(a - 0.12) * R)} ${f(Math.sin(a - 0.12) * R)}Z" fill="${c}" opacity="0.92"/>`;
      }
      const multiply = `<g ${rough}>${liquid(blob(r, 0, 0, R, 0.35, 18), c, 0.92)}${spikes}${satellites(r, c, 8, R * 1.15, 96, 5, 0, Math.PI * 2)}</g>`;
      return { multiply, normal: '' };
    }
    case 'smear': {
      let s = `<path d="M-88 ${f((r() - 0.5) * 20)}C-30 ${f((r() - 0.5) * 50)} 30 ${f((r() - 0.5) * 50)} 88 ${f((r() - 0.5) * 20)}" fill="none" stroke="${c}" stroke-width="42" stroke-linecap="round" opacity="0.18"/>`;
      for (let i = 0; i < 10; i++) {
        const o = (r() - 0.5) * 48;
        const w = 2 + r() * 10;
        const len = 120 + r() * 70;
        const d = `M${f(-90 + r() * 15)} ${f(o + (r() - 0.5) * 8)}C${f(-30)} ${f(o + (r() - 0.5) * 16)} ${f(30)} ${f(o + (r() - 0.5) * 16)} ${f(90 - r() * 25)} ${f(o + (r() - 0.5) * 8)}`;
        s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-dasharray="${f(len)} ${f(4 + r() * 14)} ${f(6 + r() * 20)} 400" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`;
      }
      return { multiply: `<g ${rough}>${s}</g>`, normal: '' };
    }
    case 'fingerprint': {
      // Завиток из волнистых колец с разрывами; края и пропуски — маской (палец давил неровно).
      let ridges = '';
      const cy = 8;
      for (let i = 1; i <= 15; i++) {
        const pts: Pt[] = Array.from({ length: 36 }, (_, k) => {
          const t = (k / 36) * Math.PI * 2;
          const w = 1 + (r() - 0.5) * 0.05;
          return [Math.cos(t) * i * 4.8 * w, cy - i * 0.8 + Math.sin(t) * i * 6.4 * w] as Pt;
        });
        const dash = Array.from({ length: 6 }, (_, k) => f(k % 2 ? 2 + r() * 6 : 15 + r() * 60)).join(' ');
        ridges += `<path d="${smooth(pts)}" fill="none" stroke="${c}" stroke-width="2.6" stroke-dasharray="${dash}"/>`;
      }
      let holes = '';
      for (let i = 0; i < 4; i++) holes += `<path d="${blob(r, (r() - 0.5) * 90, (r() - 0.5) * 120, 8 + r() * 14, 0.3, 12)}" fill="#000" opacity="${(0.4 + r() * 0.5).toFixed(2)}"/>`;
      const mask = `<mask id="${key}-fp"><ellipse cx="0" cy="${cy}" rx="66" ry="92" fill="url(#${uid}-fade)"/>${holes}</mask>`;
      return { multiply: `${mask}<g mask="url(#${key}-fp)" opacity="0.85">${ridges}</g>`, normal: '' };
    }
    case 'ring': {
      const R = 72;
      const ring = (rad: number, wob: number) =>
        smooth(Array.from({ length: 40 }, (_, k) => {
          const t = (k / 40) * Math.PI * 2;
          const d = rad + (r() - 0.5) * wob;
          return [Math.cos(t) * d, Math.sin(t) * d] as Pt;
        }));
      const main = ring(R, 3);
      const a = r() * Math.PI * 2;
      const off = 6 + r() * 10;
      const circ = Math.PI * 2 * R;
      const part = circ * (0.3 + r() * 0.4);
      const multiply =
        `<g ${rough}><path d="${main}" fill="${c}" opacity="0.06"/>` +
        `<path d="${main}" fill="none" stroke="${c}" stroke-width="${f(5 + r() * 4)}" opacity="0.5"/>` +
        `<path d="${ring(R - 2.5, 2)}" fill="none" stroke="${shade(c, 0.6)}" stroke-width="1.4" opacity="0.6"/>` +
        `<path d="${ring(R, 4)}" transform="translate(${f(Math.cos(a) * off)} ${f(Math.sin(a) * off)})" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="${f(part)} ${f(circ)}" opacity="0.35"/></g>`;
      return { multiply, normal: '' };
    }
    case 'water': {
      const outer = blob(r, 0, 0, 82, 0.3, 26);
      const inner = blob(r, (r() - 0.5) * 30, (r() - 0.5) * 30, 50, 0.35, 20);
      const multiply =
        `<g filter="url(#${uid}-soft)"><path d="${outer}" fill="${stain}" opacity="0.14"/>` +
        `<path d="${outer}" fill="none" stroke="${shade(stain, 0.7)}" stroke-width="3" opacity="0.45"/>` +
        `<path d="${inner}" fill="none" stroke="${shade(stain, 0.75)}" stroke-width="2" opacity="0.28"/></g>`;
      return { multiply, normal: '' };
    }
    case 'wax': {
      const n = 2 + Math.floor(r() * 4);
      let shadow = '';
      let drops = '';
      const g = `${key}-wax`;
      const grad = `<radialGradient id="${g}" cx="38%" cy="32%" r="70%"><stop offset="0%" stop-color="${shade(c, 1.22)}"/><stop offset="45%" stop-color="${c}"/><stop offset="100%" stop-color="${shade(c, 0.7)}"/></radialGradient>`;
      for (let i = 0; i < n; i++) {
        const x = (r() - 0.5) * 120;
        const y = (r() - 0.5) * 120;
        const R = 9 + r() * 16;
        const d = blob(r, x, y, R, 0.14, 16);
        shadow += `<path d="${d}" transform="translate(1.5 2.5)" fill="#000" opacity="0.3" filter="url(#${uid}-soft)"/>`;
        drops += `<path d="${d}" fill="url(#${g})"/>`;
        if (r() < 0.5) drops += `<ellipse cx="${f(x + R * 0.3)}" cy="${f(y + R + 6)}" rx="${f(R * 0.3)}" ry="${f(R * 0.55)}" fill="url(#${g})"/>`;
      }
      return { multiply: '', normal: `<defs>${grad}</defs>${shadow}${drops}` };
    }
    case 'scorch': {
      const multiply =
        `<g filter="url(#${uid}-burn)"><path d="${blob(r, 0, 0, 90, 0.25)}" fill="#8a5a2b" opacity="0.35"/>` +
        `<path d="${blob(r, (r() - 0.5) * 20, (r() - 0.5) * 20, 62, 0.3)}" fill="#5c3416" opacity="0.5"/>` +
        `<path d="${blob(r, (r() - 0.5) * 20, (r() - 0.5) * 20, 34, 0.35)}" fill="#2a1408" opacity="0.55"/></g>`;
      return { multiply, normal: '' };
    }
    case 'hole': {
      const d = holePath(m);
      const multiply =
        `<g filter="url(#${uid}-burn)"><path d="${blob(r, 0, 0, 96, 0.2)}" fill="#7a4a22" opacity="0.4"/><path d="${blob(r, 0, 0, 75, 0.2)}" fill="#3a1d0a" opacity="0.5"/></g>` +
        `<path d="${d}" fill="none" stroke="#140900" stroke-width="18" filter="url(#${uid}-soft)" opacity="0.95"/>`;
      const normal = `<path d="${d}" transform="scale(1.13)" fill="none" stroke="#c0601e" stroke-width="2" opacity="0.45" filter="url(#${uid}-soft)"/>`;
      return { multiply, normal };
    }
    case 'claws': {
      const n = 3 + (r() < 0.4 ? 1 : 0);
      let dark = '';
      let light = '';
      const bend = (r() - 0.5) * 40;
      for (let i = 0; i < n; i++) {
        const oy = (i - (n - 1) / 2) * 24 + (r() - 0.5) * 6;
        const x0 = -90 + r() * 20;
        const x1 = 90 - r() * 20;
        const at = (t: number): Pt => [x0 + (x1 - x0) * t, oy + bend * 4 * t * (1 - t) + t * (r() - 0.5) * 3];
        const top: Pt[] = [];
        const bottom: Pt[] = [];
        for (let k = 0; k <= 14; k++) {
          const t = k / 14;
          const [x, y] = at(t);
          const w = Math.sin(Math.PI * Math.pow(t, 0.8)) * (3 + r() * 2.5) + 0.3;
          top.push([x, y - w]);
          bottom.unshift([x, y + w * 0.8]);
        }
        dark += `<path d="${poly([...top, ...bottom])}" fill="#1c1008" opacity="0.85"/>`;
        light += `<path d="M${top.map(([x, y]) => `${f(x)} ${f(y - 1.8)}`).join('L')}" fill="none" stroke="#fff4dc" stroke-width="1.4" opacity="0.5"/>`;
      }
      return { multiply: `<g ${rough}>${dark}</g>`, normal: `<g ${rough}>${light}</g>` };
    }
  }
}

// Дыра — неровная, с мелкими зубцами (бумага прогорела). В своих единицах следа.
export function holePath(m: NoteMark): string {
  const r = rng(m.seed + 1);
  return poly(blobPts(r, 0, 0, 52, 0.3, 30).map(([x, y]) => [x + (r() - 0.5) * 5, y + (r() - 0.5) * 5] as Pt));
}

// След на листе: перенос в его место, поворот, масштаб.
export const markTransform = (m: NoteMark, H: number) =>
  `translate(${f(m.x * SHEET_W)} ${f(m.y * H)}) rotate(${f(m.angle)}) scale(${((m.size * SHEET_W) / 200).toFixed(4)})`;

export function marksSvg(marks: NoteMark[], uid: string, H: number, stain: string): Parts {
  let multiply = '';
  let normal = '';
  for (const m of marks) {
    const p = markShape(m, uid, stain);
    const g = (s: string) => (s ? `<g transform="${markTransform(m, H)}" opacity="${m.opacity.toFixed(2)}">${s}</g>` : '');
    multiply += g(p.multiply);
    normal += g(p.normal);
  }
  return { multiply, normal };
}

// Фильтры следов: неровный край, мягкость, обугливание; плавное затухание отпечатка.
export const markDefs = (uid: string) =>
  `<filter id="${uid}-rough" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter>` +
  `<filter id="${uid}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>` +
  `<filter id="${uid}-burn" x="-40%" y="-40%" width="180%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="22"/><feGaussianBlur stdDeviation="6"/></filter>` +
  `<radialGradient id="${uid}-fade"><stop offset="0%" stop-color="#fff"/><stop offset="70%" stop-color="#fff" stop-opacity="0.85"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>`;

// Маска листа с прожжёнными дырами (CSS mask-image, картинка data: — разрешена в CSP окон): непрозрачно везде,
// кроме дыр. null — дыр нет.
export function holesMask(marks: NoteMark[], H: number): string | null {
  const holes = marks.filter((m) => m.kind === 'hole');
  if (!holes.length) return null;
  const paths = holes.map((m) => `<path transform="${markTransform(m, H)}" d="${holePath(m)}" fill="#000"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SHEET_W} ${H}" preserveAspectRatio="none"><defs><mask id="m"><rect width="${SHEET_W}" height="${H}" fill="#fff"/>${paths}</mask></defs><rect width="${SHEET_W}" height="${H}" fill="#000" mask="url(#m)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Складки и помятость — слой поверх листа: полупрозрачное чёрное темнит, белое светлит (одинаково на любой бумаге).
// «Сложена вчетверо» — два сгиба; «помята» и «скомкана» — грани (сетка треугольников с разным светом) и заломы.
export function creaseSvg(crease: NoteCrease, seed: number, H: number, uid: string): string {
  if (crease === 'none') return '';
  const r = rng(seed + 101);
  const W = SHEET_W;
  let s = '';
  const fold = (x0: number, y0: number, x1: number, y1: number) => {
    const nx = -(y1 - y0);
    const ny = x1 - x0;
    const len = Math.hypot(nx, ny);
    const ox = (nx / len) * 2.5;
    const oy = (ny / len) * 2.5;
    return (
      `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="#000" stroke-width="2.5" opacity="0.28"/>` +
      `<line x1="${f(x0 + ox)}" y1="${f(y0 + oy)}" x2="${f(x1 + ox)}" y2="${f(y1 + oy)}" stroke="#fff" stroke-width="2.5" opacity="0.45"/>`
    );
  };
  if (crease === 'folded') {
    const cx = W / 2 + (r() - 0.5) * 16;
    const cy = H / 2 + (r() - 0.5) * 16;
    // Четвертинки листа чуть по-разному ловят свет; у сгиба — тень.
    s += `<defs><linearGradient id="${uid}-fx" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.13"/></linearGradient>`;
    s += `<linearGradient id="${uid}-fy" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
    s += `<rect x="${f(cx - 90)}" y="0" width="90" height="${H}" fill="url(#${uid}-fx)"/>`;
    s += `<rect x="0" y="${f(cy)}" width="${W}" height="70" fill="url(#${uid}-fy)"/>`;
    s += `<rect x="0" y="0" width="${f(cx)}" height="${f(cy)}" fill="#fff" opacity="0.05"/><rect x="${f(cx)}" y="${f(cy)}" width="${f(W - cx)}" height="${f(H - cy)}" fill="#000" opacity="0.035"/>`;
    s += fold(cx + (r() - 0.5) * 6, 0, cx + (r() - 0.5) * 6, H) + fold(0, cy + (r() - 0.5) * 6, W, cy + (r() - 0.5) * 6);
    return s;
  }
  const crushed = crease === 'crushed';
  const facets = (cols: number, amp: number, lines: number) => {
    const rows = Math.max(2, Math.round((cols * H) / W));
    const cw = W / cols;
    const ch = H / rows;
    // Узлы сетки со сдвигом; крайние двигаются только вдоль края.
    const P: Pt[][] = [];
    for (let j = 0; j <= rows; j++) {
      P.push([]);
      for (let i = 0; i <= cols; i++) {
        const dx = i === 0 || i === cols ? 0 : (r() - 0.5) * cw * 0.7;
        const dy = j === 0 || j === rows ? 0 : (r() - 0.5) * ch * 0.7;
        P[j]!.push([i * cw + dx, j * ch + dy]);
      }
    }
    let out = '';
    let edges = '';
    const tri = (a: Pt, b: Pt, c: Pt) => {
      const v = r() - 0.5;
      out += `<path d="${poly([a, b, c])}" fill="${v > 0 ? '#fff' : '#000'}" opacity="${(Math.abs(v) * 2 * amp).toFixed(3)}"/>`;
    };
    const edge = (a: Pt, b: Pt) => {
      if (r() > lines) return;
      edges += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#000" stroke-width="1.6" opacity="0.14"/>`;
      edges += `<line x1="${f(a[0] + 1.5)}" y1="${f(a[1] - 1.5)}" x2="${f(b[0] + 1.5)}" y2="${f(b[1] - 1.5)}" stroke="#fff" stroke-width="1.3" opacity="0.3"/>`;
    };
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const a = P[j]![i]!;
        const b = P[j]![i + 1]!;
        const c = P[j + 1]![i + 1]!;
        const d = P[j + 1]![i]!;
        if (r() < 0.5) {
          tri(a, b, c);
          tri(a, c, d);
          edge(a, c);
        } else {
          tri(a, b, d);
          tri(b, c, d);
          edge(b, d);
        }
        if (j > 0) edge(a, b);
        if (i > 0) edge(a, d);
      }
    return `<g filter="url(#${uid}-crease)">${out}</g>${edges}`;
  };
  s += `<defs><filter id="${uid}-crease" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation="${crushed ? 2.5 : 4}"/></filter></defs>`;
  s += crushed ? facets(9, 0.2, 0.55) + facets(17, 0.09, 0.25) : facets(5, 0.13, 0.45);
  return s;
}
