// Built-in Forged in the Dark compendium: resources/compendium/fitd.<lang>.json from scripts/fitd.<lang>.md.
// Run: npm run build-fitd. Texts are edited in the .md files (format — scripts/book-md.ts).
import { buildBook } from './book-md.ts';

buildBook('fitd', 'fitd', {
  ru: { title: 'Forged in the Dark SRD', license: 'CC-BY-3.0', attribution: 'One Seven Design; перевод — Scrying Glass', translator: 'Scrying Glass', url: 'https://bladesinthedark.com/basics' },
  en: { title: 'Forged in the Dark SRD', license: 'CC-BY-3.0', attribution: 'One Seven Design; retold for Scrying Glass', url: 'https://bladesinthedark.com/basics' },
});
