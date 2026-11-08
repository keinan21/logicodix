/**
 * src/server/nickname.ts — aturan nickname + filter kata kasar di SERVER (FR-M01, FR-M02, FR-M04).
 * Pemeriksaan kata kasar tidak boleh bisa dilewati dari browser (AGENTS §2).
 */

import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import { isProfane } from '@sideid/id-profanity-filter';
import { nicknameSchema } from '../shared/schema';

const enMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export type NicknameResult =
  | { ok: true; nickname: string }
  | {
      ok: false;
      reason:
        | 'Nickname 2–16 karakter, hanya huruf, angka, dan spasi'
        | 'Nickname tidak boleh mengandung kata kasar';
    };

/** Validasi format + filter kata kasar (EN via obscenity, ID via @sideid/id-profanity-filter). */
export function checkNickname(raw: string): NicknameResult {
  const trimmed = raw.trim();
  if (!nicknameSchema.safeParse(trimmed).success) {
    return { ok: false, reason: 'Nickname 2–16 karakter, hanya huruf, angka, dan spasi' };
  }
  if (enMatcher.hasMatch(trimmed) || isProfane(trimmed)) {
    return { ok: false, reason: 'Nickname tidak boleh mengandung kata kasar' };
  }
  return { ok: true, nickname: trimmed };
}

/**
 * Dedup nickname di room: peserta yang masuk belakangan mendapat akhiran "#2", "#3", … (FR-M04).
 * Pure: menerima daftar nickname yang sudah dipakai.
 */
export function uniquifyNickname(desired: string, taken: string[]): string {
  if (!taken.includes(desired)) return desired;
  let n = 2;
  while (taken.includes(`${desired}#${n}`)) n += 1;
  return `${desired}#${n}`;
}
