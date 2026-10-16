// Действие use:spellLinks — заклинания в уже нарисованном тексте становятся ссылками на справочник (щелчок
// открывает выдвижную панель записи).
//   'em'   — статблок: заклинания там пишут курсивом («*огненный шар*»), ссылкой становится курсив с точным названием;
//   'text' — список заклинаний в листе персонажа: названия ищутся во всём тексте.
// Текст перерисовывается Svelte ({@html}) — MutationObserver применяет ссылки заново.
import { t } from '../i18n.svelte';
import { onSpellIndex, peekEntry, spellName, spellPattern } from './peek.svelte';

const link = (name: string, text: string) => {
  const a = document.createElement('a');
  a.className = 'wikilink spell';
  a.dataset['link'] = name;
  a.title = t('lib.openInCompendium');
  a.textContent = text;
  return a;
};

function linkEm(root: HTMLElement) {
  for (const em of root.querySelectorAll('em')) {
    // Курсив в названии действия («Туманный шаг.») — не ссылка, и уже сделанные ссылки не трогаем.
    if (em.closest('strong') || em.querySelector('a')) continue;
    const name = spellName(em.textContent ?? '');
    if (!name) continue;
    const text = em.textContent ?? '';
    em.textContent = '';
    em.append(link(name, text));
  }
}

function linkText(root: HTMLElement) {
  const re = spellPattern();
  if (!re) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (!n.parentElement?.closest('a')) nodes.push(n as Text);
  for (const node of nodes) {
    const text = node.data;
    re.lastIndex = 0;
    if (!re.test(text)) continue;
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(re)) {
      const name = spellName(m[0]);
      if (!name) continue;
      frag.append(text.slice(last, m.index), link(name, m[0]));
      last = m.index! + m[0].length;
    }
    if (!last) continue;
    frag.append(text.slice(last));
    node.replaceWith(frag);
  }
}

export function spellLinks(node: HTMLElement, mode: 'em' | 'text' = 'em') {
  let current = mode;
  const observer = new MutationObserver(() => apply());
  function apply() {
    observer.disconnect();
    if (current === 'em') linkEm(node);
    else linkText(node);
    observer.observe(node, { childList: true, subtree: true, characterData: true });
  }
  function click(e: MouseEvent) {
    const a = (e.target as HTMLElement).closest('a.wikilink.spell') as HTMLElement | null;
    if (!a || !node.contains(a)) return;
    e.preventDefault();
    e.stopPropagation();
    peekEntry(a.dataset['link'] ?? '');
  }
  node.addEventListener('click', click);
  const off = onSpellIndex(apply);
  apply();
  return {
    update(m: 'em' | 'text') {
      current = m;
      apply();
    },
    destroy() {
      observer.disconnect();
      node.removeEventListener('click', click);
      off();
    },
  };
}
