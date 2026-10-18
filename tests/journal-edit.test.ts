import { describe, expect, it } from 'vitest';
import { continueMarkup, toggleWrap, type TextEdit } from '../src/shared/journal';
import { entryHtml } from '../src/renderer/lib/entry/markup';

const apply = (text: string, e: TextEdit | null) => (e ? text.slice(0, e.from) + e.insert + text.slice(e.to) : null);

describe('журнал: правка текста', () => {
  it('Enter продолжает цитату, список, задачу и нумерацию', () => {
    expect(apply('> Дорога', continueMarkup('> Дорога', 8))).toBe('> Дорога\n> ');
    expect(apply('  - раз', continueMarkup('  - раз', 7))).toBe('  - раз\n  - ');
    expect(apply('- [x] сделано', continueMarkup('- [x] сделано', 13))).toBe('- [x] сделано\n- [ ] ');
    expect(apply('9. девять', continueMarkup('9. девять', 9))).toBe('9. девять\n10. ');
    expect(continueMarkup('просто текст', 12)).toBeNull();
  });

  it('Enter на пустом пункте заканчивает список', () => {
    const text = '- раз\n- ';
    const e = continueMarkup(text, text.length)!;
    expect(apply(text, e)).toBe('- раз\n');
    expect(e.a).toBe(6);
    expect(apply('> a\n> ', continueMarkup('> a\n> ', 6))).toBe('> a\n');
  });

  it('Enter посреди пункта переносит хвост с маркером', () => {
    expect(apply('- раздва', continueMarkup('- раздва', 5))).toBe('- раз\n- два');
  });

  it('жирный, курсив, зачёркнутый: обернуть и снять', () => {
    expect(apply('слово', toggleWrap('слово', 0, 5, '**'))).toBe('**слово**');
    expect(apply('**слово**', toggleWrap('**слово**', 2, 7, '**'))).toBe('слово');
    expect(apply('**слово**', toggleWrap('**слово**', 0, 9, '**'))).toBe('слово');
    expect(apply('ab', toggleWrap('ab', 1, 1, '~~'))).toBe('a~~~~b');
    expect(toggleWrap('ab', 1, 1, '~~').a).toBe(3);
    // Курсив внутри жирного — не снимает жирный.
    expect(apply('**слово**', toggleWrap('**слово**', 2, 7, '*'))).toBe('***слово***');
  });

  it('~~зачёркнутый~~ в разметке', () => {
    expect(entryHtml('было ~~так~~')).toContain('<s>так</s>');
  });
});
