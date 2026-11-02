// The GM's accounts in other services (CardImporter.account; D&D: Long Story Short). Signing in happens on the
// service's own page, in a window with a saved session of its own (partition `persist:account-<id>`): the app never
// sees the password, it takes only the token from the session's cookies and asks the service's API with it — only
// when the GM imports or presses a button, never in the background. «Sign out» clears the session.
import { BrowserWindow, session } from 'electron';
import type { AccountStatus, ImporterAccount } from '../systems/importer';
import { getControlWindow } from './windows';

const sessionOf = (id: string) => session.fromPartition(`persist:account-${id}`);

// The expiry of a JWT (ms), none — not a JWT or no `exp`.
function expiry(token: string): number | undefined {
  try {
    const p = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as { exp?: unknown };
    return typeof p.exp === 'number' ? p.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

export async function accountToken(id: string, acc: ImporterAccount): Promise<string | null> {
  const cookies = await sessionOf(id).cookies.get({ url: acc.cookieUrl });
  const token = acc.token(cookies);
  if (!token) return null;
  const until = expiry(token);
  return until && until < Date.now() ? null : token;
}

// GET with the token; a non-JSON answer or an error status — an exception (`account:<status>`).
export async function accountFetch(token: string, url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`account:${res.status}`);
  return res.json();
}

export async function accountStatus(id: string, acc: ImporterAccount): Promise<AccountStatus> {
  const token = await accountToken(id, acc);
  if (!token) return { signedIn: false };
  const until = expiry(token);
  let name: string | null = null;
  if (acc.user) {
    try {
      name = acc.user.name(await accountFetch(token, acc.user.url));
    } catch (e) {
      // The service no longer takes the token — signed out there.
      if (e instanceof Error && e.message === 'account:401') return { signedIn: false };
    }
  }
  return { signedIn: true, name, ...(until ? { until } : {}) };
}

// The sign-in window: the service's page; it closes itself once the token appears. Resolves when it is closed.
export function signIn(id: string, acc: ImporterAccount, title: string): Promise<void> {
  const ses = sessionOf(id);
  const parent = getControlWindow() ?? undefined;
  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    title,
    ...(parent ? { parent } : {}),
    autoHideMenuBar: true,
    webPreferences: { session: ses, sandbox: true, contextIsolation: true },
  });
  // Sign-in through other sites (popups) stays in the same session.
  win.webContents.setWindowOpenHandler(() => ({ action: 'allow', overrideBrowserWindowOptions: { parent: win, webPreferences: { session: ses, sandbox: true } } }));
  const check = async () => {
    if (!win.isDestroyed() && (await accountToken(id, acc))) win.close();
  };
  const onChanged = () => void check();
  ses.cookies.on('changed', onChanged);
  void win.loadURL(acc.login);
  return new Promise((resolve) =>
    win.on('closed', () => {
      ses.cookies.off('changed', onChanged);
      resolve();
    })
  );
}

export async function signOut(id: string) {
  await sessionOf(id).clearStorageData();
}
