import { describe, expect, it } from 'vitest';
import { setLang } from '../src/shared/i18n';
import { TYPES } from '../src/shared/compendium';
import { chatName, entryToTelegram, markdownToTelegram, splitMessage } from '../src/shared/telegram';

describe('Telegram', () => {
  it('Markdown → HTML Telegram: жирный, курсив, заголовки, списки, цитаты, [[ссылки]], экранирование', () => {
    const html = markdownToTelegram('## Огонь\n**Жирный** и *курсив* <тег> & [[Огненный шар]], [[Ослеплённый|ослеплён]]\n- раз\n- [ ] задача\n> зачитать\n> дальше');
    expect(html).toBe(
      '<b>Огонь</b>\n<b>Жирный</b> и <i>курсив</i> &lt;тег&gt; &amp; Огненный шар, ослеплён\n• раз\n☐ задача\n<blockquote>зачитать\nдальше</blockquote>'
    );
    expect(markdownToTelegram('| Блюдо | Цена |\n|---|---|\n| Эль | 4 мм |')).toBe('Блюдо — Цена\nЭль — 4 мм');
  });

  it('длинный текст делится на сообщения не длиннее предела', () => {
    const text = Array.from({ length: 30 }, (_, i) => `Абзац ${i} `.repeat(30)).join('\n\n');
    const parts = splitMessage(text, 1000);
    expect(parts.length).toBeGreaterThan(5);
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(1000);
    expect(parts.join('\n\n')).toBe(text);
    expect(splitMessage('коротко')).toEqual(['коротко']);
  });

  it('запись справочника: название, строка под ним, поля, текст', () => {
    setLang('ru');
    const html = entryToTelegram(
      { title: 'Огненный шар', type: 'spell', fields: { level: 3, school: 'Воплощение', casting_time: 'Действие', range: '150 футов' }, body: 'Яркая **вспышка**.' },
      TYPES['spell']!
    );
    setLang('en');
    expect(html).toBe('<b>Огненный шар</b>\n\n<i>3 уровень, воплощение</i>\n\n<b>Время накладывания:</b> Действие\n<b>Дистанция:</b> 150 футов\n\nЯркая <b>вспышка</b>.');
    expect(chatName({ id: 1, kind: 'private', title: 'Аня (@anya)', enabled: true, label: 'Гилберт' })).toBe('Гилберт (Аня (@anya))');
  });
});
