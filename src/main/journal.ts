// Журнал мастера (shared/journal.ts): Markdown-заметки в папках журнала хранилища — у приключения и общие.
// Библиотеки у журнала нет: заметки всегда про конкретную кампанию.
import { textKind } from './textstore';

export const pages = textKind('journal', 'journal', 'Заметка');
