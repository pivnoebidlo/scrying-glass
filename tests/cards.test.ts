import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';

// Встроенный бестиарий читается из resources/srd проекта; окон нет.
vi.mock('electron', () => ({ app: { getAppPath: () => process.cwd() }, BrowserWindow: { getAllWindows: () => [] } }));

const { getCard, importCards, initCards, isEditedSrd, listCards, revertSrd, saveCard, setLibrary, updateFromExport } = await import('../src/main/cards');
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

describe('обновление персонажа из Long Story Short', () => {
  // Экспорт LSS без аватарки — id персонажа в нём нет.
  const lssFile = (name: string, hp: number, extra: object = {}) => {
    const file = path.join(lib, `${name}-${hp}.lss.json`);
    const data = { name: { value: name }, info: { charClass: { value: 'Воин' }, level: { value: 3 } }, vitality: { 'hp-max': { value: hp }, ac: { value: 16 } }, ...extra };
    fs.writeFileSync(file, JSON.stringify({ jsonType: 'character', edition: '2024', data: JSON.stringify(data) }));
    return file;
  };
  const brunos = () => listCards().filter((c) => c.ref.scope === 'library' && c.name === 'Бруно');

  it('первый импорт — новая карточка; повторный того же имени не создаёт копию, а сообщает о совпадении', async () => {
    const first = await importCards([lssFile('Бруно', 28)], 'library');
    expect([first.count, first.matches]).toEqual([1, []]);
    const again = await importCards([lssFile('Бруно', 31)], 'library');
    expect(again.count).toBe(0);
    expect(again.matches).toHaveLength(1);
    expect(again.matches[0]!.ref).toEqual(brunos()[0]!.ref);
    expect(again.matches[0]!.importer).toBe('lss');
    expect(brunos()).toHaveLength(1);
  });

  it('обновление: новый лист, свои заметки остаются, прежняя версия — в корзину', () => {
    const [b] = brunos();
    saveCard('library', { ...getCard(b!.ref)!, notes: 'Проверен мастером' });
    const before = listTrash(lib, 'library').length;
    expect(updateFromExport(b!.ref, lssFile('Бруно', 31), 'lss')).toEqual(b!.ref);
    const c = getCard(b!.ref)!;
    expect((c.stats as { hpMax: number }).hpMax).toBe(31);
    expect(c.notes).toBe('Проверен мастером');
    expect(brunos()).toHaveLength(1);
    const trash = listTrash(lib, 'library');
    expect(trash.length).toBe(before + 1);
    expect(trash[0]!.title).toContain('before the update from Long Story Short');
  });

  it('«Создать новую» — импорт без сопоставления', async () => {
    const r = await importCards([lssFile('Бруно', 40)], 'library', undefined, true);
    expect([r.count, r.matches]).toEqual([1, []]);
    expect(brunos()).toHaveLength(2);
  });
});
