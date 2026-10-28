// Recovery words of the author's key: the private part of an Ed25519 key is 32 random bytes, which are 24 words of
// the BIP39 English list (2048 words, the last one carries a checksum). The words are the key itself — the key of an
// author who published before them gives words too, and the words give back the very same key.
// Pure functions: the core turns words into a key, the window checks what the GM types.
import { entropyToMnemonic, mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

export const WORD_COUNT = 24;

const known = new Set(wordlist);

// The words of a key's private part (32 bytes).
export const keyWords = (seed: Uint8Array): string[] => entropyToMnemonic(seed, wordlist).split(' ');

// Words from whatever the GM pasted or typed: any case, numbers («1.», «2)»), commas and line breaks around them.
// A word may be cut to its first four letters or more — they are enough to tell any two words of the list apart.
export function readWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;]+/)
    .map((w) => w.replace(/^\d+[.):]?/, ''))
    .filter(Boolean)
    .map(fullWord);
}

function fullWord(w: string): string {
  if (known.has(w) || w.length < 4) return w;
  const found = wordlist.filter((x) => x.startsWith(w));
  return found.length === 1 ? found[0]! : w;
}

export type WordsProblem = 'count' | 'unknown' | 'checksum';

// What is wrong with the words, if anything: unknown — the numbers (from 0) of the words not on the list.
export function checkWords(words: string[]): { problem: WordsProblem | null; unknown: number[] } {
  const unknown = words.flatMap((w, i) => (known.has(w) ? [] : [i]));
  if (unknown.length) return { problem: 'unknown', unknown };
  if (words.length !== WORD_COUNT) return { problem: 'count', unknown };
  try {
    mnemonicToEntropy(words.join(' '), wordlist);
  } catch {
    return { problem: 'checksum', unknown };
  }
  return { problem: null, unknown };
}

// The private part back from the words; throws when they are not right.
export function wordsKey(words: string[]): Uint8Array {
  if (checkWords(words).problem) throw new Error('words');
  return mnemonicToEntropy(words.join(' '), wordlist);
}
