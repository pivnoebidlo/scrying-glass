import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createNote, readNote, renameNote, writeNote } from '../src/main/notes';
import { isNotePath, newNote, noteTitle, parseNote } from '../src/shared/notes';
import { fileKind } from '../src/shared/vault';
import { noteHtml } from '../src/renderer/lib/note/markup';

describe('формат записки', () => {
  it('файл записки узнаётся по имени', () => {
    expect(fileKind('Письмо.note.json')).toBe('note');
    expect(fileKind('гоблин.json')).toBeNull();
    expect(isNotePath('a/b/Письмо.NOTE.json')).toBe(true);
    expect(noteTitle('Глава 1/handouts/Письмо старосты.note.json')).toBe('Письмо старосты');
  });

  it('неизвестные и испорченные поля — по умолчанию, числа в пределах', () => {
    const n = parseNote({ scryingGlass: 'note', text: 'Привет', font: 'comic-sans', size: 99, paper: 'dark', sealLetter: 'АБВ' })!;
    expect(n.text).toBe('Привет');
    expect(n.font).toBe(newNote().font);
    expect(n.size).toBe(15);
    expect(n.paper).toBe('dark');
    expect(n.sealLetter).toBe('АБ');
    expect(parseNote({ text: 'не записка' })).toBeNull();
  });

  it('разметка: заголовки, украшение, курсив; текст экранируется', () => {
    const html = noteHtml('# Письмо\n\nДорогой *друг* <b>!</b>\n\n---\n\n## Приписка');
    expect(html).toBe('<h1>Письмо</h1><p>Дорогой <em>друг</em> &lt;b&gt;!&lt;/b&gt;</p><div class="orn">❧ ✦ ☙</div><h2>Приписка</h2>');
  });
});

describe('файлы записок', () => {
  let dir = '';
  const resolve = (rel: string) => path.join(dir, rel);
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('создать (папка появляется сама, имена не повторяются), записать, прочитать, переименовать', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-notes-'));
    const a = createNote(resolve, 'Страд/handouts', 'Письмо: важное?', newNote())!;
    expect(a).toBe('Страд/handouts/Письмо важное.note.json');
    const b = createNote(resolve, 'Страд/handouts', 'Письмо: важное?', newNote())!;
    expect(b).toBe('Страд/handouts/Письмо важное (2).note.json');

    expect(writeNote(resolve, a, { ...newNote(), text: 'Сожгите это письмо' })).toBe(true);
    expect(readNote(resolve, a)!.text).toBe('Сожгите это письмо');
    expect(writeNote(resolve, 'Страд/handouts/картинка.png', newNote())).toBe(false);

    const c = renameNote(resolve, a, 'Приказ')!;
    expect(c).toBe('Страд/handouts/Приказ.note.json');
    expect(readNote(resolve, c)!.text).toBe('Сожгите это письмо');
    expect(fs.existsSync(resolve(a))).toBe(false);
    // То же имя — путь не меняется.
    expect(renameNote(resolve, c, 'Приказ')).toBe(c);
  });
});
