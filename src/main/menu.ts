// The app's own menu in the interface language (instead of Electron's default with its links): «About» and
// «Settings» open the settings window's sections, Help — the project's pages; the standard Edit, View and Window.
// Rebuilt when the language changes. The macOS About panel gets the version, author and license too.
import { app, Menu, shell, type MenuItemConstructorOptions } from 'electron';
import { AUTHOR, ISSUES_URL, REPO_URL } from '../shared/about';
import { t } from '../shared/i18n';
import { RELEASES_PAGE } from '../shared/updates';

export function buildMenu(openSettings: (section: string) => void) {
  const mac = process.platform === 'darwin';
  const about: MenuItemConstructorOptions = { label: t('core.menu.about'), click: () => openSettings('about') };
  const settings: MenuItemConstructorOptions = { label: t('core.menu.settings'), accelerator: 'CmdOrCtrl+,', click: () => openSettings('') };
  const template: MenuItemConstructorOptions[] = [
    ...(mac
      ? [{ label: app.name, submenu: [about, { type: 'separator' }, settings, { type: 'separator' }, { role: 'services' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] } as MenuItemConstructorOptions]
      : [{ label: t('core.menu.file'), submenu: [settings, { type: 'separator' }, { role: 'quit' }] } as MenuItemConstructorOptions]),
    { label: t('core.menu.edit'), role: 'editMenu' },
    { label: t('core.menu.view'), role: 'viewMenu' },
    { label: t('core.menu.window'), role: 'windowMenu' },
    {
      label: t('core.menu.help'),
      role: 'help',
      submenu: [
        ...(mac ? [] : [about, { type: 'separator' } as MenuItemConstructorOptions]),
        { label: t('core.menu.repo'), click: () => void shell.openExternal(REPO_URL) },
        { label: t('core.menu.releases'), click: () => void shell.openExternal(RELEASES_PAGE) },
        { label: t('core.menu.issues'), click: () => void shell.openExternal(ISSUES_URL) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  app.setAboutPanelOptions({
    applicationName: 'Scrying Glass',
    applicationVersion: app.getVersion(),
    copyright: `© ${new Date().getFullYear()} ${AUTHOR} · GPL-3.0-or-later`,
    website: REPO_URL,
  });
}
