// Отрисовать иконку приложения из SVG в PNG 1024×1024 (движком Chromium внутри Electron: ImageMagick не умеет
// градиенты SVG). Запуск: npm run icon. По build/icon.png electron-builder сам делает .icns и .ico.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const svg = path.join(__dirname, '../build/icon.svg');
const out = path.join(__dirname, '../build/icon.png');
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 1024, height: 1024, show: false, transparent: true, frame: false, webPreferences: { offscreen: true } });
  w.webContents.setFrameRate(1);
  await w.loadURL('data:text/html,' + encodeURIComponent(`<html><body style='margin:0;background:transparent'>${fs.readFileSync(svg, 'utf8')}</body></html>`));
  await new Promise((r) => setTimeout(r, 500));
  const img = await w.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
  fs.writeFileSync(out, img.resize({ width: 1024, height: 1024 }).toPNG());
  app.quit();
});
