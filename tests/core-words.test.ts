import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The core knows no game: outside src/systems no code names one. A new line here needs a reason.
const WORDS = /\b(dnd5e[-\w]*|pf2e[-\w]*|mausritter|fitd|fate-core)\b|['"`]fate['"`]/gi;
// Migrations of old data, the module ids in saved state (renaming them needs a migration of state.json and .sgpack) and
// the attribution the licenses ask for.
const ALLOWED = [
  /\/i18n\.ts$/,
  /shared\/i18n\//,
  /shared\/about\.ts$/,
  /shared\/oldcards\.ts$/,
  /shared\/features\.ts$/,
  /modules\/index\.ts$/,
  /modules\/(fate|mausritter)\//,
  /modules\/worldtime\//,
  /modules\/compendium\/events\.ts$/,
  /modules\/tools\/ui\/View\.svelte$/,
  /main\/index\.ts$/,
  /main\/packs\.ts$/,
  /shared\/trash\.ts$/,
];
// Roll kinds of the pack format and styles of the builder's templates: words of the format, not a game.
const FORMAT = /syspack|modules\/tools\/syspack|systems\/pack|renderer\/lib\/rolls/;

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|svelte)$/.test(f) ? [p] : [];
  });
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('the core', () => {
  it('names no game in its code', () => {
    const found = files('src')
      .filter((f) => !f.startsWith('src/systems/') && !ALLOWED.some((r) => r.test(f)))
      .flatMap((f) =>
        code(readFileSync(f, 'utf8'))
          .split('\n')
          .flatMap((line, i) => (line.match(WORDS) ?? []).filter((w) => !(FORMAT.test(f) && /fate|fitd/i.test(w))).map((w) => `${f}:${i + 1} ${w}`)),
      );
    expect(found).toEqual([]);
  });
});
