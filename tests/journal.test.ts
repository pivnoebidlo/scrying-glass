import { describe, expect, it } from 'vitest';
import { pagePreview, pageTitle, splitProps, toggleTask } from '../src/shared/journal';
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
    expect(html).toContain('<button type="button" class="dice" data-dice="2d6+3" title="Бросить">2d6+3</button>');
    expect(html).toContain('{не кубы}');
    expect(entryHtml('{1d20}')).toBe('<p>{1d20}</p>');
  });

  it('черта и подпись в списке', () => {
    expect(entryHtml('а\n\n---\n\nб')).toBe('<p>а</p><hr><p>б</p>');
    expect(pagePreview('---\nx: 1\n---\n## План\n> Текст для [[Староста|старосты]]\n- [ ] **задача**')).toBe('План Текст для старосты задача');
  });
});
