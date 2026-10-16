// Interface language in a window: reactive, so text re-renders when the language changes in settings.
// Set from the state (vault.lang) by store.svelte.ts.
import { FALLBACK, setLang, tr, type Key, type Lang, type Params } from '../../shared/i18n';

export const locale = $state({ lang: FALLBACK as Lang });

export function applyLang(lang: Lang) {
  setLang(lang);
  locale.lang = lang;
}

export const t = (key: Key, params?: Params) => tr(locale.lang, key, params);
