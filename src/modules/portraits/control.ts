// Панель мастера: библиотека портретов, сгруппированная по папкам приключений.
import { assetUrl, definePanel, dispatch } from '../../renderer/panel';
import { isFromFolder, type Portrait } from './types';

interface Section {
  key: string;
  text: string;
  count: number;
  collapsed: boolean;
  el: HTMLDivElement;
  titleEl: HTMLSpanElement;
  grid: HTMLDivElement;
}

interface Card {
  p: Portrait | null;
  el: HTMLDivElement;
  img: HTMLImageElement;
  badge: HTMLDivElement;
  del: HTMLButtonElement;
  input: HTMLInputElement;
}

export default definePanel({
  id: 'portraits',
  title: 'Портреты',

  mount(el) {
    el.innerHTML = `
      <div class="row" style="margin-bottom:10px">
        <button data-act="folder">Подключить папку…</button>
        <button data-act="add" class="secondary">Добавить картинки…</button>
        <button data-act="clear" class="secondary">Убрать всех с экрана</button>
        <label class="hint"><input type="checkbox" data-role="names"> подписи на экране игроков</label>
        <span class="hint" data-role="count"></span>
      </div>
      <div data-role="list"></div>
      <div class="hint" data-role="empty" hidden>Пока пусто. Подключите папку приключения или добавьте картинки.</div>`;

    const $ = <T extends Element>(sel: string) => el.querySelector<T>(sel)!;
    const list = $<HTMLDivElement>('[data-role=list]');
    const empty = $<HTMLDivElement>('[data-role=empty]');
    const count = $<HTMLSpanElement>('[data-role=count]');
    const namesCb = $<HTMLInputElement>('[data-role=names]');
    const sections = new Map<string, Section>(); // ключ группы -> секция
    const cards = new Map<string, Card>();       // id портрета -> карточка

    $('[data-act=folder]').addEventListener('click', () => dispatch('portraits', 'addFolder'));
    $('[data-act=add]').addEventListener('click', () => dispatch('portraits', 'add'));
    $('[data-act=clear]').addEventListener('click', () => dispatch('portraits', 'clearScreen'));
    namesCb.addEventListener('change', () => dispatch('portraits', 'setShowNames', { value: namesCb.checked }));

    function setTitle(sec: Section, text: string, n: number) {
      sec.text = text;
      sec.count = n;
      sec.titleEl.textContent = `${sec.collapsed ? '▸' : '▾'} ${text} (${n})`;
    }

    function createSection(key: string): Section {
      const sec: Section = {
        key,
        text: '',
        count: 0,
        collapsed: false,
        el: document.createElement('div'),
        titleEl: document.createElement('span'),
        grid: document.createElement('div'),
      };
      sec.el.className = 'group';

      const head = document.createElement('div');
      head.className = 'group-head';
      sec.titleEl.className = 'group-title';
      sec.titleEl.addEventListener('click', () => {
        sec.collapsed = !sec.collapsed;
        sec.grid.hidden = sec.collapsed;
        setTitle(sec, sec.text, sec.count);
      });
      head.appendChild(sec.titleEl);

      if (key !== 'manual') {
        const refresh = document.createElement('button');
        refresh.className = 'secondary small';
        refresh.textContent = 'Обновить';
        refresh.title = 'Перечитать папку: добавить новых персонажей, убрать пропавших';
        refresh.addEventListener('click', () => dispatch('portraits', 'rescanGroup', { groupId: key }));

        const remove = document.createElement('button');
        remove.className = 'secondary small';
        remove.textContent = 'Отключить';
        remove.title = 'Убрать папку из приложения (файлы на диске не удаляются)';
        remove.addEventListener('click', () => {
          if (confirm(`Отключить «${sec.text}»? Файлы на диске останутся нетронутыми.`)) {
            dispatch('portraits', 'removeGroup', { groupId: key });
          }
        });
        head.append(refresh, remove);
      }

      sec.grid.className = 'grid';
      sec.el.append(head, sec.grid);
      return sec;
    }

    function createCard(id: string): Card {
      const card: Card = {
        p: null,
        el: document.createElement('div'),
        img: document.createElement('img'),
        badge: document.createElement('div'),
        del: document.createElement('button'),
        input: document.createElement('input'),
      };
      card.el.className = 'card';
      card.el.dataset['id'] = id;

      card.img.className = 'thumb';
      card.img.addEventListener('click', () => dispatch('portraits', 'toggle', { id }));

      card.badge.className = 'badge';
      card.badge.textContent = '● на экране';

      card.del.className = 'del';
      card.del.textContent = '×';
      card.del.title = 'Удалить из библиотеки';
      card.del.addEventListener('click', () => {
        if (confirm(`Удалить «${card.p?.name}» из библиотеки?`)) dispatch('portraits', 'remove', { id });
      });

      card.input.type = 'text';
      card.input.placeholder = 'Подпись';
      card.input.addEventListener('change', () => dispatch('portraits', 'rename', { id, name: card.input.value }));

      card.el.append(card.img, card.badge, card.del, card.input);
      return card;
    }

    return (ms) => {
      count.textContent = `на экране: ${ms.onScreen.length} из ${ms.library.length}`;
      namesCb.checked = ms.showNames;
      empty.hidden = ms.library.length > 0 || ms.groups.length > 0;

      // Секции: подключённые папки + «вручную».
      const wanted = ms.groups.map((g) => ({
        key: g.id,
        title: g.name,
        hint: g.path,
        items: ms.library.filter((p) => isFromFolder(p) && p.groupId === g.id),
      }));
      const manual = ms.library.filter((p) => !isFromFolder(p));
      if (manual.length) wanted.push({ key: 'manual', title: 'Добавлены вручную', hint: '', items: manual });

      // Убираем секции, которых больше нет.
      for (const [key, sec] of sections) {
        if (!wanted.some((w) => w.key === key)) {
          sec.el.remove();
          sections.delete(key);
        }
      }

      wanted.forEach((w, i) => {
        let sec = sections.get(w.key);
        if (!sec) {
          sec = createSection(w.key);
          sections.set(w.key, sec);
        }
        sec.titleEl.title = w.hint;
        setTitle(sec, w.title, w.items.length);

        // Карточки обновляются на месте, чтобы не терять фокус и клики.
        const keep = new Set(w.items.map((p) => p.id));
        for (const child of [...sec.grid.children] as HTMLElement[]) {
          if (!keep.has(child.dataset['id']!)) child.remove();
        }
        w.items.forEach((p, j) => {
          let card = cards.get(p.id);
          if (!card) {
            card = createCard(p.id);
            card.img.src = assetUrl(p);
            cards.set(p.id, card);
          }
          card.p = p;
          const on = ms.onScreen.includes(p.id);
          card.el.classList.toggle('on', on);
          card.badge.hidden = !on;
          card.del.hidden = isFromFolder(p); // файлы из подключённых папок отсюда не удаляются
          card.img.title = on ? 'Нажмите, чтобы убрать с экрана' : 'Нажмите, чтобы показать на экране';
          if (document.activeElement !== card.input && card.input.value !== p.name) card.input.value = p.name;
          if (sec.grid.children[j] !== card.el) sec.grid.insertBefore(card.el, sec.grid.children[j] || null);
        });

        if (list.children[i] !== sec.el) list.insertBefore(sec.el, list.children[i] || null);
      });

      // Чистим карточки удалённых портретов.
      const alive = new Set(ms.library.map((p) => p.id));
      for (const id of [...cards.keys()]) if (!alive.has(id)) cards.delete(id);
    };
  },
});
