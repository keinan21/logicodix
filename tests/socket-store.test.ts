import { describe, expect, it } from 'vitest';
import { initialSession, sessionReducer } from '../src/client/socket';
import type { RaceEnd, RaceFeedback, RoomState } from '../src/shared/schema';

function makeRoom(roomId: string): RoomState {
  return {
    roomId,
    phase: 'racing',
    participants: [
      {
        id: 'saya',
        nickname: 'Raka',
        animalId: 'penyu',
        isBot: false,
        slot: 1,
        steps: 0,
        status: 'racing',
      },
    ],
    timeLeftS: 240,
    questionIndex: 0,
    activeQuestion: { stem: 'Soal', options: ['A', 'B', 'C', 'D'] },
    finishOrder: [],
  };
}

const wrongFeedback: RaceFeedback = {
  questionIndex: 0,
  correct: false,
  answerIndex: 2,
  explanation: 'Penjelasan buatan tim.',
  lockEndsAtMs: 1_000,
};

const raceEnd: RaceEnd = {
  ranking: [
    {
      rank: 1,
      nickname: 'Raka',
      animalId: 'penyu',
      isBot: false,
      correctCount: 5,
      status: 'finished',
    },
  ],
};

describe('store socket (ARCHITECTURE §4)', () => {
  it('mencatat koneksi dan ID socket sebagai id peserta', () => {
    const next = sessionReducer(initialSession, {
      type: 'connection',
      connected: true,
      myId: 'socket-1',
    });

    expect(next.connected).toBe(true);
    expect(next.everConnected).toBe(true);
    expect(next.myId).toBe('socket-1');
  });

  it('menyimpan room:state dan menghapus pesan error sebelumnya', () => {
    const withError = sessionReducer(initialSession, {
      type: 'error',
      error: { code: 'nickname-invalid', pesan: 'Nickname tidak boleh mengandung kata kasar' },
    });
    const next = sessionReducer(withError, { type: 'state', state: makeRoom('room-a') });

    expect(next.state?.roomId).toBe('room-a');
    expect(next.error).toBeNull();
  });

  it('menyimpan feedback beserta waktu terimanya (dipakai masa tahan layar)', () => {
    const next = sessionReducer(initialSession, {
      type: 'feedback',
      feedback: wrongFeedback,
      atMs: 500,
    });

    expect(next.feedback).toEqual(wrongFeedback);
    expect(next.feedbackAtMs).toBe(500);
  });

  it('room baru membuang sisa balapan sebelumnya', () => {
    let session = sessionReducer(initialSession, { type: 'state', state: makeRoom('room-a') });
    session = sessionReducer(session, { type: 'feedback', feedback: wrongFeedback, atMs: 500 });
    session = sessionReducer(session, { type: 'race-end', raceEnd });
    session = sessionReducer(session, {
      type: 'evaluation',
      evaluation: { questions: [], aiSection: null, badge: 'ringkasan-otomatis-bukan-ai' },
    });

    const next = sessionReducer(session, { type: 'state', state: makeRoom('room-b') });

    expect(next.state?.roomId).toBe('room-b');
    expect(next.feedback).toBeNull();
    expect(next.raceEnd).toBeNull();
    expect(next.evaluation).toBeNull();
  });

  it('menyimpan hasil balapan dan evaluasi', () => {
    const ended = sessionReducer(initialSession, { type: 'race-end', raceEnd });
    expect(ended.raceEnd?.ranking).toHaveLength(1);

    const evaluated = sessionReducer(ended, {
      type: 'evaluation',
      evaluation: {
        questions: [],
        aiSection: null,
        badge: 'ringkasan-otomatis-bukan-ai',
      },
    });
    expect(evaluated.evaluation?.badge).toBe('ringkasan-otomatis-bukan-ai');
  });

  it('menyimpan jumlah pemain yang ditemukan dari queue:status', () => {
    const next = sessionReducer(initialSession, {
      type: 'queue-status',
      waitingS: 3,
      found: 2,
    });

    expect(next.found).toBe(2);
    expect(next.waitingS).toBe(3);
  });

  it('reset (Main lagi) membuang data room tetapi mempertahankan koneksi', () => {
    let session = sessionReducer(initialSession, {
      type: 'connection',
      connected: true,
      myId: 'socket-1',
    });
    session = sessionReducer(session, { type: 'state', state: makeRoom('room-a') });
    session = sessionReducer(session, { type: 'race-end', raceEnd });

    const next = sessionReducer(session, { type: 'reset' });

    expect(next.state).toBeNull();
    expect(next.raceEnd).toBeNull();
    expect(next.connected).toBe(true);
    expect(next.myId).toBe('socket-1');
  });
});
