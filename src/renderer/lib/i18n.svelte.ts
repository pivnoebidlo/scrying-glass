// Interface language in a window: reactive, so text re-renders when the language changes in settings.
// Set from the state (vault.lang) by store.svelte.ts.
import { FALLBACK, setLang, tr, trackLang, type Key, type Lang, type Params } from '../../shared/i18n';

export const locale = $state({ lang: FALLBACK as Lang });
// Shared code reads the language through this too, so its text is reactive in the windows.
trackLang(() => void locale.lang);

export function applyLang(lang: Lang) {
  setLang(lang);
  locale.lang = lang;
}

export const t = (key: Key, params?: Params) => tr(locale.lang, key, params);
