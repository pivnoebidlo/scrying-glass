// Панель мастера: библиотека портретов, сгруппированная по папкам приключений.
SG.register({
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

    this.list = el.querySelector('[data-role=list]');
    this.empty = el.querySelector('[data-role=empty]');
    this.count = el.querySelector('[data-role=count]');
    this.namesCb = el.querySelector('[data-role=names]');
    this.sections = new Map(); // ключ группы -> секция
    this.cards = new Map();    // id портрета -> карточка

    el.querySelector('[data-act=folder]').addEventListener('click', () => SG.dispatch('portraits', 'addFolder'));
    el.querySelector('[data-act=add]').addEventListener('click', () => SG.dispatch('portraits', 'add'));
    el.querySelector('[data-act=clear]').addEventListener('click', () => SG.dispatch('portraits', 'clearScreen'));
    this.namesCb.addEventListener('change', () => SG.dispatch('portraits', 'setShowNames', { value: this.namesCb.checked }));
  },

  createSection(key) {
    const sec = { key, text: '', collapsed: false };
    sec.el = document.createElement('div');
    sec.el.className = 'group';

    const head = document.createElement('div');
    head.className = 'group-head';
    sec.titleEl = document.createElement('span');
    sec.titleEl.className = 'group-title';
    sec.titleEl.addEventListener('click', () => {
      sec.collapsed = !sec.collapsed;
      sec.grid.hidden = sec.collapsed;
      this.setTitle(sec, sec.text);
    });
    head.appendChild(sec.titleEl);

    if (key !== 'manual') {
      const refresh = document.createElement('button');
      refresh.className = 'secondary small';
      refresh.textContent = 'Обновить';
      refresh.title = 'Перечитать папку: добавить новых персонажей, убрать пропавших';
      refresh.addEventListener('click', () => SG.dispatch('portraits', 'rescanGroup', { groupId: key }));

      const remove = document.createElement('button');
      remove.className = 'secondary small';
      remove.textContent = 'Отключить';
      remove.title = 'Убрать папку из приложения (файлы на диске не удаляются)';
      remove.addEventListener('click', () => {
        if (confirm(`Отключить «${sec.text}»? Файлы на диске останутся нетронутыми.`)) {
          SG.dispatch('portraits', 'removeGroup', { groupId: key });
        }
      });
      head.append(refresh, remove);
    }

    sec.grid = document.createElement('div');
    sec.grid.className = 'grid';
    sec.el.append(head, sec.grid);
    return sec;
  },

  setTitle(sec, text) {
    sec.text = text;
    sec.titleEl.textContent = `${sec.collapsed ? '▸' : '▾'} ${text}`;
  },

  createCard(id) {
    const card = { id, p: null };
    card.el = document.createElement('div');
    card.el.className = 'card';

    card.img = document.createElement('img');
    card.img.className = 'thumb';
    card.img.addEventListener('click', () => SG.dispatch('portraits', 'toggle', { id }));

    card.badge = document.createElement('div');
    card.badge.className = 'badge';
    card.badge.textContent = '● на экране';

    card.del = document.createElement('button');
    card.del.className = 'del';
    card.del.textContent = '×';
    card.del.title = 'Удалить из библиотеки';
    card.del.addEventListener('click', () => {
      if (confirm(`Удалить «${card.p.name}» из библиотеки?`)) SG.dispatch('portraits', 'remove', { id });
    });

    card.input = document.createElement('input');
    card.input.type = 'text';
    card.input.placeholder = 'Подпись';
    card.input.addEventListener('change', () => SG.dispatch('portraits', 'rename', { id, name: card.input.value }));

    card.el.append(card.img, card.badge, card.del, card.input);
    return card;
  },

  render(ms) {
    this.count.textContent = `на экране: ${ms.onScreen.length} из ${ms.library.length}`;
    this.namesCb.checked = ms.showNames !== false;
    this.empty.hidden = ms.library.length > 0 || ms.groups.length > 0;

    // Секции: подключённые папки + «вручную».
    const wanted = ms.groups.map((g) => ({
      key: g.id,
      title: g.name,
      hint: g.path,
      items: ms.library.filter((p) => p.groupId === g.id),
    }));
    const manual = ms.library.filter((p) => !p.groupId);
    if (manual.length) wanted.push({ key: 'manual', title: 'Добавлены вручную', hint: '', items: manual });

    // Убираем секции, которых больше нет.
    for (const [key, sec] of this.sections) {
      if (!wanted.some((w) => w.key === key)) {
        sec.el.remove();
        this.sections.delete(key);
      }
    }

    wanted.forEach((w, i) => {
      let sec = this.sections.get(w.key);
      if (!sec) {
        sec = this.createSection(w.key);
        this.sections.set(w.key, sec);
      }
      sec.titleEl.title = w.hint;
      this.setTitle(sec, w.title);
      sec.titleEl.textContent = `${sec.collapsed ? '▸' : '▾'} ${w.title} (${w.items.length})`;

      // Карточки обновляются на месте, чтобы не терять фокус и клики.
      const keep = new Set(w.items.map((p) => p.id));
      for (const child of [...sec.grid.children]) {
        if (!keep.has(child.dataset.id)) child.remove();
      }
      w.items.forEach((p, j) => {
        let card = this.cards.get(p.id);
        if (!card) {
          card = this.createCard(p.id);
          card.el.dataset.id = p.id;
          card.img.src = SG.assetUrl(p);
          this.cards.set(p.id, card);
        }
        card.p = p;
        const on = ms.onScreen.includes(p.id);
        card.el.classList.toggle('on', on);
        card.badge.hidden = !on;
        card.del.hidden = !!p.path; // файлы из подключённых папок отсюда не удаляются
        card.img.title = on ? 'Нажмите, чтобы убрать с экрана' : 'Нажмите, чтобы показать на экране';
        if (document.activeElement !== card.input && card.input.value !== p.name) card.input.value = p.name;
        if (sec.grid.children[j] !== card.el) sec.grid.insertBefore(card.el, sec.grid.children[j] || null);
      });

      if (this.list.children[i] !== sec.el) this.list.insertBefore(sec.el, this.list.children[i] || null);
    });

    // Чистим карточки удалённых портретов.
    const alive = new Set(ms.library.map((p) => p.id));
    for (const id of [...this.cards.keys()]) if (!alive.has(id)) this.cards.delete(id);
  },
});
