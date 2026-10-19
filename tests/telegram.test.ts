import { describe, expect, it } from 'vitest';
import { setLang } from '../src/shared/i18n';
import { TYPES } from '../src/shared/compendium';
import { addToInbox, chatName, entryToTelegram, incoming, markdownToTelegram, migrateChats, migrateInbox, photoSize, safeTgHtml, sortChats, splitMessage, chatsAt, withTables, unreadCount, type RawMessage } from '../src/shared/telegram';

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

describe('telegram: входящие', () => {
  const chats = [
    { id: 1, kind: 'private' as const, title: 'Ann (@ann)', enabled: true, label: 'Гилберт' },
    { id: 2, kind: 'group' as const, title: 'Party', enabled: true },
    { id: 3, kind: 'private' as const, title: 'Stranger', enabled: false },
  ];
  const raw = (over: Partial<RawMessage>): RawMessage => ({ message_id: 7, date: 1000, chat: { id: 1 }, from: { first_name: 'Ann' }, text: 'Привет', ...over });

  it('из включённого чата — сообщение; из выключенного, от бота и команды — нет', () => {
    expect(incoming(raw({}), chats)).toMatchObject({ id: '1:7', chat: 1, from: 'Гилберт', text: 'Привет', date: 1000000 });
    expect(incoming(raw({ chat: { id: 2 }, from: { first_name: 'Bob', last_name: 'Ray' } }), chats)?.from).toBe('Bob Ray');
    expect(incoming(raw({ chat: { id: 3 } }), chats)).toBeNull();
    expect(incoming(raw({ from: { is_bot: true } }), chats)).toBeNull();
    expect(incoming(raw({ text: '/start' }), chats)).toBeNull();
  });

  it('стикер, голосовое, фото с подписью', () => {
    expect(incoming(raw({ text: undefined, sticker: { emoji: '🐉' } }), chats)).toMatchObject({ kind: 'sticker', text: '🐉' });
    expect(incoming(raw({ text: undefined, voice: {} }), chats)?.kind).toBe('voice');
    const p = incoming(raw({ text: undefined, caption: 'Карта', photo: [{ file_id: 'a', width: 90, height: 90 }] }), chats)!;
    expect([p.text, p.kind]).toEqual(['Карта', undefined]);
  });

  it('входящие без повторов, по времени, непрочитанные считаются; фото — не огромное', () => {
    const a = incoming(raw({}), chats)!;
    const b = { ...incoming(raw({ message_id: 8, date: 900 }), chats)!, read: true };
    const list = addToInbox(addToInbox(addToInbox([], a), b), a);
    expect(list.map((m) => m.id)).toEqual(['1:8', '1:7']);
    expect(unreadCount(list)).toBe(1);
    expect(unreadCount(list, 2)).toBe(0);
    const sizes = [{ file_id: 's', width: 90, height: 60 }, { file_id: 'm', width: 1280, height: 853 }, { file_id: 'l', width: 2560, height: 1706 }];
    expect(photoSize(sizes)?.file_id).toBe('m');
    expect(photoSize([sizes[2]!])?.file_id).toBe('l');
  });
});

describe('telegram: группа стала супергруппой', () => {
  it('чат переезжает на новый id со включением и подписью; уже появившийся новый — сливается', () => {
    const chats = [
      { id: -1, kind: 'group' as const, title: 'Партия', enabled: true, label: 'Стол' },
      { id: 5, kind: 'private' as const, title: 'Ann', enabled: true },
    ];
    expect(migrateChats(chats, -1, -100)).toEqual([chats[1], { id: -100, kind: 'group', title: 'Партия', enabled: true, label: 'Стол' }]);
    const both = [...chats, { id: -100, kind: 'group' as const, title: 'Партия (новая)', enabled: false }];
    const merged = migrateChats(both, -1, -100);
    expect(merged).toHaveLength(2);
    expect(merged.find((c) => c.id === -100)).toMatchObject({ enabled: true, label: 'Стол', title: 'Партия (новая)' });
    expect(migrateChats(chats, -7, -100)).toBe(chats);
  });

  it('переписка переезжает вместе с чатом, номера старых сообщений забываются', () => {
    const list = [
      { id: '-1:3', chat: -1, from: 'Bob', text: 'hi', date: 1 },
      { id: '-1:out:9', chat: -1, from: '', text: 'yo', date: 2, mine: true, tgIds: [4] },
      { id: '5:1', chat: 5, from: 'Ann', text: 'x', date: 3 },
    ];
    const moved = migrateInbox(list, -1, -100);
    expect(moved.map((m) => m.id)).toEqual(['-100:3', '-100:out:9', '5:1']);
    expect(moved[1]!.tgIds).toBeUndefined();
  });
});

describe('telegram: оформление', () => {
  it('зачёркнутый, подчёркнутый, курсив подчёркиваниями, спойлер', () => {
    expect(markdownToTelegram('~~нет~~ __да__ _так_ ||тайна|| snake_case_name')).toBe('<s>нет</s> <u>да</u> <i>так</i> <tg-spoiler>тайна</tg-spoiler> snake_case_name');
  });
  it('в приложении показываются только теги Telegram, остальное — текстом', () => {
    expect(safeTgHtml('<b>a</b> &lt;i&gt; <img src=x onerror=1><tg-spoiler>s</tg-spoiler>')).toBe('<b>a</b> &lt;i&gt; &lt;img src=x onerror=1&gt;<tg-spoiler>s</tg-spoiler>');
  });
  it('сначала группы, потом игроки', () => {
    const c = [{ kind: 'private' as const, id: 1 }, { kind: 'group' as const, id: 2 }, { kind: 'private' as const, id: 3 }, { kind: 'group' as const, id: 4 }];
    expect(sortChats(c).map((x) => x.id)).toEqual([2, 4, 1, 3]);
  });
});

describe('telegram: столы', () => {
  const chats = [
    { id: 1, kind: 'group' as const, title: 'Четверг', enabled: true, table: 'a' },
    { id: 2, kind: 'group' as const, title: 'Онлайн', enabled: true, table: 'b' },
    { id: 3, kind: 'private' as const, title: 'Ann', enabled: true },
  ];
  it('за столом видны его чаты и чаты без стола; без выбранного стола — все', () => {
    expect(chatsAt(chats, 'a').map((c) => c.id)).toEqual([1, 3]);
    expect(chatsAt(chats, '').map((c) => c.id)).toEqual([1, 2, 3]);
  });
  it('убранный стол: его чаты остаются без стола', () => {
    const next = withTables(chats, [{ id: 'a', name: 'Четверг' }]);
    expect(next.map((c) => c.table)).toEqual(['a', undefined, undefined]);
  });
});
