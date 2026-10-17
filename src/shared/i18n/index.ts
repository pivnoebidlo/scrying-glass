// All interface messages, by language. Each part (the app shell, later every module) keeps its own `en` and `ru`;
// here they are merged. English is the source of truth and the fallback for a missing message.
// The current language is set by the main process (from settings) and by the windows (from the state).
import { FALLBACK, format, type Lang, type Params } from './core';
import * as app from './app';
import * as vault from '../../modules/vault/i18n';
import * as scenes from '../../modules/scenes/i18n';
import * as scene from '../../modules/scene/i18n';
import * as handouts from '../../modules/handouts/i18n';
import * as portraits from '../../modules/portraits/i18n';
import * as sounds from '../../modules/sounds/i18n';
import * as maps from '../../modules/maps/i18n';

export * from './core';

export const en = { ...app.en, ...vault.en, ...scenes.en, ...scene.en, ...handouts.en, ...portraits.en, ...sounds.en, ...maps.en };
const dicts: Record<Lang, Partial<Record<Key, unknown>>> = { en, ru: { ...app.ru, ...vault.ru, ...scenes.ru, ...scene.ru, ...handouts.ru, ...portraits.ru, ...sounds.ru, ...maps.ru } };

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
