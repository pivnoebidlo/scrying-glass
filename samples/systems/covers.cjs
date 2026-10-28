// Covers of the sample system packs: SVG made here, drawn by Chromium inside Electron, saved as <id>.jpg next to the
// packs (1200×900; the app makes a cover 640 px wide when publishing). Run: npx electron samples/systems/covers.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const W = 1200;
const H = 900;

// A six-sided die: a rounded square with pips, turned by `angle` around its centre.
function d6(x, y, size, angle, face, six) {
  const pips = {
    1: [[0.5, 0.5]],
    2: [[0.27, 0.27], [0.73, 0.73]],
    3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
    4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
    5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
    6: [[0.27, 0.25], [0.73, 0.25], [0.27, 0.5], [0.73, 0.5], [0.27, 0.75], [0.73, 0.75]],
  }[face];
  const fill = six ? 'url(#gold)' : 'url(#ivory)';
  const pip = six ? '#3a2408' : '#1d2433';
  const glow = six ? `filter="url(#glow)"` : `filter="url(#shadow)"`;
  return `<g transform="translate(${x} ${y}) rotate(${angle}) translate(${-size / 2} ${-size / 2})" ${glow}>
    <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${fill}" stroke="${six ? '#ffd98a' : '#c9c2b0'}" stroke-width="2"/>
    ${pips.map(([px, py]) => `<circle cx="${px * size}" cy="${py * size}" r="${size * 0.085}" fill="${pip}"/>`).join('')}
  </g>`;
}

