// Размер миниатюр в сетках картинок (ширина плитки в пикселях). У каждой вкладки свой, запоминается в окне.
const KEY = 'sg.thumbs';

export type ThumbGrid = 'portraits' | 'backgrounds' | 'files';

// По умолчанию и пределы ползунка: портреты вытянуты вверх, фоны — широкие.
export const THUMB_LIMITS: Record<ThumbGrid, { def: number; min: number; max: number }> = {
  portraits: { def: 180, min: 110, max: 360 },
  backgrounds: { def: 280, min: 160, max: 560 },
  files: { def: 170, min: 110, max: 360 },
};

function load(): Partial<Record<ThumbGrid, number>> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

const saved = load();
export const thumbs = $state<Record<ThumbGrid, number>>({
  portraits: saved.portraits ?? THUMB_LIMITS.portraits.def,
  backgrounds: saved.backgrounds ?? THUMB_LIMITS.backgrounds.def,
  files: saved.files ?? THUMB_LIMITS.files.def,
});

$effect.root(() => {
  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(thumbs));
    } catch {
      /* не страшно: просто не запомним */
    }
  });
});
