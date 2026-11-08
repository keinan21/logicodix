/**
 * src/shared/constants.ts
 * Satu-satunya tempat angka parameter (AGENTS.md §2.4, ARCHITECTURE §3).
 * Angka dari FRD/00 §2, D-57, FR-M10, FR-H07/H10.
 *
 * CATATAN: warna, jarak, font TIDAK ada di sini.
 * Token desain hanya sebagai CSS variables di src/client/styles.css (DESIGN §2, AGENTS §2.8).
 */

/** Parameter balapan (FRD 02 §1, D-46, D-57). */
export const GAME = {
  /** Langkah benar untuk finish. */
  STEPS_TO_FINISH: 5,
  /** Layar terkunci setelah salah (detik). */
  LOCK_DURATION_S: 5,
  /** Tanda "Benar!" (detik). */
  CORRECT_FLASH_S: 1,
  /** Batas waktu balapan (detik) = 4 menit. */
  RACE_DURATION_S: 240,
  /** Batas putus koneksi sebelum status "Keluar" (detik). */
  RECONNECT_LIMIT_S: 10,
  /** Slot peserta per room. */
  MAX_PLAYERS: 4,
  /** Hitung mundur lobby 3-2-1 (detik). */
  LOBBY_COUNTDOWN_S: 3,
  /** Tunggu maksimal quick match sebelum room dibentuk dengan bot (detik). */
  QUEUE_TIMEOUT_S: 10,
  /** Masa simpan hasil room setelah balapan (detik) = 10 menit (FR-H12). */
  RESULT_RETENTION_S: 600,
} as const;

/** Bank soal: jumlah minimum soal terverifikasi agar server mau start (FR-K01). */
export const CONTENT = {
  MIN_VERIFIED_QUESTIONS: 10,
  TARGET_QUESTIONS: 12,
  OPTIONS_PER_QUESTION: 4,
} as const;

/**
 * Profil bot pengisi slot kosong (FR-M10, D-47).
 * Diambil berurutan Kilat → Santai → Teliti. Angka ditune ulang setelah uji main 10 Nov.
 */
export const BOT_PROFILES = [
  { id: 'kilat', label: 'BOT Kilat', chanceCorrect: 0.55, minDelayMs: 4000, maxDelayMs: 6000 },
  { id: 'santai', label: 'BOT Santai', chanceCorrect: 0.65, minDelayMs: 6000, maxDelayMs: 9000 },
  { id: 'teliti', label: 'BOT Teliti', chanceCorrect: 0.85, minDelayMs: 9000, maxDelayMs: 12000 },
] as const;

export type BotProfile = (typeof BOT_PROFILES)[number];

/** Mode evaluasi AI (ARCHITECTURE §7, §9). */
export type AiMode = 'live' | 'contoh' | 'mock';

export const AI = {
  /** Batas waktu panggilan AI dengan AbortController (FR-H07, detik). */
  TIMEOUT_S: 8,
  /** Maksimal 1 panggilan AI per pemain per balapan (FR-H10). */
  MAX_CALLS_PER_PLAYER_PER_RACE: 1,
  /** Mode default saat server start (ARCHITECTURE §9). */
  DEFAULT_MODE: 'mock' as AiMode,
  /** Batas panjang keluaran AI (FR-H03, FR-H04). */
  PATTERN_MAX_CHARS: 400,
  TIP_MAX_CHARS: 200,
} as const;

/** Status peserta (ARCHITECTURE §5). Hanya game.ts yang boleh mengubah. */
export const PARTICIPANT_STATUS = [
  'racing',
  'locked',
  'finished',
  'outOfQuestions',
  'left',
] as const;
export type ParticipantStatus = (typeof PARTICIPANT_STATUS)[number];

/** Fase room (ARCHITECTURE §5). */
export const ROOM_PHASES = ['waiting', 'lobby', 'racing', 'finished'] as const;
export type RoomPhase = (typeof ROOM_PHASES)[number];
