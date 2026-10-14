import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';

// Встроенный бестиарий читается из resources/srd проекта; окон нет.
vi.mock('electron', () => ({ app: { getAppPath: () => process.cwd() }, BrowserWindow: { getAllWindows: () => [] } }));

const { getCard, initCards, isEditedSrd, listCards, revertSrd, saveCard, setLibrary } = await import('../src/main/cards');
const { listTrash } = await import('../src/main/trash');

const lib = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-cards-'));
afterAll(() => fs.rmSync(lib, { recursive: true, force: true }));
initCards(lib);

const ref = { scope: 'srd' as const, id: 'srd52-goblin-warrior.ru' };

describe('правка встроенных карточек', () => {
  it('правка ложится в библиотеку и заменяет встроенную под той же ссылкой', () => {
    const orig = getCard(ref)!;
    expect(orig).toBeTruthy();
    const out = saveCard('srd', { ...orig, notes: 'Прячется за щитом', stats: { ...(orig.stats as object), ac: 17 } });
    expect(out).toEqual(ref);
    const c = getCard(ref)!;
    expect(c.notes).toBe('Прячется за щитом');
    expect((c.stats as { ac: number }).ac).toBe(17);
    expect(c.origin).toEqual(orig.origin);
    expect(c.overrides).toBeUndefined();
    expect(isEditedSrd(ref)).toBe(true);
    // Среди карточек библиотеки правки нет, у встроенной — пометка.
    const list = listCards();
    expect(list.filter((x) => x.ref.scope === 'library')).toEqual([]);
    expect(list.find((x) => x.ref.id === ref.id)?.edited).toBe(true);
    const file = JSON.parse(fs.readFileSync(path.join(lib, 'cards', `${orig.name}.json`), 'utf8'));
    expect(file.overrides).toBe(ref.id);
  });

  it('повторная правка пишет в тот же файл; правка читается с диска заново', () => {
    saveCard('srd', { ...getCard(ref)!, notes: 'Второй раз' });
    expect(fs.readdirSync(path.join(lib, 'cards'))).toHaveLength(1);
    setLibrary(lib);
    expect(getCard(ref)!.notes).toBe('Второй раз');
  });

  it('«Вернуть как в SRD» — файл правки в корзину, снова встроенная', () => {
    expect(revertSrd(ref)).toBe(true);
    expect(isEditedSrd(ref)).toBe(false);
    expect((getCard(ref)!.stats as { ac: number }).ac).toBe(15);
    expect(listTrash(lib, 'library').map((x) => x.kind)).toEqual(['card']);
    expect(revertSrd(ref)).toBe(false);
  });
});
