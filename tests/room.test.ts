import { describe, it, expect, vi } from 'vitest';
import { Room } from '../src/server/room';
import { createRNGSeed, shuffle } from '../src/shared/rng';
import { GAME } from '../src/shared/constants';
import {
  questionSchema,
  roomStateSchema,
  raceEndSchema,
  evalReadySchema,
} from '../src/shared/schema';
import type { Question, EvalRequest, RoomState } from '../src/shared/schema';
import type { RaceFeedback, RaceEnd, EvalReady } from '../src/shared/schema';

/** Penjadwal timer palsu agar timer room (3s/5s/4menit) bisa dijalankan instan. */
class FakeScheduler {
  now = 0;
  private timers: { id: number; fn: () => void; at: number }[] = [];
  private nextId = 1;

  setTimer(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = this.nextId++;
    this.timers.push({ id, fn, at: this.now + ms });
    return id as unknown as ReturnType<typeof setTimeout>;
  }

  clearTimer(id: ReturnType<typeof setTimeout>): void {
    const n = id as unknown as number;
    this.timers = this.timers.filter((t) => t.id !== n);
  }

  advance(ms: number): void {
    const target = this.now + ms;
    for (;;) {
      const due = this.timers.filter((t) => t.at <= target).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      this.timers = this.timers.filter((t) => t.id !== due.id);
      this.now = due.at;
      due.fn();
    }
    this.now = target;
  }
}

function q(id: string, answerIndex: number): Question {
  return questionSchema.parse({
    id,
    kind: 'klaim',
    stem: `Stem uji ${id}.`,
    claim: `Klaim uji ${id} yang beredar di media sosial.`,
    options: ['Opsi pertama.', 'Opsi kedua.', 'Opsi ketiga.', 'Opsi keempat.'],
    answerIndex,
    explanation: 'Penjelasan uji coba dari tim.',
    sources: [],
    misinfoType: 'konteks-salah',
    topic: 'sampah',
    status: 'draf',
    writtenBy: 'test',
  });
}

interface RecordedEvent {
  event: string;
  payload: unknown;
  target?: string;
}

function makeRoom(
  seed: number,
  questions: Question[],
  events: RecordedEvent[],
  botCount = 3,
  evalInputs?: EvalRequest[],
) {
  const sched = new FakeScheduler();
  const room = new Room({
    roomId: 'r1',
    seed,
    humans: [{ id: 'h1', nickname: 'Budi', animalId: 'orangutan' }],
    botCount,
    questions,
    emit: (event, payload) => events.push({ event, payload }),
    emitTo: (socketId, event, payload) => events.push({ event, payload, target: socketId }),
    onEmpty: () => {
      events.push({ event: 'room.destroyed', payload: null });
    },
    evaluator: async (req) => {
      evalInputs?.push(req);
      return {
        output: { pattern: 'Pola uji.', tip: 'Tips uji.', motivation: '' },
        badge: 'ringkasan-otomatis-bukan-ai',
        source: 'mock',
      };
    },
    now: () => sched.now,
    setTimer: (fn, ms) => sched.setTimer(fn, ms),
    clearTimer: (id) => sched.clearTimer(id),
  });
  return { room, sched };
}

/** Replikasi urutan acak room: shuffle soal sekali, shuffle pilihan sekali (FR-B01, FR-K05). */
function deriveOrder(seed: number, questions: Question[]) {
  const qShuffle = shuffle(createRNGSeed(seed), questions.slice(0, 10));
  const oShuffle = shuffle(qShuffle.state, [0, 1, 2, 3]);
  return { bank: qShuffle.value, optionOrder: oShuffle.value };
}

