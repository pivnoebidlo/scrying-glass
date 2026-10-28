import { describe, expect, it } from 'vitest';
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { checkWords, keyWords, readWords, wordsKey, WORD_COUNT } from '../src/shared/keywords';

describe('recovery words of the author key', () => {
  it('an Ed25519 key made the way the app makes it: words and back give the same key', () => {
    const jwk = generateKeyPairSync('ed25519').privateKey.export({ format: 'jwk' });
    const words = keyWords(Buffer.from(jwk.d!, 'base64url'));
    expect(words).toHaveLength(WORD_COUNT);
    const seed = wordsKey(words);
    expect(Buffer.from(seed).toString('base64url')).toBe(jwk.d);
    // The same PKCS#8 the core builds: the public part matches, and it signs as the old one.
    const key = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]), format: 'der', type: 'pkcs8' });
    expect(key.export({ format: 'jwk' }).x).toBe(jwk.x);
    const sig = sign(null, Buffer.from('x'), key);
    expect(verify(null, Buffer.from('x'), createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: jwk.x! }, format: 'jwk' }), sig)).toBe(true);
  });

  it('reads what the GM pasted: numbers, commas, any case, four-letter starts', () => {
    const words = keyWords(new Uint8Array(32).fill(42));
    const pasted = words.map((w, i) => `${i + 1}. ${i % 3 ? w.toUpperCase() : w.slice(0, 4)}`).join(',\n');
    expect(readWords(pasted)).toEqual(words);
    expect(checkWords(readWords(pasted)).problem).toBeNull();
  });

  it('tells what is wrong', () => {
    const words = keyWords(new Uint8Array(32).fill(1));
    expect(checkWords(words.slice(0, 23)).problem).toBe('count');
    expect(checkWords(['abandon', 'zzzz', ...words.slice(2)])).toEqual({ problem: 'unknown', unknown: [1] });
    const swapped = [words[1]!, words[0]!, ...words.slice(2)];
    if (words[0] !== words[1]) expect(checkWords(swapped).problem).toBe('checksum');
    expect(() => wordsKey(words.slice(1))).toThrow();
  });
});
