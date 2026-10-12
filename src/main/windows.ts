// Окна: управление и экран игроков.
import { app, BrowserWindow, screen, type WebPreferences } from 'electron';
import * as path from 'node:path';
import type { DisplayInfo } from '../shared/api';

let controlWindow: BrowserWindow | null = null;
let displayWindow: BrowserWindow | null = null;

export const getControlWindow = () => controlWindow;
export const isDisplayOpen = () => !!displayWindow;

const webPreferences: WebPreferences = {
  preload: path.join(__dirname, '../preload/index.js'),
  contextIsolation: true,
  nodeIntegration: false,
};

// В разработке страницы отдаёт dev-сервер Vite, в собранном приложении они лежат рядом.
function loadPage(win: BrowserWindow, page: 'control' | 'display') {
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devUrl) win.loadURL(`${devUrl}/${page}/index.html`);
  else win.loadFile(path.join(__dirname, `../renderer/${page}/index.html`));
}

function notifyDisplayStatus() {
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send('display:status', !!displayWindow);
  }
}

export function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 560,
    title: 'Scrying Glass',
    backgroundColor: '#1e1e1e',
    // Здесь играет музыка: окно не должно притормаживать, даже если его свернули.
    webPreferences: { ...webPreferences, backgroundThrottling: false },
  });
  loadPage(controlWindow, 'control');
  controlWindow.on('closed', () => {
    controlWindow = null;
    closeDisplay();
  });
}

export function listDisplays(): DisplayInfo[] {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    primary: d.id === primaryId,
    width: d.size.width,
    height: d.size.height,
    label: `Экран ${i + 1} (${d.size.width}×${d.size.height})${d.id === primaryId ? ' — основной' : ''}`,
  }));
}

export function closeDisplay() {
  if (displayWindow && !displayWindow.isDestroyed()) displayWindow.close();
  displayWindow = null;
  notifyDisplayStatus();
}

export function openDisplay(displayId: number) {
  closeDisplay();

  const displays = screen.getAllDisplays();
  const target = displays.find((d) => d.id === displayId) || displays[0]!;

  // Если выбран тот же экран, где окно управления, открываем обычное окно-превью.
  const controlDisplay = controlWindow ? screen.getDisplayMatching(controlWindow.getBounds()) : null;
  const fullscreen = !(controlDisplay && controlDisplay.id === target.id);

  const b = target.bounds;
  // Экран игроков рисует всегда, даже если окно чем-то перекрыто: переходы и анимации не должны тормозить.
  const displayPrefs = { ...webPreferences, backgroundThrottling: false };
  const win = new BrowserWindow(
    fullscreen
      ? { x: b.x, y: b.y, width: b.width, height: b.height, frame: false, show: false, backgroundColor: '#000000', webPreferences: displayPrefs }
      : { x: b.x + 100, y: b.y + 100, width: 960, height: 540, title: 'Scrying Glass — экран игроков (превью)', show: false, backgroundColor: '#000000', webPreferences: displayPrefs }
  );
  displayWindow = win;

  loadPage(win, 'display');
  win.once('ready-to-show', () => {
    win.show();
    if (fullscreen) {
      if (process.platform === 'darwin') win.setSimpleFullScreen(true);
      else win.setFullScreen(true);
    }
  });
  win.on('closed', () => {
    if (displayWindow === win) displayWindow = null;
    notifyDisplayStatus();
  });
  notifyDisplayStatus();
}

export function watchDisplays() {
  const refresh = () => {
    if (controlWindow && !controlWindow.isDestroyed()) controlWindow.webContents.send('displays:changed');
  };
  screen.on('display-added', refresh);
  screen.on('display-removed', refresh);
}