describe('room (integrasi skeleton)', () => {
  it('balapan penuh: benar, salah+lock, soal habis, race:end, eval:ready per manusia', async () => {
    const seed = 42;
    const questions = [
      q('11111111-0001-4001-8001-000000000001', 0),
      q('11111111-0002-4002-8002-000000000002', 1),
      q('11111111-0003-4003-8003-000000000003', 2),
    ];
    const events: RecordedEvent[] = [];
    const { room, sched } = makeRoom(seed, questions, events);
    const { bank, optionOrder } = deriveOrder(seed, questions);

    const correctLetter = (i: number) => 'ABCD'[optionOrder.indexOf(bank[i]!.answerIndex)]!;
    const wrongLetter = (i: number) => {
      for (let l = 0; l < 4; l++) {
        if (optionOrder[l] !== bank[i]!.answerIndex) return 'ABCD'[l]!;
      }
      throw new Error('tidak ada pilihan salah');
    };

    room.start();
    sched.advance(3000); // hitung mundur lobby 3-2-1 (FR-M11)

    // Q0: benar → feedback benar tanpa kunci
    room.answer('h1', { questionIndex: 0, choice: correctLetter(0) });
    let fb = lastEvent(events, 'race:feedback') as RaceFeedback;
    expect(fb.correct).toBe(true);
    expect(fb.answerIndex).toBeUndefined(); // kunci tidak dikirim saat benar

    // Q1: salah → kunci + penjelasan + sumber + lock 5 dtk (FR-B05)
    room.answer('h1', { questionIndex: 1, choice: wrongLetter(1) });
    fb = lastEvent(events, 'race:feedback') as RaceFeedback;
    expect(fb.correct).toBe(false);
    expect(fb.answerIndex).toBe(optionOrder.indexOf(bank[1]!.answerIndex));
    expect(fb.explanation).toBe(bank[1]!.explanation);
    expect(fb.sources).toEqual(bank[1]!.sources);
    expect(fb.lockEndsAtMs).toBe(8000); // now=3000 (lobby 3 dtk) + lock 5 dtk

    // Jawaban kedua saat locked ditolak (NFR-08)
    const before = events.length;
    room.answer('h1', { questionIndex: 1, choice: 'A' });
    expect(events.length).toBe(before);

    sched.advance(5000); // lock habis

    // Q2: benar → soal habis (bank cuma 3, benar 2 < 5)
    room.answer('h1', { questionIndex: 2, choice: correctLetter(2) });

    // FR-K11: room:state tidak pernah membawa kunci/penjelasan/sumber
    for (const e of events.filter((x) => x.event === 'room:state')) {
      const st = roomStateSchema.parse(e.payload);
      if (st.activeQuestion) {
        expect(Object.keys(st.activeQuestion)).toEqual(['stem', 'claim', 'options']);
      }
    }

    // Jalankan bot + batas waktu balapan
    sched.advance(300000);

    const end = lastEvent(events, 'race:end') as RaceEnd;
    const ranking = raceEndSchema.parse(end).ranking;
    expect(ranking).toHaveLength(4);
    expect(ranking.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    // Semua peserta minimal menjawab 3 soal (bank habis) atau finish
    for (const r of ranking) {
      expect(['finished', 'outOfQuestions', 'left']).toContain(r.status);
    }

    // Evaluasi per pemain manusia (bukan bot), tanpa nickname di payload
    await vi.waitFor(() => {
      const ev = events.find((e) => e.event === 'eval:ready' && e.target === 'h1');
      expect(ev).toBeDefined();
    });
    const evalReady = events.filter((e) => e.event === 'eval:ready' && e.target === 'h1').at(-1)!;
    const ready = evalReadySchema.parse(evalReady.payload) as EvalReady;
    expect(ready.questions.length).toBeGreaterThan(0);
    expect(ready.badge).toBe('ringkasan-otomatis-bukan-ai'); // mode mock bukan AI
    expect(JSON.stringify(ready)).not.toContain('Budi'); // FR-H06: nickname tidak dikirim
    const pendingEvent = events.find((e) => e.event === 'eval:ready' && e.target === 'h1')!;
    const pending = evalReadySchema.parse(pendingEvent.payload);
    expect(pending.questions.length).toBe(ready.questions.length);
    expect(pending.aiSection).toBeNull();
    expect(pending.badge).toBeNull();
  });

  it('feedback dan evaluasi memakai indeks tampilan saat pilihan diacak (FR-B05, FR-H02)', async () => {
    const seed = 42;
    const questions = [q('66666666-0001-4001-8001-000000000001', 3)];
    const events: RecordedEvent[] = [];
    const evalInputs: EvalRequest[] = [];
    const { room, sched } = makeRoom(seed, questions, events, 0, evalInputs);
    const { bank, optionOrder } = deriveOrder(seed, questions);
    // Kunci asli 3 tampil sebagai pilihan B (indeks tampilan 1).
    expect(optionOrder).toEqual([0, 3, 1, 2]);

    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);

    // Pilih A (asli 0) → salah; kunci yang disorot harus indeks tampilan 1.
    room.answer('h1', { questionIndex: 0, choice: 'A' });
    const fb = lastEvent(events, 'race:feedback') as RaceFeedback;
    expect(fb.correct).toBe(false);
    expect(fb.answerIndex).toBe(1);
    expect(optionOrder[fb.answerIndex!]).toBe(bank[0]!.answerIndex);

    await vi.waitFor(() => {
      expect(events.some((e) => e.event === 'eval:ready' && e.target === 'h1')).toBe(true);
    });
    const evalReady = events.filter((e) => e.event === 'eval:ready' && e.target === 'h1').at(-1)!;
    const ready = evalReadySchema.parse(evalReady.payload) as EvalReady;
    const item = ready.questions[0]!;

    // Opsi, pilihan pemain, dan kunci memakai urutan tampilan yang sama.
    expect(item.options).toEqual(optionOrder.map((i) => bank[0]!.options[i]));
    expect(item.chosenIndex).toBe(0);
    expect(item.answerIndex).toBe(1);
    expect(item.options[item.chosenIndex]).toBe(bank[0]!.options[0]);
    expect(item.options[item.answerIndex]).toBe(bank[0]!.options[bank[0]!.answerIndex]);
    // Input AI memakai indeks tampilan yang sama, supaya huruf kunci di keluarannya cocok.
    expect(evalInputs[0]!.questions[0]!.chosenIndex).toBe(0);
    expect(evalInputs[0]!.questions[0]!.answerIndex).toBe(1);
  });

  it('deterministik: seed sama → urutan event sama persis (ARCH §1 prinsip 6)', () => {
    const seed = 7;
    const questions = [
      q('22222222-0001-4001-8001-000000000001', 3),
      q('22222222-0002-4002-8002-000000000002', 0),
    ];
    const run = () => {
      const events: RecordedEvent[] = [];
      const { room, sched } = makeRoom(seed, questions, events);
      const { bank, optionOrder } = deriveOrder(seed, questions);
      room.start();
      sched.advance(3000);
      room.answer('h1', {
        questionIndex: 0,
        choice: 'ABCD'[optionOrder.indexOf(bank[0]!.answerIndex)]!,
      });
      room.answer('h1', {
        questionIndex: 1,
        choice: 'ABCD'[optionOrder.indexOf(bank[1]!.answerIndex)]!,
      });
      sched.advance(300000);
      return events;
    };
    const a = run();
    const b = run();
    expect(stripTargets(a)).toEqual(stripTargets(b));
  });

  it('semua manusia keluar saat balapan → setelah 10 dtk room dihapus tanpa race:end (FR-B11, FR-B13)', () => {
    const seed = 9;
    const questions = [q('33333333-0001-4001-8001-000000000001', 0)];
    const events: RecordedEvent[] = [];
    const { room, sched } = makeRoom(seed, questions, events);
    room.start();
    sched.advance(3000); // balapan mulai
    room.leave('h1');
    // Belum lewat 10 detik: masih dalam tenggat reconnect (FR-B11)
    expect(events.some((e) => e.event === 'room.destroyed')).toBe(false);

    sched.advance(GAME.RECONNECT_LIMIT_S * 1000); // lewat 10 detik
    expect(events.some((e) => e.event === 'race:end')).toBe(false);
    expect(events.some((e) => e.event === 'room.destroyed')).toBe(true);
  });

  it('keluar saat lobby diganti bot profil berikutnya bila masih ada manusia (FR-M12)', () => {
    const seed = 10;
    const questions = [q('77777777-0001-4001-8001-000000000001', 0)];
    const events: RecordedEvent[] = [];
    const sched = new FakeScheduler();
    const room = new Room({
      roomId: 'r1',
      seed,
      humans: [
        { id: 'h1', nickname: 'Budi', animalId: 'orangutan' },
        { id: 'h2', nickname: 'Siti', animalId: 'harimau' },
      ],
      botCount: 2,
      questions,
      emit: (event, payload) => events.push({ event, payload }),
      emitTo: (socketId, event, payload) => events.push({ event, payload, target: socketId }),
      onEmpty: () => events.push({ event: 'room.destroyed', payload: null }),
      evaluator: async () => ({
        output: { pattern: '', tip: '', motivation: 'Hebat!' },
        badge: 'ringkasan-otomatis-bukan-ai',
        source: 'mock',
      }),
      now: () => sched.now,
      setTimer: (fn, ms) => sched.setTimer(fn, ms),
      clearTimer: (id) => sched.clearTimer(id),
    });

    room.start(); // fase lobby
    expect(events.some((e) => e.event === 'room.destroyed')).toBe(false);

    // h1 keluar saat lobby
    room.leave('h1');
    expect(events.some((e) => e.event === 'room.destroyed')).toBe(false);

    // h1 diganti bot; slot 1 sekarang bot
    const lastState = lastEvent(
      events.filter((e) => e.target === 'h2'),
      'room:state',
    ) as RoomState;
    const slot1 = lastState.participants.find((p) => p.slot === 1);
    expect(slot1?.isBot).toBe(true);
    expect(slot1?.status).toBe('racing');

    // Hitung mundur tetap berjalan dan balapan dimulai bersama
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
    const racingState = lastEvent(
      events.filter((e) => e.target === 'h2'),
      'room:state',
    ) as RoomState;
    expect(racingState.phase).toBe('racing');
  });

  it('semua manusia keluar saat lobby → room dibatalkan dan dihapus seketika (FR-M12)', () => {
    const seed = 12;
    const questions = [q('88888888-0001-4001-8001-000000000001', 0)];
    const events: RecordedEvent[] = [];
    const { room } = makeRoom(seed, questions, events);
    room.start(); // fase lobby
    room.leave('h1');
    // Langsung dihapus tanpa menunggu timer
    expect(events.some((e) => e.event === 'room.destroyed')).toBe(true);
  });

  it('reconnect saat balapan ≤ 10 detik memulihkan soal aktif (FR-B11)', () => {
    const seed = 13;
    const questions = [q('99999999-0001-4001-8001-000000000001', 0)];
    const events: RecordedEvent[] = [];
    const { room, sched } = makeRoom(seed, questions, events);
    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000); // balapan mulai

    // h1 putus koneksi
    room.leave('h1');
    sched.advance(5000); // 5 detik kemudian tersambung lagi

    // Resume dengan socket ID baru
    const resumed = room.resume('h1-new', 'h1');
    expect(resumed).toBe(true);

    // State terbaru terkirim ke socket baru
    const stateNew = lastEvent(
      events.filter((e) => e.target === 'h1-new'),
      'room:state',
    ) as RoomState;
    expect(stateNew.phase).toBe('racing');
    expect(stateNew.activeQuestion).not.toBeNull();

    // Maju 10 detik lagi: room TIDAK boleh dihapus karena h1 sudah resume
    sched.advance(10000);
    expect(events.some((e) => e.event === 'room.destroyed')).toBe(false);
  });

  it('reconnect setelah 10 detik ditolak dan pemain berstatus left (FR-B11)', () => {
    const seed = 14;
    const questions = [q('00000000-0001-4001-8001-000000000001', 0)];
    const events: RecordedEvent[] = [];
    const sched = new FakeScheduler();
    const room = new Room({
      roomId: 'r1',
      seed,
      humans: [
        { id: 'h1', nickname: 'Budi', animalId: 'orangutan' },
        { id: 'h2', nickname: 'Siti', animalId: 'harimau' },
      ],
      botCount: 2,
      questions,
      emit: (event, payload) => events.push({ event, payload }),
      emitTo: (socketId, event, payload) => events.push({ event, payload, target: socketId }),
      onEmpty: () => events.push({ event: 'room.destroyed', payload: null }),
      evaluator: async () => ({
        output: { pattern: '', tip: '', motivation: 'Hebat!' },
        badge: 'ringkasan-otomatis-bukan-ai',
        source: 'mock',
      }),
      now: () => sched.now,
      setTimer: (fn, ms) => sched.setTimer(fn, ms),
      clearTimer: (id) => sched.clearTimer(id),
    });

    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);

    // h1 putus koneksi
    room.leave('h1');
    sched.advance(GAME.RECONNECT_LIMIT_S * 1000 + 1); // lewat 10 detik

    // h1 mencoba reconnect terlambat
    const resumed = room.resume('h1-new', 'h1');
    expect(resumed).toBe(false);

    // h2 masih berjalan
    const lastH2 = lastEvent(
      events.filter((e) => e.target === 'h2'),
      'room:state',
    ) as RoomState;
    const p1 = lastH2.participants.find((p) => p.nickname === 'Budi');
    expect(p1?.status).toBe('left');
  });

  it('nickname kembar di room dapat suffix #2 (FR-M04)', () => {
    const seed = 11;
    const questions = [q('44444444-0001-4001-8001-000000000001', 0)];
    const events: RecordedEvent[] = [];
    const sched = new FakeScheduler();
    const room = new Room({
      roomId: 'r1',
      seed,
      humans: [
        { id: 'h1', nickname: 'Budi', animalId: 'orangutan' },
        { id: 'h2', nickname: 'Budi', animalId: 'harimau' },
        { id: 'h3', nickname: 'Budi', animalId: 'gajah' },
      ],
      botCount: 1,
      questions,
      emit: (event, payload) => events.push({ event, payload }),
      emitTo: (socketId, event, payload) => events.push({ event, payload, target: socketId }),
      onEmpty: () => {
        events.push({ event: 'room.destroyed', payload: null });
      },
      evaluator: async () => ({
        output: { pattern: 'Pola uji.', tip: 'Tips uji.', motivation: '' },
        badge: 'ringkasan-otomatis-bukan-ai',
        source: 'mock',
      }),
      now: () => sched.now,
      setTimer: (fn, ms) => sched.setTimer(fn, ms),
      clearTimer: (id) => sched.clearTimer(id),
    });
    room.start();
    sched.advance(3000);
    const states = events.filter((e) => e.event === 'room:state');
    const last = states[states.length - 1]!;
    const payload = roomStateSchema.parse(last.payload);
    const names = payload.participants.map((p) => p.nickname).sort();
    expect(names).toEqual(['BOT Kilat', 'Budi', 'Budi#2', 'Budi#3']);
  });

  it('soal aktif manusia tetap terkirim setelah bot menjawab (regresi tampilan soal hilang)', () => {
    const seed = 5;
    const questions = [
      q('55555555-0001-4001-8001-000000000001', 0),
      q('55555555-0002-4002-8002-000000000002', 1),
      q('55555555-0003-4003-8003-000000000003', 2),
    ];
    const events: RecordedEvent[] = [];
    const { room, sched } = makeRoom(seed, questions, events);
    const { bank, optionOrder } = deriveOrder(seed, questions);
    const correctLetter = (i: number) => 'ABCD'[optionOrder.indexOf(bank[i]!.answerIndex)]!;
    const wrongLetter = (i: number) => {
      for (let l = 0; l < 4; l++) {
        if (optionOrder[l] !== bank[i]!.answerIndex) return 'ABCD'[l]!;
      }
      throw new Error('tidak ada pilihan salah');
    };
    const lastHumanState = () => {
      const states = events.filter((e) => e.event === 'room:state' && e.target === 'h1');
      expect(states.length).toBeGreaterThan(0);
      return roomStateSchema.parse(states[states.length - 1]!.payload);
    };

    room.start();
    // Lobby tidak membawa soal (FR-K11).
    expect(lastHumanState().activeQuestion).toBeNull();

    sched.advance(3000); // balapan mulai
    expect(lastHumanState().activeQuestion).not.toBeNull();

    // Manusia menjawab benar → soal berikutnya terkirim per-socket.
    room.answer('h1', { questionIndex: 0, choice: correctLetter(0) });
    let st = lastHumanState();
    expect(st.questionIndex).toBe(1);
    expect(st.activeQuestion).not.toBeNull();

    // Bot menjawab beberapa kali; soal aktif manusia tidak boleh hilang.
    sched.advance(20000);
    st = lastHumanState();
    expect(st.activeQuestion).not.toBeNull();
    expect(st.questionIndex).toBe(1);

    // Manusia menjawab salah → lock 5 detik → soal berikutnya tetap terkirim.
    room.answer('h1', { questionIndex: 1, choice: wrongLetter(1) });
    sched.advance(5000);
    st = lastHumanState();
    expect(st.questionIndex).toBe(2);
    expect(st.activeQuestion).not.toBeNull();
  });
});

