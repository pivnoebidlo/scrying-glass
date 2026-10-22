// Журнал мастера (shared/journal.ts): Markdown-заметки в папках журнала хранилища — у приключения и общие.
// Библиотеки у журнала нет: заметки всегда про конкретную кампанию.
import { t } from '../shared/i18n';
import { PDF } from '../shared/vault';
import { textKind } from './textstore';

export const pages = textKind('journal', 'journal', () => t('core.name.page'), PDF);