function pool() {
  // A handful of dice across the upper part; three sixes.
  const dice = [
    [250, 230, 150, -14, 3, false],
    [470, 170, 140, 9, 6, true],
    [690, 250, 160, -6, 2, false],
    [905, 175, 135, 18, 6, true],
    [360, 430, 145, 22, 5, false],
    [600, 455, 170, -20, 6, true],
    [840, 420, 140, 5, 1, false],
    [1050, 360, 120, -28, 4, false],
    [140, 420, 115, 31, 2, false],
  ];
  const stars = Array.from({ length: 70 }, (_, i) => {
    const x = (i * 397) % W;
    const y = (i * 211) % 620;
    return `<circle cx="${x}" cy="${y}" r="${(i % 3) * 0.6 + 0.6}" fill="#cfe3ff" opacity="${0.15 + (i % 5) * 0.08}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="0.55" cy="0.35" r="0.9"><stop offset="0" stop-color="#16345a"/><stop offset="0.55" stop-color="#0a1830"/><stop offset="1" stop-color="#03070f"/></radialGradient>
    <linearGradient id="ivory" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf7ec"/><stop offset="1" stop-color="#d8d0bd"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe09a"/><stop offset="1" stop-color="#e09a2a"/></linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="14" result="b"/><feFlood flood-color="#ffb43a" flood-opacity="0.75"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.55"/></filter>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03070f" stop-opacity="0"/><stop offset="1" stop-color="#03070f" stop-opacity="0.92"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars}
  <ellipse cx="600" cy="560" rx="560" ry="70" fill="#000" opacity="0.35"/>
  ${dice.map((d) => d6(...d)).join('\n')}
  <rect y="560" width="${W}" height="340" fill="url(#fade)"/>
  <text x="70" y="760" font-family="Georgia, 'Palatino', serif" font-size="104" font-weight="700" fill="#f6e7c4">Пул шестёрок</text>
  <text x="74" y="828" font-family="Georgia, 'Palatino', serif" font-size="44" fill="#9fb6d4">по мотивам Year Zero · считаются шестёрки</text>
  <text x="${W - 70}" y="80" text-anchor="end" font-family="-apple-system, 'Helvetica Neue', sans-serif" font-size="26" letter-spacing="3" fill="#8fa6c4" opacity="0.8">SCRYING GLASS · СИСТЕМА</text>
</svg>`;
}

// A ten-sided die: the face on top (a kite with the number), two side faces in shade meeting at the bottom point.
function d10(x, y, size, angle, label) {
  const p = (a, b) => `${a * size} ${b * size}`;
  const top = `M${p(0, -1)} L${p(0.64, -0.08)} L${p(0, 0.6)} L${p(-0.64, -0.08)} Z`;
  const right = `M${p(0.64, -0.08)} L${p(0.7, 0.3)} L${p(0, 1)} L${p(0, 0.6)} Z`;
  const left = `M${p(-0.64, -0.08)} L${p(-0.7, 0.3)} L${p(0, 1)} L${p(0, 0.6)} Z`;
  return `<g transform="translate(${x} ${y}) rotate(${angle})" filter="url(#eerie)">
    <path d="${left}" fill="#a39d86" stroke="#d8d2bd" stroke-width="2" stroke-linejoin="round"/>
    <path d="${right}" fill="#7f7a66" stroke="#d8d2bd" stroke-width="2" stroke-linejoin="round"/>
    <path d="${top}" fill="url(#bone)" stroke="#f1ecda" stroke-width="2" stroke-linejoin="round"/>
    <text x="0" y="${size * 0.06}" text-anchor="middle" font-family="Georgia, serif" font-size="${size * 0.42}" font-weight="700" fill="#6a1212">${label}</text>
  </g>`;
}

function horror() {
  const fog = Array.from({ length: 9 }, (_, i) => {
    const cx = 120 + i * 130;
    const cy = 520 + (i % 3) * 60;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${220 + (i % 4) * 40}" ry="${60 + (i % 3) * 18}" fill="#9fd1b0" opacity="${0.05 + (i % 3) * 0.025}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.3" r="0.95"><stop offset="0" stop-color="#14352a"/><stop offset="0.5" stop-color="#0a1c16"/><stop offset="1" stop-color="#020605"/></radialGradient>
    <linearGradient id="bone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3eedb"/><stop offset="1" stop-color="#bdb69c"/></linearGradient>
    <radialGradient id="iris" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#d6ff9a"/><stop offset="0.45" stop-color="#5fbf4a"/><stop offset="1" stop-color="#0d2a14"/></radialGradient>
    <filter id="eerie" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16" result="b"/><feFlood flood-color="#7dff9a" flood-opacity="0.35"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020605" stop-opacity="0"/><stop offset="1" stop-color="#020605" stop-opacity="0.95"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- an eye in the dark, barely there -->
  <g opacity="0.55" filter="url(#blur6)">
    <path d="M330 190 Q600 30 870 190 Q600 350 330 190 Z" fill="#0b130f" stroke="#2f5a43" stroke-width="3"/>
    <circle cx="600" cy="190" r="92" fill="url(#iris)"/>
    <ellipse cx="600" cy="190" rx="16" ry="70" fill="#020605"/>
  </g>
  <g filter="url(#soft)">${fog}</g>
  ${d10(480, 420, 150, -10, '00')}
  ${d10(740, 440, 135, 14, '7')}
  <rect y="560" width="${W}" height="340" fill="url(#fade)"/>
  <text x="70" y="760" font-family="Georgia, 'Palatino', serif" font-size="108" font-weight="700" fill="#dbe9d2">Ужасы на к100</text>
  <text x="74" y="828" font-family="Georgia, 'Palatino', serif" font-size="44" fill="#86a896">трудный успех · экстремальный успех · рассудок</text>
  <text x="${W - 70}" y="80" text-anchor="end" font-family="-apple-system, 'Helvetica Neue', sans-serif" font-size="26" letter-spacing="3" fill="#7f9f8c" opacity="0.8">SCRYING GLASS · СИСТЕМА</text>
</svg>`;
}

// A Fate die: a rounded square with «+», «−» or nothing.
function dF(x, y, size, angle, face) {
  const mark = face > 0
    ? `<rect x="${size * 0.22}" y="${size * 0.44}" width="${size * 0.56}" height="${size * 0.12}" rx="4" fill="#3b1d0a"/><rect x="${size * 0.44}" y="${size * 0.22}" width="${size * 0.12}" height="${size * 0.56}" rx="4" fill="#3b1d0a"/>`
    : face < 0
      ? `<rect x="${size * 0.22}" y="${size * 0.44}" width="${size * 0.56}" height="${size * 0.12}" rx="4" fill="#3b1d0a"/>`
      : '';
  return `<g transform="translate(${x} ${y}) rotate(${angle}) translate(${-size / 2} ${-size / 2})" filter="url(#shadow)">
    <rect width="${size}" height="${size}" rx="${size * 0.16}" fill="url(#cream)" stroke="#f7e6c4" stroke-width="2"/>${mark}
  </g>`;
}

function fate() {
  const ladder = [['+4', 'Отлично'], ['+3', 'Хорошо'], ['+2', 'Неплохо'], ['+1', 'Средне'], ['0', 'Посредственно']];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="0.35" cy="0.3" r="1"><stop offset="0" stop-color="#e8672a"/><stop offset="0.5" stop-color="#9c2f1c"/><stop offset="1" stop-color="#2a0c0a"/></radialGradient>
    <linearGradient id="cream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6e3"/><stop offset="1" stop-color="#e7cfa3"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.5"/></filter>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0606" stop-opacity="0"/><stop offset="1" stop-color="#1a0606" stop-opacity="0.92"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${ladder.map(([n, w], i) => `<text x="${W - 90}" y="${150 + i * 74}" text-anchor="end" font-family="Georgia, serif" font-size="${i === 1 ? 46 : 34}" fill="#ffe6c8" opacity="${i === 1 ? 0.95 : 0.45}">${w} (${n})</text>`).join('')}
  ${dF(210, 330, 170, -12, 1)}
  ${dF(420, 300, 170, 8, 1)}
  ${dF(630, 350, 170, -4, 0)}
  ${dF(330, 520, 150, 18, 1)}
  <rect y="560" width="${W}" height="340" fill="url(#fade)"/>
  <text x="70" y="760" font-family="Georgia, 'Palatino', serif" font-size="112" font-weight="700" fill="#fff1dc">Fate Core</text>
  <text x="74" y="828" font-family="Georgia, 'Palatino', serif" font-size="44" fill="#f2b98f">аспекты · навыки на лестнице · жетоны судьбы</text>
  <text x="${W - 70}" y="80" text-anchor="end" font-family="-apple-system, 'Helvetica Neue', sans-serif" font-size="26" letter-spacing="3" fill="#ffd9b8" opacity="0.8">SCRYING GLASS · СИСТЕМА</text>
</svg>`;
}

function maus() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.35" r="0.9"><stop offset="0" stop-color="#e9dcb4"/><stop offset="0.6" stop-color="#b9a173"/><stop offset="1" stop-color="#4c3b22"/></radialGradient>
    <linearGradient id="fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e7b6a"/><stop offset="1" stop-color="#5e4e42"/></linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4f4f4"/><stop offset="1" stop-color="#9aa3ad"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#2a1d0c" flood-opacity="0.55"/></filter>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d0c" stop-opacity="0"/><stop offset="1" stop-color="#2a1d0c" stop-opacity="0.92"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- grass blades, big as trees for a mouse -->
  ${Array.from({ length: 14 }, (_, i) => `<path d="M${40 + i * 85} 640 Q${60 + i * 85 + (i % 2 ? 30 : -30)} ${320 + (i % 4) * 40} ${50 + i * 85 + (i % 3) * 20} ${150 + (i % 5) * 30}" stroke="#6f7f3a" stroke-width="${10 + (i % 3) * 4}" fill="none" opacity="0.55" stroke-linecap="round"/>`).join('')}
  <g transform="translate(600 410)" filter="url(#shadow)">
    <!-- the needle sword -->
    <path d="M150 -240 L170 -240 L175 120 L145 120 Z" fill="url(#steel)" transform="rotate(18)"/>
    <rect x="120" y="110" width="80" height="18" rx="6" fill="#7a4b22" transform="rotate(18)"/>
    <!-- ears, head, eye, nose, whiskers -->
    <circle cx="-120" cy="-150" r="95" fill="url(#fur)"/><circle cx="-120" cy="-150" r="60" fill="#e6a9a0"/>
    <circle cx="110" cy="-160" r="95" fill="url(#fur)"/><circle cx="110" cy="-160" r="60" fill="#e6a9a0"/>
    <ellipse cx="0" cy="0" rx="190" ry="170" fill="url(#fur)"/>
    <path d="M-40 60 Q0 175 40 60 Z" fill="#7b6757"/>
    <circle cx="-70" cy="-20" r="22" fill="#1b130e"/><circle cx="-63" cy="-27" r="7" fill="#fff"/>
    <circle cx="70" cy="-20" r="22" fill="#1b130e"/><circle cx="77" cy="-27" r="7" fill="#fff"/>
    <ellipse cx="0" cy="70" rx="22" ry="16" fill="#d77d78"/>
    <path d="M-30 80 L-170 60 M-30 90 L-170 110 M30 80 L170 60 M30 90 L170 110" stroke="#2a1d0c" stroke-width="4" opacity="0.6"/>
    <!-- a red cloak -->
    <path d="M-150 120 Q0 230 150 120 L170 220 Q0 280 -170 220 Z" fill="#9d2b21"/>
  </g>
  <rect y="560" width="${W}" height="340" fill="url(#fade)"/>
  <text x="70" y="760" font-family="Georgia, 'Palatino', serif" font-size="112" font-weight="700" fill="#fbf1d6">Mausritter</text>
  <text x="74" y="828" font-family="Georgia, 'Palatino', serif" font-size="44" fill="#e3c99a">мыши-рыцари · спасброски к20 · инвентарь клетками</text>
  <text x="${W - 70}" y="80" text-anchor="end" font-family="-apple-system, 'Helvetica Neue', sans-serif" font-size="26" letter-spacing="3" fill="#4c3b22" opacity="0.8">SCRYING GLASS · СИСТЕМА</text>
</svg>`;
}

// Forged in the Dark: a city at night in the rain, a progress clock and a pool of d6 (two sixes — a critical).
function fitd() {
  const clock = (cx, cy, r, n, filled) =>
    Array.from({ length: n }, (_, i) => {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
      const p = (a) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
      return `<path d="M${cx} ${cy} L${p(a0)} A${r} ${r} 0 0 1 ${p(a1)} Z" fill="${i < filled ? '#c8452f' : 'none'}" stroke="#e7d9c2" stroke-width="5"/>`;
    }).join('');
  const roofs = [[0, 520], [90, 470], [170, 500], [250, 430], [330, 480], [430, 410], [520, 460], [610, 380], [700, 450], [800, 400], [900, 470], [990, 420], [1080, 490], [1200, 450]];
  const sky = `M0 900 L${roofs.map(([x, y]) => `${x} ${y}`).join(' L')} L1200 900 Z`;
  const windows = Array.from({ length: 26 }, (_, i) => `<rect x="${40 + ((i * 97) % 1120)}" y="${470 + ((i * 53) % 110)}" width="14" height="20" fill="#f2b45a" opacity="${0.35 + (i % 4) * 0.15}"/>`).join('');
  const rain = Array.from({ length: 90 }, (_, i) => `<line x1="${(i * 61) % 1200}" y1="${(i * 37) % 560}" x2="${((i * 61) % 1200) - 14}" y2="${((i * 37) % 560) + 46}" stroke="#9fb3c8" stroke-width="2" opacity="0.25"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="0.7" cy="0.25" r="1"><stop offset="0" stop-color="#3b4a5e"/><stop offset="0.55" stop-color="#16202c"/><stop offset="1" stop-color="#07090d"/></radialGradient>
    <linearGradient id="ivory" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f1e6"/><stop offset="1" stop-color="#c9c2b0"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe7a8"/><stop offset="1" stop-color="#d79b2c"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.6"/></filter>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#ffc861" flood-opacity="0.8"/></filter>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070a" stop-opacity="0"/><stop offset="1" stop-color="#05070a" stop-opacity="0.94"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${rain}
  <path d="${sky}" fill="#0b0f15"/>
  ${windows}
  <g filter="url(#shadow)" opacity="0.92">${clock(930, 230, 120, 6, 4)}</g>
  ${d6(250, 330, 150, -14, 6, true)}
  ${d6(450, 300, 150, 9, 6, true)}
  ${d6(640, 360, 140, -6, 3, false)}
  <rect y="560" width="${W}" height="340" fill="url(#fade)"/>
  <text x="70" y="760" font-family="Georgia, 'Palatino', serif" font-size="104" font-weight="700" fill="#efe6d6">Forged in the Dark</text>
  <text x="74" y="828" font-family="Georgia, 'Palatino', serif" font-size="44" fill="#c9a77a">пул к6 · стресс и вред · часы прогресса · банда</text>
  <text x="${W - 70}" y="80" text-anchor="end" font-family="-apple-system, 'Helvetica Neue', sans-serif" font-size="26" letter-spacing="3" fill="#9fb3c8" opacity="0.8">SCRYING GLASS · СИСТЕМА</text>
</svg>`;
}

app.disableHardwareAcceleration();
// One window after another: closing the first one must not end the app.
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  for (const [id, svg] of [['yz-pool', pool()], ['d100-horror', horror()], ['fate-core', fate()], ['mausritter', maus()], ['fitd', fitd()]]) {
    const w = new BrowserWindow({ width: W, height: H, show: false, frame: false, webPreferences: { offscreen: true } });
    w.webContents.setFrameRate(1);
    await w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<html><body style='margin:0;background:#000'>${svg}</body></html>`));
    await new Promise((r) => setTimeout(r, 700));
    const img = await w.webContents.capturePage({ x: 0, y: 0, width: W, height: H });
    fs.writeFileSync(path.join(__dirname, `${id}.jpg`), img.resize({ width: W, height: H }).toJPEG(88));
    w.destroy();
  }
  app.quit();
});
