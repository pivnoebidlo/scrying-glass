import { describe, expect, it } from 'vitest';
import { entrySubtitle, parseEntry, serializeEntry } from '../src/shared/compendium';

describe('записи справочника', () => {
  it('шапка: строки, числа, да/нет, списки в обоих видах; без шапки — заметка', () => {
    const e = parseEntry(
      '---\ntype: spell\nlevel: 3\nschool: Воплощение\nconcentration: false\nclasses: [Волшебник, Чародей]\ntags:\n  - огонь\n  - "урон: огнём"\nrange: "150 футов"\n---\n\nЯркая вспышка.\n',
      'Огненный шар',
    );
    expect(e).toEqual({
      title: 'Огненный шар',
      type: 'spell',
      fields: { level: 3, school: 'Воплощение', concentration: false, classes: ['Волшебник', 'Чародей'], tags: ['огонь', 'урон: огнём'], range: '150 футов' },
      body: 'Яркая вспышка.\n',
    });
    expect(parseEntry('Просто текст', 'Заметка').type).toBe('note');
    expect(entrySubtitle(e)).toBe('3 уровень, воплощение');
  });

  it('запись и чтение — туда и обратно; пустые поля не пишутся, опасные строки — в кавычках', () => {
    const e = { title: 'Плащ', type: 'item', fields: { rarity: 'Необычный', attunement: 'да', cost: '', tags: ['одежда'], note: 'a: b', n: '42' }, body: '# Плащ\n\nТекст' };
    const text = serializeEntry(e);
    expect(text).toBe('---\ntype: item\nrarity: Необычный\nattunement: да\ntags:\n  - одежда\nnote: "a: b"\nn: "42"\n---\n\n# Плащ\n\nТекст\n');
    const back = parseEntry(text, 'Плащ');
    expect(back.fields).toEqual({ rarity: 'Необычный', attunement: 'да', tags: ['одежда'], note: 'a: b', n: '42' });
    expect(entrySubtitle(back)).toBe('Предмет, необычный, требует настройки');
  });
});

import { entryHtml } from '../src/renderer/lib/entry/markup';

describe('разметка записи', () => {
  it('заголовки, списки, таблицы, ссылки; текст экранируется', () => {
    expect(entryHtml('## На высоких уровнях\nУрон **растёт** на [[Огненный шар|1к6]] <b>.\n\n- раз\n- два\n\n| Ур | Урон |\n|---|---|\n| 3 | 8к6 |')).toBe(
      '<h3>На высоких уровнях</h3><p>Урон <strong>растёт</strong> на <a class="wikilink" data-link="Огненный шар">1к6</a> &lt;b&gt;.</p><ul><li>раз</li><li>два</li></ul><table><thead><tr><th>Ур</th><th>Урон</th></tr></thead><tbody><tr><td>3</td><td>8к6</td></tr></tbody></table>',
    );
  });
});
