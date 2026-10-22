import { describe, expect, it } from 'vitest';
import { isPdf, pagePreview, pageTitle, pdfLink, splitProps, toggleTask } from '../src/shared/journal';
import { roleAccepts } from '../src/shared/vault';
import { entryHtml } from '../src/renderer/lib/entry/markup';

describe('журнал: заметки', () => {
  it('название — имя файла', () => {
    expect(pageTitle('Страд/journal/Сессии/Сессия 3.md')).toBe('Сессия 3');
  });

  it('свойства Obsidian отделяются от текста', () => {
    expect(splitProps('---\ntags: [a]\n---\nТекст')).toEqual({ props: '---\ntags: [a]\n---\n', body: 'Текст' });
    expect(splitProps('Текст\n---\nещё')).toEqual({ props: '', body: 'Текст\n---\nещё' });
  });

  it('флажок задачи переключается по номеру, свойства не трогаются', () => {
    const text = '---\na: 1\n---\n- [ ] Первая\n- обычный пункт\n- [x] Вторая\r\n- [ ] Третья';
    expect(toggleTask(text, 0)).toBe('---\na: 1\n---\n- [x] Первая\n- обычный пункт\n- [x] Вторая\r\n- [ ] Третья');
    expect(toggleTask(text, 1)).toBe('---\na: 1\n---\n- [ ] Первая\n- обычный пункт\n- [ ] Вторая\r\n- [ ] Третья');
    expect(toggleTask(text, 2)).toContain('- [x] Третья');
  });

  it('номера задач в разметке совпадают с toggleTask', () => {
    const html = entryHtml('- [ ] а\n- б\n\n* [x] в', { tasks: true });
    expect(html).toContain('data-task="0"><span>а');
    expect(html).toContain('data-task="1" checked><span>в');
    // Без tasks — обычный пункт списка.
    expect(entryHtml('- [ ] а')).toBe('<ul><li>[ ] а</li></ul>');
  });

  it('цитата из нескольких строк — один блок для зачитывания', () => {
    expect(entryHtml('> Дорога выводит\n> к частоколу.\n>\n> Тишина.\nПосле')).toBe(
      '<blockquote><p>Дорога выводит<br>к частоколу.</p><p>Тишина.</p></blockquote><p>После</p>'
    );
  });

  it('броски {кубы} — кнопки, остальное в фигурных скобках — как есть', () => {
    const html = entryHtml('Урон {2d6+3}, {не кубы}', { dice: true });
    expect(html).toContain('<button type="button" class="dice" data-dice="2d6+3" title="Roll">2d6+3</button>');
    expect(html).toContain('{не кубы}');
    expect(entryHtml('{1d20}')).toBe('<p>{1d20}</p>');
  });

  it('черта и подпись в списке', () => {
    expect(entryHtml('а\n\n---\n\nб')).toBe('<p>а</p><hr><p>б</p>');
    expect(pagePreview('---\nx: 1\n---\n## План\n> Текст для [[Староста|старосты]]\n- [ ] **задача**')).toBe('План Текст для старосты задача');
  });
});

