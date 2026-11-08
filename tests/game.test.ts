import { describe, it, expect } from 'vitest';
import {
  applyAnswer,
  rankParticipants,
  isRaceOver,
  markLeft,
  unlock,
  type Participant,
  type RaceState,
} from '../src/shared/game';
import { GAME } from '../src/shared/constants';

function makeP(id: string, overrides: Partial<Participant> = {}): Participant {
  return {
    id,
    nickname: `P${id}`,
    animalId: 'orangutan',
    isBot: false,
    slot: 1,
    status: 'racing',
    correctCount: 0,
    wrongCount: 0,
    nextQuestionIndex: 0,
    ...overrides,
  };
}

describe('game.applyAnswer', () => {
  it('jawaban benar: benar+1, status tetap racing', () => {
    const p = applyAnswer(makeP('a'), true, 1000, 10);
    expect(p.correctCount).toBe(1);
    expect(p.status).toBe('racing');
    expect(p.lastCorrectAtMs).toBe(1000);
  });

  it('jawaban benar ke-5: finished', () => {
    let p = makeP('a');
    for (let i = 0; i < GAME.STEPS_TO_FINISH; i++) {
      p = applyAnswer(p, true, 1000 + i, 10);
    }
    expect(p.status).toBe('finished');
    expect(p.correctCount).toBe(GAME.STEPS_TO_FINISH);
    expect(p.finishedAtMs).toBeDefined();
  });

  it('jawaban salah: mobil diam (correctCount tidak berubah), status locked', () => {
    const p = applyAnswer(makeP('a', { correctCount: 2 }), false, 1000, 10);
    expect(p.correctCount).toBe(2);
    expect(p.status).toBe('locked');
    expect(p.wrongCount).toBe(1);
  });

  it('jawaban kedua saat locked ditolak (NFR-08)', () => {
    const p = makeP('a', { status: 'locked' });
    expect(() => applyAnswer(p, true, 1000, 10)).toThrow();
  });

  it('jawaban setelah finish ditolak', () => {
    const p = makeP('a', { status: 'finished', correctCount: 5 });
    expect(() => applyAnswer(p, true, 1000, 10)).toThrow();
  });

  it('jawaban saat left ditolak', () => {
    const p = makeP('a', { status: 'left' });
    expect(() => applyAnswer(p, true, 1000, 10)).toThrow();
  });

  it('soal habis: outOfQuestions (FR-B08)', () => {
    const p = makeP('a', { nextQuestionIndex: 9 });
    const out = applyAnswer(p, false, 1000, 10);
    expect(out.status).toBe('outOfQuestions');
  });

  it('unlock mengembalikan locked ke racing', () => {
    const locked = makeP('a', { status: 'locked' });
    expect(unlock(locked).status).toBe('racing');
    expect(unlock(makeP('a'))).toEqual(makeP('a'));
  });

  it('markLeft: racing→left, finished tetap finished (FR-B11)', () => {
    expect(markLeft(makeP('a')).status).toBe('left');
    const fin = makeP('a', { status: 'finished' });
    expect(markLeft(fin).status).toBe('finished');
  });
});

describe('game.rankParticipants (FR-B10)', () => {
  it('finish duluan berdasarkan urutan finish', () => {
    const ranked = rankParticipants([
      makeP('b', { status: 'finished', correctCount: 5, finishOrder: 2 }),
      makeP('a', { status: 'finished', correctCount: 5, finishOrder: 1 }),
    ]);
    expect(ranked[0]?.nickname).toBe('Pa');
    expect(ranked[1]?.nickname).toBe('Pb');
  });

  it('belum finish diurutkan jumlah benar terbanyak', () => {
    const ranked = rankParticipants([
      makeP('a', { correctCount: 3, status: 'outOfQuestions' }),
      makeP('b', { correctCount: 4, status: 'racing' }),
    ]);
    expect(ranked[0]?.nickname).toBe('Pb');
    expect(ranked[1]?.nickname).toBe('Pa');
  });

  it('seri benar: salah lebih sedikit duluan', () => {
    const ranked = rankParticipants([
      makeP('a', { correctCount: 3, wrongCount: 2, lastCorrectAtMs: 100 }),
      makeP('b', { correctCount: 3, wrongCount: 1, lastCorrectAtMs: 200 }),
    ]);
    expect(ranked[0]?.nickname).toBe('Pb');
  });

  it('seri benar & salah: waktu benar terakhir lebih awal duluan', () => {
    const ranked = rankParticipants([
      makeP('a', { correctCount: 3, wrongCount: 1, lastCorrectAtMs: 500 }),
      makeP('b', { correctCount: 3, wrongCount: 1, lastCorrectAtMs: 100 }),
    ]);
    expect(ranked[0]?.nickname).toBe('Pb');
  });

  it('Keluar selalu paling bawah', () => {
    const ranked = rankParticipants([
      makeP('a', { status: 'left' }),
      makeP('b', { correctCount: 1, status: 'racing' }),
    ]);
    expect(ranked[0]?.nickname).toBe('Pb');
    expect(ranked[1]?.nickname).toBe('Pa');
    expect(ranked[1]?.rank).toBe(2);
  });
});

describe('game.isRaceOver (FR-B09)', () => {
  const base = (participants: Participant[]): RaceState => ({
    roomId: 'r1',
    seed: 1,
    phase: 'racing',
    questionOrder: [],
    optionOrder: [0, 1, 2, 3],
    participants,
  });

  it('semua finish → selesai', () => {
    expect(isRaceOver(base([makeP('a', { status: 'finished' })]), 1000)).toBe(true);
  });

  it('masih ada yang racing & waktu belum habis → belum selesai', () => {
    const s = base([makeP('a')]);
    s.raceEndsAtMs = 999_999;
    expect(isRaceOver(s, 1000)).toBe(false);
  });

  it('batas waktu habis → selesai', () => {
    const s = base([makeP('a')]);
    s.raceEndsAtMs = 1000;
    expect(isRaceOver(s, 1001)).toBe(true);
  });

  it('semua manusia keluar → selesai (FR-B13)', () => {
    const s = base([
      makeP('a', { status: 'left' }),
      makeP('bot1', { isBot: true, status: 'racing' }),
    ]);
    expect(isRaceOver(s, 1000)).toBe(true);
  });
});
