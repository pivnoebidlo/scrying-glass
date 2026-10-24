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

app.disableHardwareAcceleration();
// One window after another: closing the first one must not end the app.
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  for (const [id, svg] of [['yz-pool', pool()], ['d100-horror', horror()]]) {
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
