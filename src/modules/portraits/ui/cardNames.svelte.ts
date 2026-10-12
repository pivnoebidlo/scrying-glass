// Названия карточек для подписей портретов: картинка, которая стоит у карточки (любым её портретом),
// подписывается названием карточки. Нужно и окну управления, и окну игроков; список грузится один раз.
import { prettyName } from '../../../shared/vault';
import type { PortraitsState } from '../types';

class CardNames {
  map = $state.raw(new Map<string, string>());
}
const names = new CardNames();

async function refresh() {
  const list = await window.api.listCards();
  // Свои карточки важнее встроенных, русские — английских (у переводов те же картинки).
  const order = (c: (typeof list)[number]) => (c.ref.scope === 'srd' ? 2 : 0) + (c.lang === 'ru' ? 0 : 1);
  const m = new Map<string, string>();
  for (const c of [...list].sort((a, b) => order(a) - order(b))) {
    for (const img of c.images) if (!m.has(img)) m.set(img, c.name);
  }
  names.map = m;
}

let loaded = false;
export function connectCardNames() {
  if (loaded) return;
  loaded = true;
  window.api.onCardsChanged(refresh);
  refresh();
}

export const cardName = (path: string) => names.map.get(path);

// Подпись портрета: заданная вручную, иначе название карточки, иначе имя файла.
export const caption = (ms: PortraitsState, path: string) => ms.names[path] || cardName(path) || prettyName(path);
// Подпись, которая будет, если ручную стереть.
export const autoCaption = (path: string) => cardName(path) || prettyName(path);
