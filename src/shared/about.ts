// The «About» facts: the project's addresses, its license, and the credits of the material the app includes (the CC BY
// licenses require the attribution; README and resources/*/README.md say the same in full). Only these addresses
// are opened from the app (isAboutLink).
export const REPO_URL = 'https://github.com/pivnoebidlo/scrying-glass';
export const ISSUES_URL = `${REPO_URL}/issues`;
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
export const GPL_URL = 'https://www.gnu.org/licenses/gpl-3.0.html';
export const AUTHOR = 'pivnoebidlo';

export interface Credit {
  // A key of the dictionary: what it is (about.credit.<id>).
  id: string;
  who: string;
  license: string;
  url: string;
  licenseUrl: string;
}

const CC_BY_4 = 'https://creativecommons.org/licenses/by/4.0/';
export const CREDITS: Credit[] = [
  { id: 'srd', who: 'Wizards of the Coast LLC', license: 'CC BY 4.0', url: 'https://www.dndbeyond.com/srd', licenseUrl: CC_BY_4 },
  { id: 'omnisgm', who: 'OmnisGM', license: 'CC BY 4.0', url: 'https://rules.omnisgm.com', licenseUrl: CC_BY_4 },
  { id: 'fivedb', who: '5e-bits/5e-database', license: 'MIT', url: 'https://github.com/5e-bits/5e-database', licenseUrl: 'https://opensource.org/license/mit' },
  {
    id: 'fate',
    who: 'Evil Hat Productions, LLC — Leonard Balsera, Brian Engard, Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, Rob Donoghue',
    license: 'CC BY 3.0',
    url: 'http://www.faterpg.com/',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
  },
  { id: 'mausritter', who: 'Losing Games and Isaac Williams', license: 'CC BY 4.0', url: 'https://mausritter.com', licenseUrl: CC_BY_4 },
  { id: 'pf2e', who: 'Paizo Inc. — Pathfinder Player Core, Player Core 2, Monster Core', license: 'ORC', url: 'https://paizo.com/licenses/communityuse', licenseUrl: 'https://paizo.com/orclicense' },
  { id: 'pf2edata', who: 'The pf2e system for Foundry VTT', license: 'Apache 2.0', url: 'https://github.com/foundryvtt/pf2e', licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0' },
  { id: 'fitd', who: 'One Seven Design — John Harper', license: 'CC BY 3.0', url: 'http://www.bladesinthedark.com/', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
  { id: 'ambience', who: 'JC Sounds — Nature Ambient Pack Vol 1', license: 'CC BY 4.0', url: 'https://opengameart.org/node/180349', licenseUrl: CC_BY_4 },
  { id: 'sfx', who: 'Kenney, artisticdude, rubberduck', license: 'CC0', url: 'https://opengameart.org', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { id: 'bigsoundbank', who: 'Joseph Sardin — BigSoundBank.com', license: 'CC0', url: 'https://bigsoundbank.com', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { id: 'vgafont', who: 'VileR', license: 'CC BY-SA 4.0', url: 'https://int10h.org/oldschool-pc-fonts/', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  { id: 'fonts', who: 'Google Fonts', license: 'SIL OFL 1.1', url: 'https://fonts.google.com', licenseUrl: 'https://openfontlicense.org' },
  { id: 'icons', who: 'Lucide', license: 'ISC', url: 'https://lucide.dev', licenseUrl: 'https://lucide.dev/license' },
  { id: 'engine', who: 'Electron, Svelte, fflate', license: 'MIT', url: 'https://www.electronjs.org', licenseUrl: 'https://opensource.org/license/mit' },
];

const LINKS = new Set([REPO_URL, ISSUES_URL, LICENSE_URL, GPL_URL, `${REPO_URL}/releases`, ...CREDITS.flatMap((c) => [c.url, c.licenseUrl])]);
export const isAboutLink = (url: string) => LINKS.has(url);
