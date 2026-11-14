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
  const qShuffle = shuffle(createRNGSeed(seed), questions);
  const oShuffle = shuffle(qShuffle.state, [0, 1, 2, 3]);
  return { bank: qShuffle.value, optionOrder: oShuffle.value };
}

describe('room (integrasi skeleton)', () => {
  describe('validasi jawaban dan riwayat evaluasi', () => {
    const questions = [
      q('11111111-0001-4001-8001-000000000001', 0),
      q('11111111-0002-4002-8002-000000000002', 0),
      q('11111111-0003-4003-8003-000000000003', 0),
    ];
    const seed = 42;
    const { optionOrder } = deriveOrder(seed, questions);
    const correctChoice = String.fromCharCode(65 + optionOrder.indexOf(0));
    const wrongChoice = String.fromCharCode(65 + optionOrder.indexOf(1));

    it.each(['lobby', 'deadline', 'finished'] as const)(
      'menolak jawaban pada %s tanpa feedback atau riwayat',
      async (phase) => {
        const events: RecordedEvent[] = [];
        const inputs: EvalRequest[] = [];
        const { room, sched } = makeRoom(seed, questions, events, 0, inputs);
        room.start();
        if (phase !== 'lobby') sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
        if (phase === 'deadline') {
          // Jam melewati batas sebelum callback timer mendapat giliran.
          sched.now += GAME.RACE_DURATION_S * 1000;
        }
        if (phase === 'finished') sched.advance(GAME.RACE_DURATION_S * 1000);
        room.answer('h1', { questionIndex: 0, choice: correctChoice });
        await room.requestEvaluation();
        expect(events.filter((e) => e.event === 'race:feedback')).toHaveLength(0);
        const evaluations = events.filter((e) => e.event === 'eval:ready');
        expect(evaluations).toHaveLength(phase === 'finished' ? 1 : 0);
        for (const event of evaluations) {
          expect(evalReadySchema.parse(event.payload).questions).toEqual([]);
          expect(evalReadySchema.parse(event.payload).badge).toBe('ringkasan-otomatis-bukan-ai');
        }
        expect(inputs).toHaveLength(0);
        const states = events
          .filter((e) => e.event === 'room:state')
          .map((e) => roomStateSchema.parse(e.payload));
        expect(states.every((state) => state.participants[0]?.steps === 0)).toBe(true);
        room.destroy();
      },
    );

    it.each([0, 2])('menolak indeks %s ketika soal aktif 1', async (questionIndex) => {
      const events: RecordedEvent[] = [];
      const inputs: EvalRequest[] = [];
      const { room, sched } = makeRoom(seed, questions, events, 0, inputs);
      room.start();
      sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
      room.answer('h1', { questionIndex: 0, choice: correctChoice });
      room.answer('h1', { questionIndex, choice: correctChoice });
      await room.requestEvaluation();
      expect(events.filter((e) => e.event === 'race:feedback')).toHaveLength(1);
      const state = roomStateSchema.parse(
        events.filter((e) => e.event === 'room:state').at(-1)?.payload,
      );
      expect(state.questionIndex).toBe(1);
      expect(state.participants[0]?.steps).toBe(1);
      expect(inputs).toHaveLength(1);
      expect(inputs[0]?.questions).toHaveLength(1);
      room.destroy();
    });

    it('tidak memasukkan jawaban saat locked ke evaluasi dan menerima setelah unlock', async () => {
      const events: RecordedEvent[] = [];
      const inputs: EvalRequest[] = [];
      const { room, sched } = makeRoom(seed, questions, events, 0, inputs);
      room.start();
      sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
      room.answer('h1', { questionIndex: 0, choice: wrongChoice });
      room.answer('h1', { questionIndex: 1, choice: wrongChoice });
      sched.advance(GAME.LOCK_DURATION_S * 1000);
      room.answer('h1', { questionIndex: 1, choice: correctChoice });
      await room.requestEvaluation();
      expect(events.filter((e) => e.event === 'race:feedback')).toHaveLength(2);
      expect(inputs).toHaveLength(1);
      expect(inputs[0]?.questions.map((item) => item.chosenIndex)).toEqual([
        optionOrder.indexOf(1),
        optionOrder.indexOf(0),
      ]);
      const evaluation = evalReadySchema.parse(
        events.filter((e) => e.event === 'eval:ready').at(-1)?.payload,
      );
      expect(evaluation.questions).toHaveLength(2);
      room.destroy();
    });
  });

  it('mengirim countdown lobby dari jam server sampai balapan dimulai', () => {
    const events: RecordedEvent[] = [];
    const { room, sched } = makeRoom(42, [q('11111111-0001-4001-8001-000000000001', 0)], events);
    room.start();
    const latest = () =>
      roomStateSchema.parse(events.filter((e) => e.event === 'room:state').at(-1)?.payload);
    expect(latest().lobbyCountdownS).toBe(3);
    sched.advance(1000);
    expect(latest().lobbyCountdownS).toBe(2);
    sched.advance(1000);
    expect(latest().lobbyCountdownS).toBe(1);
    sched.advance(1000);
    expect(latest().phase).toBe('racing');
    expect(latest().lobbyCountdownS).toBe(0);
  });
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

  it('bot mendapat hewan yang belum dipakai oleh peserta di room (FR-M14)', () => {
    const seed = 20;
    const questions = [q('55555555-0001-4001-8001-000000000001', 0)];
    const events: RecordedEvent[] = [];
    const sched = new FakeScheduler();
    const room = new Room({
      roomId: 'r1',
      seed,
      humans: [
        { id: 'h1', nickname: 'Budi', animalId: 'burung' },
        { id: 'h2', nickname: 'Siti', animalId: 'orangutan' },
      ],
      botCount: 2,
      questions,
      emit: (event, payload) => events.push({ event, payload }),
      emitTo: (socketId, event, payload) => events.push({ event, payload, target: socketId }),
      onEmpty: () => {},
      evaluator: async () => ({
        output: { pattern: '', tip: '', motivation: '' },
        badge: 'ringkasan-otomatis-bukan-ai',
        source: 'mock',
      }),
      now: () => sched.now,
      setTimer: (fn, ms) => sched.setTimer(fn, ms),
      clearTimer: (id) => sched.clearTimer(id),
    });

    room.start();
    const states = events.filter((e) => e.event === 'room:state' && e.target === 'h1');
    const state = roomStateSchema.parse(states[0]!.payload);
    const bots = state.participants.filter((p) => p.isBot);
    const humans = state.participants.filter((p) => !p.isBot);

    const humanAnimals = new Set(humans.map((h) => h.animalId));
    expect(humanAnimals).toEqual(new Set(['burung', 'orangutan']));

    // Bot tidak boleh memakai hewan manusia
    for (const bot of bots) {
      expect(humanAnimals.has(bot.animalId)).toBe(false);
    }

    // Setiap bot mendapat hewan berbeda yang belum terpakai
    const botAnimals = bots.map((b) => b.animalId);
    expect(new Set(botAnimals).size).toBe(bots.length);
    expect(botAnimals).toEqual(['harimau', 'gajah']);
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

describe('jeda dan keluar (room satu manusia lawan bot)', () => {
  const questions = [
    q('55555555-0001-4001-8001-000000000001', 0),
    q('55555555-0002-4002-8002-000000000002', 1),
  ];
  const stateOf = (events: RecordedEvent[]) =>
    roomStateSchema.parse(events.filter((e) => e.event === 'room:state').at(-1)?.payload);

  it('jeda membekukan sisa waktu dan menolak jawaban; lanjut menggeser batas waktu', () => {
    const events: RecordedEvent[] = [];
    const { room, sched } = makeRoom(7, questions, events);
    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
    sched.advance(10_000);
    room.setPaused('h1', true);
    const frozen = stateOf(events);
    expect(frozen.paused).toBe(true);
    expect(frozen.timeLeftS).toBe(GAME.RACE_DURATION_S - 10);

    sched.advance(60_000);
    const botAnswered = events.length;
    room.answer('h1', { questionIndex: 0, choice: 'A' });
    expect(events.length).toBe(botAnswered);

    room.setPaused('h1', false);
    const resumed = stateOf(events);
    expect(resumed.paused).toBe(false);
    expect(resumed.timeLeftS).toBe(GAME.RACE_DURATION_S - 10);

    sched.advance((GAME.RACE_DURATION_S - 10) * 1000);
    expect(events.some((e) => e.event === 'race:end')).toBe(true);
  });

  it('jeda ditolak bila ada lebih dari satu manusia', () => {
    const events: RecordedEvent[] = [];
    const { room, sched } = makeRoom(7, questions, events);
    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
    room.setPaused('orang-lain', true);
    expect(stateOf(events).paused).toBeFalsy();
  });

  it('quit saat balapan langsung menjadi Keluar dan membatalkan room tanpa manusia', () => {
    const events: RecordedEvent[] = [];
    const { room, sched } = makeRoom(7, questions, events);
    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
    room.quit('h1');
    expect(events.some((e) => e.event === 'room.destroyed')).toBe(true);
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

describe('pemilihan soal', () => {
  it('pemain finish yang kembali ke beranda tidak menerima state room lama', () => {
    const events: RecordedEvent[] = [];
    const questions = Array.from({ length: 6 }, (_, i) =>
      q(`11111111-000${i + 1}-4001-8001-000000000001`, 0),
    );
    const { room, sched } = makeRoom(42, questions, events);
    const { optionOrder } = deriveOrder(42, questions);
    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
    for (let i = 0; i < GAME.STEPS_TO_FINISH; i++) {
      room.answer('h1', { questionIndex: i, choice: 'ABCD'[optionOrder.indexOf(0)] });
    }
    events.length = 0;
    room.quit('h1');
    sched.advance(20_000);
    expect(events.filter((e) => e.target === 'h1')).toEqual([]);
    room.destroy();
  });
  it('reconnect memulihkan hasil dan evaluasi yang selesai diproses', async () => {
    const events: RecordedEvent[] = [];
    const questions = [q('11111111-0001-4001-8001-000000000001', 0)];
    const { room, sched } = makeRoom(42, questions, events, 0);
    const { optionOrder } = deriveOrder(42, questions);
    room.start();
    sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
    room.answer('h1', { questionIndex: 0, choice: 'ABCD'[optionOrder.indexOf(0)] });
    expect(room.resume('h1-new', 'h1')).toBe(true);
    expect(events.some((e) => e.target === 'h1-new' && e.event === 'race:end')).toBe(true);
    await vi.waitFor(() => {
      const ready = events.filter((e) => e.target === 'h1-new' && e.event === 'eval:ready').at(-1);
      expect(evalReadySchema.parse(ready?.payload).badge).toBe('ringkasan-otomatis-bukan-ai');
    });
    expect(room.resume('h1-newer', 'h1-new')).toBe(true);
    const ready = events.filter((e) => e.target === 'h1-newer' && e.event === 'eval:ready').at(-1);
    expect(evalReadySchema.parse(ready?.payload).badge).toBe('ringkasan-otomatis-bukan-ai');
    room.destroy();
  });
  it('reconnect saat locked tetap membuka kunci tanpa mencatat nickname', () => {
    const events: RecordedEvent[] = [];
    const questions = [
      q('11111111-0001-4001-8001-000000000001', 0),
      q('11111111-0002-4002-8002-000000000002', 0),
    ];
    const { room, sched } = makeRoom(42, questions, events, 0);
    const { optionOrder } = deriveOrder(42, questions);
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      room.start();
      sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
      room.answer('h1', { questionIndex: 0, choice: 'ABCD'[optionOrder.indexOf(1)] });
      room.leave('h1');
      expect(room.resume('h1-new', 'h1')).toBe(true);
      sched.advance(GAME.LOCK_DURATION_S * 1000);
      const state = roomStateSchema.parse(lastEvent(events, 'room:state'));
      expect(state.participants[0]?.status).toBe('racing');
      expect(JSON.stringify(logs.mock.calls)).not.toContain('Budi');
    } finally {
      logs.mockRestore();
      room.destroy();
    }
  });
  it('mengambil soal dari seluruh bank, bukan hanya 12 pertama', () => {
    const questions = Array.from({ length: 40 }, (_, i) =>
      q(`11111111-${String(i + 1).padStart(4, '0')}-4001-8001-000000000001`, 0),
    );
    const ids = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const { room } = makeRoom(seed, questions, []);
      for (const item of (room as unknown as { questionBank: Question[] }).questionBank)
        ids.add(item.id);
    }
    expect([...ids].some((id) => !questions.slice(0, 12).some((x) => x.id === id))).toBe(true);
  });
});
it('audit: tanpa menjawab tetap menerima evaluasi kosong setelah waktu habis', async () => {
  const events: RecordedEvent[] = [];
  const { room, sched } = makeRoom(42, [q('11111111-0001-4001-8001-000000000001', 0)], events, 0);
  room.start();
  sched.advance((GAME.LOBBY_COUNTDOWN_S + GAME.RACE_DURATION_S) * 1000);
  await room.requestEvaluation();
  expect(events.some((e) => e.event === 'eval:ready' && e.target === 'h1')).toBe(true);
  room.destroy();
});

it('audit: finish lalu keluar ketika pause tidak meninggalkan room hidup selamanya', () => {
  const events: RecordedEvent[] = [];
  const questions = Array.from({ length: 6 }, (_, i) =>
    q(`11111111-000${i + 1}-4001-8001-000000000001`, 0),
  );
  const { room, sched } = makeRoom(42, questions, events);
  const { optionOrder } = deriveOrder(42, questions);
  room.start();
  sched.advance(GAME.LOBBY_COUNTDOWN_S * 1000);
  for (let i = 0; i < 5; i++)
    room.answer('h1', { questionIndex: i, choice: 'ABCD'[optionOrder.indexOf(0)] });
  room.setPaused('h1', true);
  room.quit('h1');
  sched.advance(1_000_000);
  expect(events.some((e) => e.event === 'room.destroyed')).toBe(true);
  room.destroy();
});

it('audit: deadline balapan tidak memperpanjang izin reconnect melewati 10 detik', () => {
  const events: RecordedEvent[] = [];
  const { room, sched } = makeRoom(42, [q('11111111-0001-4001-8001-000000000001', 0)], events, 0);
  room.start();
  sched.advance((GAME.LOBBY_COUNTDOWN_S + GAME.RACE_DURATION_S - 1) * 1000);
  room.leave('h1');
  sched.advance(11_000);
  expect(room.resume('h1-new', 'h1')).toBe(false);
  room.destroy();
});