describe('akhir balapan tanpa menunggu (FR-B07, FR-B09)', () => {
  it('batas 4 menit mengakhiri balapan walau peserta tersisa berhenti menjawab', () => {
    const events: RecordedEvent[] = [];
    const questions = [
      q('33333333-0001-4001-8001-000000000001', 0),
      q('33333333-0002-4002-8002-000000000002', 1),
    ];
    // Tanpa bot: tidak ada timer jawaban yang akan memicu checkRaceEnd, jadi hanya
    // timer batas waktu yang bisa mengakhiri room.
    const { room, sched } = makeRoom(5, questions, events, 0);

    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
    expect(events.some((e) => e.event === 'race:end')).toBe(false);

    sched.advance(GAME.RACE_DURATION_S * 1000);

    const end = raceEndSchema.parse(lastEvent(events, 'race:end'));
    expect(end.ranking.map((r) => r.nickname)).toEqual(['Budi']);
  });

  it('pemain yang selesai menjawab langsung menerima race:standings, belum race:end', () => {
    const seed = 11;
    const questions = [
      q('44444444-0001-4001-8001-000000000001', 0),
      q('44444444-0002-4002-8002-000000000002', 1),
      q('44444444-0003-4003-8003-000000000003', 2),
      q('44444444-0004-4004-8004-000000000004', 3),
      q('44444444-0005-4005-8005-000000000005', 0),
      q('44444444-0006-4006-8006-000000000006', 1),
    ];
    const events: RecordedEvent[] = [];
    const { room, sched } = makeRoom(seed, questions, events);
    const { bank, optionOrder } = deriveOrder(seed, questions);

    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);

    for (let i = 0; i < GAME.STEPS_TO_FINISH; i++) {
      room.answer('h1', {
        questionIndex: i,
        choice: 'ABCD'[optionOrder.indexOf(bank[i]!.answerIndex)]!,
      });
    }

    const standings = events.filter((e) => e.event === 'race:standings');
    expect(standings).toHaveLength(1); // tepat sekali, saat pemain berhenti menjawab
    expect(standings[0]!.target).toBe('h1'); // peringkat sementara hanya untuk pemain itu
    const parsed = raceEndSchema.parse(standings[0]!.payload);
    expect(parsed.ranking[0]!.nickname).toBe('Budi');
    expect(parsed.ranking[0]!.correctCount).toBe(GAME.STEPS_TO_FINISH);
    // Bot belum menjawab: balapan belum selesai, jadi belum ada race:end.
    expect(events.some((e) => e.event === 'race:end')).toBe(false);
  });
});

function lastEvent(events: RecordedEvent[], name: string): unknown {
  const list = events.filter((e) => e.event === name);
  expect(list.length).toBeGreaterThan(0);
  return list[list.length - 1]!.payload;
}

/** Hapus field target (hanya routing socket) supaya dua run bisa dibandingkan. */
function stripTargets(events: RecordedEvent[]): RecordedEvent[] {
  return events.map(({ event, payload }) => ({ event, payload }));
}
