// Built-in Fate Core compendium: resources/compendium/fate-core.<lang>.json from scripts/fate-core.<lang>.md.
// Run: npm run build-fate. Texts are edited in the .md files (format — scripts/book-md.ts).
import { buildBook } from './book-md.ts';

buildBook('fate-core', 'fate-core', {
  ru: { title: 'Fate Core SRD', license: 'CC-BY-3.0', attribution: 'Evil Hat Productions; перевод — Scrying Glass', translator: 'Scrying Glass', url: 'https://fate-srd.com/fate-core' },
  en: { title: 'Fate Core SRD', license: 'CC-BY-3.0', attribution: 'Evil Hat Productions; retold for Scrying Glass', url: 'https://fate-srd.com/fate-core' },
});
