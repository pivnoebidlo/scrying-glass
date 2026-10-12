// Экран игроков: портреты с подписями и автоматической раскладкой.
SG.register({
  id: 'portraits',

  mount(el) {
    this.container = document.createElement('div');
    this.container.className = 'portraits';
    el.appendChild(this.container);
    this.items = new Map(); // id -> { node, caption }
  },

  render(ms) {
    const byId = new Map(ms.library.map((p) => [p.id, p]));
    const ids = ms.onScreen.filter((id) => byId.has(id));
    const n = ids.length;

    // Раскладка: до 4 портретов в один ряд, дальше в два ряда.
    const rows = n <= 4 ? 1 : 2;
    const cols = Math.max(1, rows === 1 ? n : Math.ceil(n / 2));
    this.container.style.setProperty('--cols', cols);
    this.container.style.setProperty('--rows', rows);

    // Размер подписи зависит от количества портретов.
    const cap = rows === 2 ? 2.4 : n <= 2 ? 4 : n === 3 ? 3.4 : 3;
    this.container.style.setProperty('--cap', cap + 'vmin');
    this.container.classList.toggle('no-captions', ms.showNames === false);

    // Убираем тех, кого больше нет на экране.
    for (const [id, item] of this.items) {
      if (!ids.includes(id)) {
        item.node.remove();
        this.items.delete(id);
      }
    }

    for (const id of ids) {
      const p = byId.get(id);
      let item = this.items.get(id);

      if (!item) {
        const node = document.createElement('div');
        node.className = 'portrait';

        const frame = document.createElement('div');
        frame.className = 'frame';
        const img = document.createElement('img');
        img.src = SG.assetUrl(p);
        frame.appendChild(img);

        const caption = document.createElement('div');
        caption.className = 'caption';

        node.append(frame, caption);
        this.container.appendChild(node);
        item = { node, caption };
        this.items.set(id, item);
        requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('shown')));
      }

      // Подпись обновляется на лету (например, при переименовании).
      item.caption.textContent = p.name;
      item.caption.hidden = !p.name;
    }
  },
});
