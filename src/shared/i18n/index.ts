// All interface messages, by language. Each part (the app shell, later every module) keeps its own `en` and `ru`;
// here they are merged. English is the source of truth and the fallback for a missing message.
// The current language is set by the main process (from settings) and by the windows (from the state).
import { FALLBACK, format, type Lang, type Params } from './core';
import * as app from './app';

export * from './core';

export const en = { ...app.en };
const dicts: Record<Lang, Partial<Record<Key, unknown>>> = { en, ru: { ...app.ru } };

export type Key = keyof typeof en;

let current: Lang = FALLBACK;
export const setLang = (lang: Lang) => (current = lang);
export const getLang = () => current;

export function tr(lang: Lang, key: Key, params?: Params): string {
  const msg = (dicts[lang]?.[key] ?? en[key] ?? key) as Parameters<typeof format>[1];
  return format(lang, msg, params);
}

// Non-reactive: for the main process and plain code. Svelte components use t from renderer/lib/i18n.svelte.ts.
export const t = (key: Key, params?: Params) => tr(current, key, params);
