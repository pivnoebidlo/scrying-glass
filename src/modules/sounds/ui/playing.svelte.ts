// Какие звуки сейчас звучат (для подсветки в правой панели) и громкость, пока тянут ползунок. Только окно управления.
export const sfx = $state({ playing: [] as string[], volume: null as number | null });