describe('журнал: папки', () => {
  it('папку внутри журнала можно переименовать и перенести, саму папку журнала — нет', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const { pages } = await import('../src/main/journal');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-journal-'));
    try {
      const resolve = (rel: string) => path.join(root, rel);
      fs.mkdirSync(path.join(root, 'Strahd/journal/NPC'), { recursive: true });
      fs.mkdirSync(path.join(root, 'Strahd/journal/Places'), { recursive: true });
      fs.writeFileSync(path.join(root, 'Strahd/journal/NPC/Ireena.md'), 'x');
      expect(pages.renameFolder(resolve, 'Strahd/journal/NPC', 'People')).toBe('Strahd/journal/People');
      expect(fs.existsSync(path.join(root, 'Strahd/journal/People/Ireena.md'))).toBe(true);
      expect(pages.renameFolder(resolve, 'Strahd/journal/People', 'Places')).toBe('Strahd/journal/Places (2)');
      expect(pages.renameFolder(resolve, 'Strahd/journal', 'Notes')).toBeNull();
      expect(pages.move(resolve, 'Strahd/journal/Places (2)', 'Strahd/journal/Places')).toBe('Strahd/journal/Places/Places (2)');
      expect(pages.move(resolve, 'Strahd/journal/Places', 'Strahd/journal/Places/Places (2)')).toBeNull();
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('журнал: PDF', () => {
  it('[[Книга#12]] — страница PDF; якорь ссылки сохраняется в разметке', () => {
    expect(pdfLink('Книга#12')).toEqual({ name: 'Книга', page: 12 });
    expect(pdfLink('Книга # p. 7')).toEqual({ name: 'Книга', page: 7 });
    expect(pdfLink('Книга#Глава')).toEqual({ name: 'Книга#Глава', page: null });
    expect(pageTitle('Strahd/journal/Книга.pdf')).toBe('Книга');
    expect(isPdf('a/Book.PDF')).toBe(true);
    expect(entryHtml('[[Книга#12]] и [[Книга#3|третья]]')).toContain('<a class="wikilink" data-link="Книга" data-anchor="12">Книга › 12</a>');
    expect(entryHtml('[[Книга#3|третья]]')).toContain('data-anchor="3">третья</a>');
  });

  it('PDF в журнале: виден сканером, переименовывается и переносится, но не читается как текст', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const { pages } = await import('../src/main/journal');
    const { scanVault } = await import('../src/main/scan');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-journal-'));
    try {
      const resolve = (rel: string) => path.join(root, rel);
      fs.mkdirSync(path.join(root, 'Strahd/journal/Books'), { recursive: true });
      fs.writeFileSync(path.join(root, 'Strahd/journal/Curse.pdf'), '%PDF');
      fs.writeFileSync(path.join(root, 'Strahd/other.pdf'), '%PDF');
      const files = (f: ReturnType<typeof scanVault>): { path: string; kind: string }[] => [...f.files, ...f.folders.flatMap(files)];
      expect(files(scanVault(root)).filter((f) => f.kind === 'pdf').map((f) => f.path)).toEqual(['Strahd/journal/Curse.pdf']);
      expect(pages.read(resolve, 'Strahd/journal/Curse.pdf')).toBeNull();
      expect(pages.rename(resolve, 'Strahd/journal/Curse.pdf', 'Curse of Strahd')).toBe('Strahd/journal/Curse of Strahd.pdf');
      expect(pages.move(resolve, 'Strahd/journal/Curse of Strahd.pdf', 'Strahd/journal/Books')).toBe('Strahd/journal/Books/Curse of Strahd.pdf');
      expect(fs.existsSync(path.join(root, 'Strahd/journal/Books/Curse of Strahd.pdf'))).toBe(true);
      expect(pages.rename(resolve, 'Strahd/other.pdf', 'x')).toBeNull();
      expect(roleAccepts('journal', 'Book.pdf')).toBe(true);
      expect(roleAccepts('journal', 'map.png')).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('журнал: закреплённые', () => {
  it('несколько на приключение; старое сохранение с одной заметкой переводится; перенос правит пути', async () => {
    const { default: journal } = await import('../src/modules/journal/main');
    const { ctx, run } = await import('./helpers');
    let s = journal.init!({ pinned: { Strahd: 'Strahd/journal/Plan.md' } as never }, ctx());
    expect(s.pinned['Strahd']).toEqual(['Strahd/journal/Plan.md']);
    s = run(journal, s, 'pin', { adventure: 'Strahd', path: 'Strahd/journal/Book.pdf' });
    s = run(journal, s, 'pin', { adventure: 'Strahd', path: 'Strahd/journal/Book.pdf' });
    expect(s.pinned['Strahd']).toEqual(['Strahd/journal/Plan.md', 'Strahd/journal/Book.pdf']);
    s = run(journal, s, 'move', { from: 'Strahd/journal/Book.pdf', to: 'Strahd/journal/Books/Book.pdf' });
    s = run(journal, s, 'unpin', { adventure: 'Strahd', path: 'Strahd/journal/Plan.md' });
    expect(s.pinned['Strahd']).toEqual(['Strahd/journal/Books/Book.pdf']);
    s = run(journal, s, 'unpin', { adventure: 'Strahd', path: 'Strahd/journal/Books/Book.pdf' });
    expect(s.pinned['Strahd']).toBeUndefined();
  });
});
