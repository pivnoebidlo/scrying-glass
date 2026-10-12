// Перенос данных из версий до хранилища (0.3): campaign.json в папке приложения.
// Картинки, добавленные вручную, копируются в хранилище, подписи переносятся.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { app, dialog, type BrowserWindow } from 'electron';
import { freeName } from './files';
import { prettyName } from '../shared/vault';
import type { PortraitsState } from '../modules/portraits/types';

interface OldPortrait {
  id: string;
  name: string;
  file?: string;
  path?: string;
}

const MIGRATED_DIR = 'Из прошлой версии/characters';

// Возвращает обновлённое состояние портретов или null, если переносить нечего (или пользователь отказался).
export async function migrateOldCampaign(
  vaultRoot: string,
  portraits: PortraitsState,
  parent: BrowserWindow | null
): Promise<PortraitsState | null> {
  const dir = path.join(app.getPath('userData'), 'campaign');
  const file = path.join(dir, 'campaign.json');
  let library: OldPortrait[];
  try {
    library = JSON.parse(fs.readFileSync(file, 'utf8')).modules?.portraits?.library ?? [];
  } catch {
    return null;
  }

  const manual = library.filter((p) => p.file && fs.existsSync(path.join(dir, 'assets', path.basename(p.file))));
  const inVault = library.filter((p) => p.path && p.path.startsWith(vaultRoot + path.sep));
  const outside = [...new Set(library.filter((p) => p.path && !p.path.startsWith(vaultRoot + path.sep)).map((p) => path.dirname(p.path!)))];
  const markDone = () => fs.renameSync(file, path.join(dir, 'campaign.migrated.json'));

  if (!manual.length && !inVault.length) {
    // Если есть папки вне этого хранилища, спросим, когда откроют хранилище, в котором они лежат.
    if (!outside.length) markDone();
    return null;
  }

  const lines = [];
  if (manual.length) lines.push(`• картинки, добавленные вручную (${manual.length}): будут скопированы в «${MIGRATED_DIR}»`);
  if (inVault.length) lines.push(`• подписи к картинкам из подключённых папок (${inVault.length})`);
  if (outside.length) lines.push(`\nЭти папки лежат вне хранилища, их стоит перенести в него вручную:\n${outside.join('\n')}`);

  const opts = {
    type: 'question' as const,
    message: 'Перенести портреты из прошлой версии?',
    detail: lines.join('\n'),
    buttons: ['Перенести', 'Не сейчас', 'Больше не спрашивать'],
    defaultId: 0,
    cancelId: 1,
  };
  const { response } = parent ? await dialog.showMessageBox(parent, opts) : await dialog.showMessageBox(opts);
  if (response === 1) return null;
  if (response === 2) {
    markDone();
    return null;
  }

  const names = { ...portraits.names };
  if (manual.length) {
    const target = path.join(vaultRoot, ...MIGRATED_DIR.split('/'));
    fs.mkdirSync(target, { recursive: true });
    for (const p of manual) {
      const src = path.join(dir, 'assets', path.basename(p.file!));
      const fileName = freeName(target, (p.name || 'портрет') + path.extname(src).toLowerCase());
      fs.copyFileSync(src, path.join(target, fileName), fs.constants.COPYFILE_EXCL);
      const rel = `${MIGRATED_DIR}/${fileName}`;
      if (p.name !== prettyName(rel)) names[rel] = p.name;
    }
  }
  for (const p of inVault) {
    const rel = path.relative(vaultRoot, p.path!).split(path.sep).join('/');
    if (p.name !== prettyName(rel)) names[rel] = p.name;
  }
  markDone();
  return { ...portraits, names };
}
