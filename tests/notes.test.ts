import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createNote, readNote, renameNote, writeNote } from '../src/main/notes';
import { isNotePath, newNote, noteTitle, parseNote } from '../src/shared/notes';
import { fileKind } from '../src/shared/vault';
import { noteHtml } from '../src/renderer/lib/note/markup';
import { creaseSvg, holesMask, marksSvg } from '../src/renderer/lib/note/marks';
import { markTint, newMark } from '../src/shared/notes';

describe('формат записки', () => {
  it('файл записки узнаётся по имени', () => {
    expect(fileKind('Письмо.note.json')).toBe('note');
    expect(fileKind('гоблин.json')).toBeNull();
    expect(isNotePath('a/b/Письмо.NOTE.json')).toBe(true);
    expect(noteTitle('Глава 1/handouts/Письмо старосты.note.json')).toBe('Письмо старосты');
  });

  it('неизвестные и испорченные поля — по умолчанию, числа в пределах', () => {
    const n = parseNote({ scryingGlass: 'note', text: 'Привет', font: 'comic-sans', size: 99, paper: 'dark' })!;
    expect(n.text).toBe('Привет');
    expect(n.font).toBe(newNote().font);
    expect(n.size).toBe(15);
    expect(n.paper).toBe('dark');
    expect(parseNote({ text: 'не записка' })).toBeNull();
  });

  it('разметка: заголовки, украшение, курсив; текст экранируется', () => {
    const html = noteHtml('# Письмо\n\nДорогой *друг* <b>!</b>\n\n---\n\n## Приписка');
    expect(html).toBe('<h1>Письмо</h1><p>Дорогой <em>друг</em> &lt;b&gt;!&lt;/b&gt;</p><div class="orn">❧ ✦ ☙</div><h2>Приписка</h2>');
  });
});

describe('следы и помятость', () => {
  it('следы из файла: чужие виды отбрасываются, числа — в пределах, цвет — только из допустимых', () => {
    const n = parseNote({
      scryingGlass: 'note',
      crease: 'crushed',
      marks: [
        { kind: 'splatter', x: 0.3, y: 5, size: 9, seed: 4, tint: 'ink' },
        { kind: 'кетчуп', x: 0.5, y: 0.5 },
        'мусор',
        { kind: 'ring', tint: 'blood' },
      ],
    })!;
    expect(n.crease).toBe('crushed');
    expect(n.marks.map((m) => m.kind)).toEqual(['splatter', 'ring']);
    expect(n.marks[0]).toMatchObject({ x: 0.3, y: 1.2, size: 1, tint: 'ink' });
    expect(markTint(n.marks[0]!)).toBe('ink');
    // У кружки крови не бывает — берётся её первый цвет.
    expect(markTint(n.marks[1]!)).toBe('coffee');
    expect(parseNote({ scryingGlass: 'note' })!.marks).toEqual([]);
    expect(parseNote({ scryingGlass: 'note', crease: 'порвана' })!.crease).toBe('none');
  });

  it('печать из старых записок (одна, в углу) становится следом на том же месте', () => {
    const n = parseNote({ scryingGlass: 'note', shape: 'portrait', seal: 'green', sealLetter: 'АБВ', signature: 'Гилберт', seed: 5 })!;
    expect(n.marks).toHaveLength(1);
    expect(n.marks[0]).toMatchObject({ kind: 'seal', tint: 'greenWax', text: 'АБ', x: 0.15 });
    expect(n.marks[0]!.y).toBeCloseTo(1 - 0.14 * 0.75);
    expect('seal' in n).toBe(false);
    expect(parseNote({ scryingGlass: 'note', seal: 'none' })!.marks).toEqual([]);
    // Знак — только из известных, надпись — в пределах.
    const s = parseNote({ scryingGlass: 'note', marks: [{ kind: 'stamp', emblem: 'pentagram', text: 'x'.repeat(99), broken: true }] })!.marks[0]!;
    expect(s.emblem).toBeUndefined();
    expect(s.text).toHaveLength(40);
    expect(s.broken).toBeUndefined();
  });

  it('рисунок следа зависит только от зерна; дыры — в маске листа', () => {
    const a = { ...newMark('splatter', 0.5, 0.5), id: 'a', seed: 42 };
    expect(marksSvg([a], 'u', 1333, '#9c6a2e')).toEqual(marksSvg([{ ...a }], 'u', 1333, '#9c6a2e'));
    expect(marksSvg([a], 'u', 1333, '#9c6a2e').multiply).not.toBe(marksSvg([{ ...a, seed: 43 }], 'u', 1333, '#9c6a2e').multiply);
    expect(holesMask([a], 1333)).toBeNull();
    expect(holesMask([a, { ...newMark('hole', 0.2, 0.2), id: 'h' }], 1333)).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(creaseSvg('none', 1, 1333, 'u')).toBe('');
    expect(creaseSvg('crumpled', 1, 1333, 'u')).toBe(creaseSvg('crumpled', 1, 1333, 'u'));
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
