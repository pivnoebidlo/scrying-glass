import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { discard, emptyTrash, listTrash, moveToTrash, pruneTrash, purgeTrash, restoreFromTrash, setTrashSettings } from '../src/main/trash';

let root: string;
const put = (rel: string, text = 'x') => {
  const abs = path.join(root, ...rel.split('/'));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
};
const has = (rel: string) => fs.existsSync(path.join(root, ...rel.split('/')));

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-trash-'));
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
  setTrashSettings(null);
});

describe('корзина приложения', () => {
  it('файл уходит в .trash и возвращается на место', () => {
    put('Страд/maps/замок.png', 'карта');
    const id = moveToTrash(root, ['Страд/maps/замок.png'], { title: 'замок.png', kind: 'file' })!;
    expect(has('Страд/maps/замок.png')).toBe(false);
    const [item] = listTrash(root, 'vault');
    expect(item).toMatchObject({ id, title: 'замок.png', kind: 'file', paths: ['Страд/maps/замок.png'], place: 'vault', size: 10 });
    const res = restoreFromTrash(root, id)!;
    expect(res.moved).toEqual([{ from: 'Страд/maps/замок.png', to: 'Страд/maps/замок.png' }]);
    expect(fs.readFileSync(path.join(root, 'Страд/maps/замок.png'), 'utf8')).toBe('карта');
    expect(listTrash(root, 'vault')).toEqual([]);
  });

  it('карточка с картинками — один элемент; удалённые папки создаются заново', () => {
    put('monsters/волк.json');
    put('monsters/волк.png');
    const id = moveToTrash(root, ['monsters/волк.json', 'monsters/волк.png', 'monsters/нет.png'], { title: 'Волк', kind: 'card' })!;
    expect(listTrash(root, 'vault')[0]!.paths).toEqual(['monsters/волк.json', 'monsters/волк.png']);
    fs.rmSync(path.join(root, 'monsters'), { recursive: true });
    restoreFromTrash(root, id);
    expect(has('monsters/волк.json') && has('monsters/волк.png')).toBe(true);
  });

  it('занятое имя — «x (2)», у папки без расширения', () => {
    put('a/b.md', 'старый');
    const id = moveToTrash(root, ['a/b.md'], { title: 'b.md', kind: 'file' })!;
    put('a/b.md', 'новый');
    expect(restoreFromTrash(root, id)!.moved[0]!.to).toBe('a/b (2).md');
    put('Глава 1. Начало/x.png');
    const dir = moveToTrash(root, ['Глава 1. Начало'], { title: 'Глава 1. Начало', kind: 'adventure', data: { scenes: [1] } })!;
    put('Глава 1. Начало/y.png');
    const res = restoreFromTrash(root, dir)!;
    expect(res.moved[0]!.to).toBe('Глава 1. Начало (2)');
    expect(res.meta.data).toEqual({ scenes: [1] });
    expect(has('Глава 1. Начало (2)/x.png')).toBe(true);
  });

  it('ничего не удалилось — элемента нет; пути за пределами и сама корзина не принимаются', () => {
    expect(moveToTrash(root, ['нет.png', '../x', '.trash'], { title: '?', kind: 'file' })).toBeNull();
    expect(fs.existsSync(path.join(root, '.trash'))).toBe(false);
  });

  it('удалить насовсем и очистить; чужие id не принимаются', () => {
    put('a.png');
    put('b.png');
    const a = moveToTrash(root, ['a.png'], { title: 'a.png', kind: 'file' })!;
    moveToTrash(root, ['b.png'], { title: 'b.png', kind: 'file' });
    expect(purgeTrash(root, '../a')).toBe(false);
    expect(purgeTrash(root, a)).toBe(true);
    expect(listTrash(root, 'vault').map((x) => x.title)).toEqual(['b.png']);
    emptyTrash(root);
    expect(listTrash(root, 'vault')).toEqual([]);
  });

  it('папка без описания (положили руками) показывается как есть', () => {
    put('.trash/старое/карта.png', '12345');
    const [item] = listTrash(root, 'library');
    expect(item).toMatchObject({ id: 'старое', title: 'карта.png', kind: 'file', paths: ['карта.png'], size: 5 });
    restoreFromTrash(root, 'старое');
    expect(has('карта.png')).toBe(true);
  });

  it('корзина выключена — удаляется сразу, мимо .trash', () => {
    put('a/b.png');
    put('c.png');
    expect(discard(root, ['c.png'], { title: 'c.png', kind: 'file' })).toBe(true);
    expect(listTrash(root, 'vault').length).toBe(1);
    setTrashSettings({ keep: false });
    expect(discard(root, ['a', '../x', 'нет.png'], { title: 'a', kind: 'folder' })).toBe(true);
    expect(has('a')).toBe(false);
    expect(listTrash(root, 'vault').length).toBe(1);
  });

  it('автоочистка убирает только то, что старше срока', () => {
    put('old.png');
    put('new.png');
    const old = moveToTrash(root, ['old.png'], { title: 'old.png', kind: 'file' })!;
    moveToTrash(root, ['new.png'], { title: 'new.png', kind: 'file' });
    const metaFile = path.join(root, '.trash', old, '.meta.json');
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    fs.writeFileSync(metaFile, JSON.stringify({ ...meta, deleted: Date.now() - 31 * 864e5 }));
    expect(pruneTrash(root, 0)).toBe(0);
    expect(pruneTrash(root, 30)).toBe(1);
    expect(listTrash(root, 'vault').map((x) => x.title)).toEqual(['new.png']);
  });
});
