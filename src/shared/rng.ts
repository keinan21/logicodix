/**
 * src/shared/rng.ts
 * Acak deterministik dengan seed (ARCHITECTURE §1 prinsip 6, §12).
 * Satu-satunya tempat acak di repo; game logic lain hanya menerima state sebagai argumen.
 *
 * Algoritma: mulberry32 (32-bit). Dengan seed yang sama, urutan hasil sama persis.
 */

export type RNGState = number;

/** Normalisasi seed ke uint32 non-nol. */
export function createRNGSeed(seed: number): RNGState {
  const s = Math.floor(seed) >>> 0;
  return s === 0 ? 1 : s;
}

/**
 * Langkah acak berikutnya.
 * @returns value float di [0, 1) dan state baru (pure, tidak mutasi input).
 */
export function nextRNG(state: RNGState): { value: number; state: RNGState } {
  let t = (state + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return { value, state: t };
}

/** Acak integer di [min, max] inklusif. */
export function randomInt(
  state: RNGState,
  min: number,
  max: number,
): { value: number; state: RNGState } {
  const { value, state: next } = nextRNG(state);
  const range = max - min + 1;
  return { value: min + Math.floor(value * range), state: next };
}

/** Pilih satu elemen acak dari array tidak kosong. */
export function randomChoice<T>(
  state: RNGState,
  items: readonly T[],
): { value: T; state: RNGState } {
  if (items.length === 0) throw new Error('randomChoice: items kosong');
  const { value, state: next } = nextRNG(state);
  const idx = Math.floor(value * items.length);
  const chosen = items[idx];
  if (chosen === undefined) throw new Error('randomChoice: indeks di luar rentang');
  return { value: chosen, state: next };
}

/**
 * Fisher-Yates shuffle deterministik.
 * Mengembalikan array baru; input tidak diubah.
 */
export function shuffle<T>(state: RNGState, items: readonly T[]): { value: T[]; state: RNGState } {
  const arr = [...items];
  let s = state;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const { value, state: next } = nextRNG(s);
    const j = Math.floor(value * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
    s = next;
  }
  return { value: arr, state: s };
}
