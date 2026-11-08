/**
 * src/shared/game.ts
 * Aturan game sebagai fungsi murni (ARCHITECTURE §1 prinsip 3, §3).
 *
 * - Tidak tahu socket, waktu sungguhan, atau acak sungguhan.
 * - Waktu dan acak masuk sebagai argumen → bisa dites tanpa browser.
 * - Hanya file ini yang boleh mengubah status peserta (ARCHITECTURE §5).
 * - Benar/salah, langkah, waktu, peringkat dihitung hanya di sini + kunci manusia (AGENTS §2.1).
 */

import { GAME } from './constants';
import type { ParticipantStatus, RoomPhase } from './constants';

// ---------------------------------------------------------------------------
// Tipe state
// ---------------------------------------------------------------------------

export interface Participant {
  /** ID koneksi socket (server) atau id bot. */
  id: string;
  nickname: string;
  animalId: string;
  isBot: boolean;
  /** Slot warna lajur 1..4. */
  slot: 1 | 2 | 3 | 4;
  status: ParticipantStatus;
  /** Jumlah jawaban benar (0..5). Sama dengan langkah hewan. */
  correctCount: number;
  /** Jumlah jawaban salah. */
  wrongCount: number;
  /** Indeks soal berikutnya dalam urutan room. */
  nextQuestionIndex: number;
  /** Urutan finish (1 = pertama). Hanya bila status "finished". */
  finishOrder?: number;
  /** Waktu server (ms epoch) saat finish. Hanya bila status "finished". */
  finishedAtMs?: number;
  /** Waktu server (ms epoch) jawaban benar terakhir. Tie-break FR-B10. */
  lastCorrectAtMs?: number;
}

export interface RaceState {
  roomId: string;
  seed: number;
  phase: RoomPhase;
  /** Urutan soal untuk room ini (sudah di-shuffle sekali, FR-B01). */
  questionOrder: string[];
  /** Urutan pilihan yang diacak per room, sama untuk semua peserta (FR-K05). */
  optionOrder: number[];
  participants: Participant[];
  raceEndsAtMs?: number;
}

// ---------------------------------------------------------------------------
// Transisi status peserta
// ---------------------------------------------------------------------------

/**
 * Mencatat jawaban peserta. Pure: mengembalikan peserta baru.
 * Menolak jawaban kedua / jawaban saat locked / setelah finish (NFR-08).
 */
export function applyAnswer(
  p: Participant,
  isCorrect: boolean,
  nowMs: number,
  totalQuestions: number,
): Participant {
  if (p.status === 'finished' || p.status === 'left') {
    throw new Error(`Peserta ${p.nickname} sudah ${p.status}; jawaban ditolak`);
  }
  if (p.status === 'locked') {
    throw new Error(`Peserta ${p.nickname} sedang locked; jawaban ditolak`);
  }

  const nextQuestionIndex = p.nextQuestionIndex + 1;

  if (isCorrect) {
    const correctCount = p.correctCount + 1;
    const finished = correctCount >= GAME.STEPS_TO_FINISH;
    const exhausted = nextQuestionIndex >= totalQuestions;
    const status: ParticipantStatus = finished
      ? 'finished'
      : exhausted
        ? 'outOfQuestions'
        : 'racing';
    // finishOrder diisi room.ts saat mencatat urutan finish (FR-B07).
    return {
      ...p,
      correctCount,
      nextQuestionIndex,
      status,
      lastCorrectAtMs: nowMs,
      ...(finished ? { finishedAtMs: nowMs } : {}),
    };
  }

  // Salah: mobil diam, status locked (room.ts menjadwalkan unlock setelah LOCK_DURATION_S).
  const exhausted = nextQuestionIndex >= totalQuestions;
  return {
    ...p,
    wrongCount: p.wrongCount + 1,
    nextQuestionIndex,
    status: exhausted ? 'outOfQuestions' : 'locked',
  };
}

/** Unlock peserta yang sedang locked (dipanggil room.ts setelah timer). */
export function unlock(p: Participant): Participant {
  if (p.status !== 'locked') return p;
  return { ...p, status: 'racing' };
}

/** Peserta keluar / putus > 10 dtk (FR-B11, FR-B13). */
export function markLeft(p: Participant): Participant {
  if (p.status === 'finished') return p; // yang sudah finish tetap di podium
  return { ...p, status: 'left' };
}

// ---------------------------------------------------------------------------
// Peringkat (FR-B10)
// ---------------------------------------------------------------------------

export interface RankedParticipant extends Participant {
  rank: number;
}

/**
 * Peringkat akhir room (FR-B10):
 * 1. Finish: urutan finish (finishOrder).
 * 2. Belum finish: benar terbanyak → salah paling sedikit → waktu benar terakhir paling awal.
 * 3. "Keluar" selalu paling bawah.
 */
export function rankParticipants(participants: Participant[]): RankedParticipant[] {
  const finished = participants
    .filter((p) => p.status === 'finished')
    .sort((a, b) => (a.finishOrder ?? 0) - (b.finishOrder ?? 0));

  const unfinished = participants
    .filter((p) => p.status !== 'finished' && p.status !== 'left')
    .sort((a, b) => {
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      if (a.wrongCount !== b.wrongCount) return a.wrongCount - b.wrongCount;
      return (
        (a.lastCorrectAtMs ?? Number.MAX_SAFE_INTEGER) -
        (b.lastCorrectAtMs ?? Number.MAX_SAFE_INTEGER)
      );
    });

  const left = participants.filter((p) => p.status === 'left');

  const ordered = [...finished, ...unfinished, ...left];
  return ordered.map((p, i) => ({ ...p, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Aturan akhir balapan (FR-B09)
// ---------------------------------------------------------------------------

/** Balapan selesai bila semua peserta finish / soal habis / keluar, atau batas waktu habis. */
export function isRaceOver(state: RaceState, nowMs: number): boolean {
  if (state.raceEndsAtMs !== undefined && nowMs >= state.raceEndsAtMs) return true;
  // FR-B13: semua manusia KELUAR (bukan soal habis — yang soal habis tetap menonton, FR-B07/B08).
  const humans = state.participants.filter((p) => !p.isBot);
  if (humans.length > 0 && humans.every((p) => p.status === 'left')) return true;
  return state.participants.every(
    (p) => p.status === 'finished' || p.status === 'outOfQuestions' || p.status === 'left',
  );
}
