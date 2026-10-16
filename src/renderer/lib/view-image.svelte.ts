// Просмотр картинки крупно у мастера (двойной щелчок по плитке): окно поверх всего, стрелки — соседние картинки,
// кнопки — те же действия, что на плитке. Окно рисует Lightbox.svelte в оболочке окна управления.
export const lightbox = $state({ items: [] as string[], index: 0 });

// Соседние картинки — плитки с data-view рядом с этой (в той же сетке): поднимаемся от плитки, пока не найдём
// контейнер, где их больше одной.
function gallery(from: HTMLElement | null): string[] {
  for (let el = from?.parentElement ?? null, i = 0; el && i < 6; el = el.parentElement, i++) {
    const found = [...el.querySelectorAll<HTMLElement>('[data-view]')].map((x) => x.dataset['view']!);
    if (found.length > 1) return [...new Set(found)];
  }
  return [];
}

// Открыть картинку (путь хранилища или «library:…»); from — плитка, по которой щёлкнули (для соседей).
export function viewImage(path: string, from?: HTMLElement | null) {
  const items = gallery(from ?? null);
  const list = items.includes(path) ? items : [path];
  lightbox.items = list;
  lightbox.index = list.indexOf(path);
}

export const closeLightbox = () => (lightbox.items = []);
