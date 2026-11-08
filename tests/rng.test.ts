import { describe, it, expect } from 'vitest';
import { createRNGSeed, nextRNG, randomInt, shuffle } from '../src/shared/rng';

describe('rng', () => {
  it('seed sama menghasilkan urutan sama persis', () => {
    const a = createRNGSeed(42);
    const b = createRNGSeed(42);
    const seqA = [nextRNG(a), nextRNG(nextRNG(a).state), nextRNG(nextRNG(nextRNG(a).state).state)];
    const seqB = [nextRNG(b), nextRNG(nextRNG(b).state), nextRNG(nextRNG(nextRNG(b).state).state)];
    expect(seqA.map((r) => r.value)).toEqual(seqB.map((r) => r.value));
  });

  it('seed berbeda menghasilkan urutan berbeda', () => {
    const a = nextRNG(createRNGSeed(1));
    const b = nextRNG(createRNGSeed(2));
    expect(a.value).not.toBe(b.value);
  });

  it('seed 0 dinormalisasi (tidak macet)', () => {
    const s = createRNGSeed(0);
    expect(s).not.toBe(0);
    expect(nextRNG(s).value).toBeGreaterThanOrEqual(0);
  });

  it('randomInt selalu dalam rentang [min, max]', () => {
    let s = createRNGSeed(7);
    for (let i = 0; i < 200; i++) {
      const r = randomInt(s, 4, 12);
      expect(r.value).toBeGreaterThanOrEqual(4);
      expect(r.value).toBeLessThanOrEqual(12);
      s = r.state;
    }
  });

  it('shuffle mempertahankan elemen dan deterministik', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const s1 = shuffle(createRNGSeed(99), items);
    const s2 = shuffle(createRNGSeed(99), items);
    expect(s1.value).toEqual(s2.value);
    expect([...s1.value].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]); // input tidak diubah
  });
});
