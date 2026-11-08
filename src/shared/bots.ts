/**
 * src/shared/bots.ts
 * Profil bot + keputusan bot dari seed (ARCHITECTURE §3, FR-M10, FR-B14).
 * Bot berjalan di server sebagai pemain biasa; aksinya dijadwalkan dari seed.
 * Bot TIDAK pernah memakai AI.
 */

import { BOT_PROFILES, type BotProfile } from './constants';
import { createRNGSeed, randomChoice, randomInt, nextRNG, type RNGState } from './rng';

export { BOT_PROFILES };
export type { BotProfile };

/** Buat state RNG untuk sebuah room dari seed room. */
export function createBotRNG(seed: number): RNGState {
  return createRNGSeed(seed);
}

export interface BotDecision {
  /** Indeks pilihan bot (0..3), sudah dipetakan ke optionOrder room oleh room.ts. */
  choiceIndex: number;
  /** Jeda sebelum menjawab (ms), sesuai profil. */
  delayMs: number;
  state: RNGState;
}

/**
 * Keputusan bot untuk satu soal, deterministik dari seed.
 * @param profile profil bot (FR-M10)
 * @param state state RNG room
 * @param answerIndex indeks kunci soal ini (0..3) — bot "tahu" kunci hanya untuk simulasi peluang benar
 */
export function botDecide(profile: BotProfile, state: RNGState, answerIndex: number): BotDecision {
  const roll = nextRNG(state);
  const isCorrect = roll.value < profile.chanceCorrect;

  if (isCorrect) {
    // Jawab benar dengan jeda cepat di rentang profil
    const delay = randomInt(roll.state, profile.minDelayMs, profile.maxDelayMs);
    return { choiceIndex: answerIndex, delayMs: delay.value, state: delay.state };
  }

  // Jawab salah: pilih salah satu dari 3 pilihan selain kunci
  const wrongOptions = [0, 1, 2, 3].filter((i) => i !== answerIndex);
  const pick = randomChoice(roll.state, wrongOptions);
  const delay = randomInt(pick.state, profile.minDelayMs, profile.maxDelayMs);
  return { choiceIndex: pick.value, delayMs: delay.value, state: delay.state };
}

/** Ambil profil bot berikutnya untuk mengisi slot kosong (urutan: Kilat, Santai, Teliti). */
export function nextBotProfile(filledCount: number): BotProfile {
  const idx = filledCount % BOT_PROFILES.length;
  const profile = BOT_PROFILES[idx];
  if (profile === undefined) throw new Error('BOT_PROFILES kosong');
  return profile;
}
