/**
 * src/server/room.ts — satu room: timer, state, kirim event (ARCHITECTURE §4–§6).
 *
 * Fase: waiting → lobby → racing → finished → (dihapus).
 * Timer room (satu-satunya di repo): lobby 3 dtk, lock 5 dtk, batas 4 menit, putus 10 dtk.
 * Keputusan game (benar/salah, langkah, peringkat) SELALU via src/shared/game.ts (fungsi murni).
 *
 * Privasi payload (FR-K11, FR-B06, NFR-08):
 * - room:state dikirim PER manusia (emitTo): fase, peserta (tanpa kunci), sisa waktu,
 *   + soal aktif peserta itu saja (stem/claim/options) — dan hanya saat fase racing.
 *   Broadcast tunggal tanpa soal akan menghapus tampilan soal di layar pemain lain setiap
 *   ada peserta menjawab (client mengganti state utuh), jadi broadcast() di sini per-socket.
 * - race:feedback: HANYA ke pemain yang menjawab (kunci+penjelasan+src setelah menjawab).
 * - eval:ready: HANYA ke pemain itu (FR-H06).
 */

import { GAME, CONTENT } from '../shared/constants';
import { createRNGSeed, shuffle, type RNGState } from '../shared/rng';
import {
  applyAnswer,
  unlock,
  markLeft,
  rankParticipants,
  isRaceOver,
  type Participant,
  type RaceState,
} from '../shared/game';
import { botDecide, createBotRNG, nextBotProfile, type BotProfile } from '../shared/bots';
import {
  roomStateSchema,
  raceFeedbackSchema,
  raceEndSchema,
  raceAnswerPayloadSchema,
  questionPublicSchema,
  evalReadySchema,
  type Question,
  type RoomState,
  type RaceFeedback,
  type RaceEnd,
  type EvalRequest,
} from '../shared/schema';
import type { EvalResult } from './evaluate';
import { logEvent } from './log';
import { uniquifyNickname } from './nickname';

export type EmitFn = (event: string, payload: unknown) => void;
export type EmitToFn = (socketId: string, event: string, payload: unknown) => void;
export type EvaluateFn = (req: EvalRequest, seed: number) => Promise<EvalResult>;

export interface RoomConfig {
  roomId: string;
  seed: number;
  humans: { id: string; nickname: string; animalId: string }[];
  botCount: number;
  questions: Question[];
  /** Broadcast ke semua peserta room (tanpa soal aktif). */
  emit: EmitFn;
  /** Kirim ke satu socket (soal aktif, feedback, evaluasi). */
  emitTo: EmitToFn;
  onEmpty: (roomId: string) => void;
  evaluator: EvaluateFn;
  /** Injectable untuk tes. */
  now: () => number;
  setTimer: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer: (t: ReturnType<typeof setTimeout>) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export class Room {
  private cfg: RoomConfig;
  private state: RaceState;
  private rng: RNGState;
  private botRng: RNGState;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private answers = new Map<string, { questionIndex: number; chosenIndex: number }[]>();
  private scheduledBots = new Set<string>();
  private questionBank: Question[];
  private finishCounter = 0;
  private evalRequested = false;

  constructor(cfg: RoomConfig) {
    this.cfg = cfg;
    this.rng = createRNGSeed(cfg.seed);
    this.botRng = createBotRNG(cfg.seed ^ 0x9e3779b9);

    // Urutan soal diacak SATU KALI per room dari seed (FR-B01); urutan pilihan diacak sekali per room (FR-K05).
    const qShuffle = shuffle(this.rng, cfg.questions.slice(0, CONTENT.TARGET_QUESTIONS));
    this.questionBank = qShuffle.value;
    this.rng = qShuffle.state;
    const oShuffle = shuffle(this.rng, [0, 1, 2, 3]);
    this.state = {
      roomId: cfg.roomId,
      seed: cfg.seed,
      phase: 'waiting',
      questionOrder: this.questionBank.map((q) => q.id),
      optionOrder: oShuffle.value,
      participants: [],
    };

    // Susun peserta: manusia dulu (slot 1..n), bot sisanya (FR-M10: profil berurutan).
    // Nickname kembar di room dapat suffix #2/#3 (FR-M04).
    const taken: string[] = [];
    let slot = 1 as 1 | 2 | 3 | 4;
    for (const h of cfg.humans) {
      const nickname = uniquifyNickname(h.nickname, taken);
      taken.push(nickname);
      this.state.participants.push({
        id: h.id,
        nickname,
        animalId: h.animalId,
        isBot: false,
        slot,
        status: 'racing',
        correctCount: 0,
        wrongCount: 0,
        nextQuestionIndex: 0,
      });
      this.answers.set(h.id, []);
      slot = Math.min(slot + 1, GAME.MAX_PLAYERS) as 1 | 2 | 3 | 4;
    }
    for (let i = 0; i < cfg.botCount; i++) {
      const profile: BotProfile = nextBotProfile(i);
      this.state.participants.push({
        id: `bot-${profile.id}-${i}`,
        nickname: profile.label,
        animalId: 'burung', // TODO(T-07): hewan belum dipakai di room (FR-M14)
        isBot: true,
        slot,
        status: 'racing',
        correctCount: 0,
        wrongCount: 0,
        nextQuestionIndex: 0,
      });
      slot = Math.min(slot + 1, GAME.MAX_PLAYERS) as 1 | 2 | 3 | 4;
    }
  }

  /** Fase lobby: hitung mundur 3-2-1, lalu balapan mulai bersamaan (FR-M11). */
  start(): void {
    this.state.phase = 'lobby';
    this.broadcast();
    const t = this.cfg.setTimer(() => this.beginRace(), GAME.LOBBY_COUNTDOWN_S * 1000);
    this.timers.add(t);
  }

  private beginRace(): void {
    this.state.phase = 'racing';
    this.state.raceEndsAtMs = this.cfg.now() + GAME.RACE_DURATION_S * 1000;
    // Batas 4 menit harus punya timer sendiri: isRaceOver() hanya diperiksa saat ada
    // jawaban/peserta keluar, jadi tanpa timer ini room menggantung selamanya bila
    // peserta yang tersisa berhenti menjawab (FR-B09).
    const capTimer = this.cfg.setTimer(() => this.checkRaceEnd(), GAME.RACE_DURATION_S * 1000);
    this.timers.add(capTimer);
    this.broadcast();
    this.scheduleBots();
    this.checkRaceEnd();
  }

  /** Jawaban peserta (FR-B03). Validasi zod; kunci dicek terhadap bank soal. */
  answer(socketId: string, raw: unknown): void {
    const parsed = raceAnswerPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      this.emitError(socketId, 'invalid-answer', 'Jawaban tidak valid.');
      logEvent(
        this.cfg.roomId,
        this.cfg.seed,
        'race.answer.invalid',
        this.state.phase,
        'warn',
        'payload race:answer gagal zod',
      );
      return;
    }
    const p = this.state.participants.find((x) => x.id === socketId);
    if (!p) return;
    const question = this.currentQuestion(p);
    if (!question) return;

    // Peta huruf pilihan (A–D) ke indeks asli lewat optionOrder room (FR-K05)
    const letterIdx = parsed.data.choice.charCodeAt(0) - 'A'.charCodeAt(0);
    const originalIndex = this.state.optionOrder[letterIdx];
    if (originalIndex === undefined) return;

    const correct = originalIndex === question.answerIndex;
    // Catat jawaban untuk Evaluasi AI (FR-H06: tanpa nickname)
    const list = this.answers.get(socketId);
    if (list) list.push({ questionIndex: p.nextQuestionIndex, chosenIndex: originalIndex });

    let next: Participant;
    try {
      next = applyAnswer(p, correct, this.cfg.now(), this.questionBank.length);
    } catch {
      return; // jawaban kedua / saat locked / sudah finish → ditolak (NFR-08)
    }

    if (next.status === 'finished') {
      this.finishCounter += 1;
      next = { ...next, finishOrder: this.finishCounter };
    }

    this.replaceParticipant(socketId, next);
    this.scheduledBots.delete(socketId);

    // Pemain manusia yang sudah tidak bisa menjawab lagi langsung menerima peringkat
    // sementara, supaya layar bisa menawarkan "lihat hasil sekarang" tanpa menunggu bot
    // menyelesaikan sisa balapan (FR-B07/B08 tetap: yang memilih menonton terus dapat race:end).
    if (!next.isBot && (next.status === 'finished' || next.status === 'outOfQuestions')) {
      this.emitStandings(socketId);
    }

    if (correct) {
      // Penjelasan juga dikirim saat benar supaya pemain belajar dari jawaban yang tepat (FR-B05).
      this.emitFeedback(socketId, {
        questionIndex: parsed.data.questionIndex,
        correct: true,
        explanation: question.explanation,
        sources: question.sources,
      });
      // Client tampilkan "Benar!" lalu penjelasan singkat (FR-B04).
    } else {
      const lockEndsAtMs = this.cfg.now() + GAME.LOCK_DURATION_S * 1000;
      this.emitFeedback(socketId, {
        questionIndex: parsed.data.questionIndex,
        correct: false,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        sources: question.sources,
        lockEndsAtMs,
      });
      const t = this.cfg.setTimer(() => {
        const cur = this.state.participants.find((x) => x.id === socketId);
        if (cur && cur.status === 'locked') {
          this.replaceParticipant(socketId, unlock(cur));
        }
        // Bot terkunci butuh penjadwalan ulang dari server (manusia menjawab sendiri).
        this.scheduleBots();
        this.broadcast();
      }, GAME.LOCK_DURATION_S * 1000);
      this.timers.add(t);
    }

    this.scheduleBots();
    this.broadcast();
    this.checkRaceEnd();
  }

  /** Reconnect ≤ 10 detik: lanjut soal yang sama dengan sisa waktu berjalan (FR-B11). */
  resume(socketId: string, _token: string): boolean {
    const p = this.state.participants.find((x) => x.id === socketId);
    if (!p) return false;
    if (p.status === 'left') {
      this.replaceParticipant(socketId, { ...p, status: 'racing' });
    }
    this.broadcast();
    return true;
  }

  /** Peserta keluar / putus > 10 dtk (FR-B11, FR-B12, FR-B13). */
  leave(socketId: string): void {
    const p = this.state.participants.find((x) => x.id === socketId);
    if (!p) return;
    this.replaceParticipant(socketId, markLeft(p));
    if (!p.isBot) {
      // TODO(T-12): ganti slot manusia yang keluar saat lobby dengan bot profil berikutnya (FR-M12).
      logEvent(
        this.cfg.roomId,
        this.cfg.seed,
        'player.left',
        this.state.phase,
        'info',
        'peserta keluar',
      );
    }
    this.broadcast();
    this.checkRaceEnd();
  }

  /** Evaluasi AI per pemain manusia setelah race:end (FR-H02/H03/H06/H10). */
  async requestEvaluation(): Promise<void> {
    if (this.evalRequested) return;
    this.evalRequested = true;
    for (const p of this.state.participants) {
      if (p.isBot) continue; // FR-H06: bot tidak mendapat Evaluasi
      const list = this.answers.get(p.id) ?? [];
      if (list.length === 0) continue;

      const pairs = list.flatMap((a) => {
        const question = this.questionBank[a.questionIndex];
        return question === undefined ? [] : [{ a, question }];
      });
      if (pairs.length === 0) continue;

      const input: EvalRequest = {
        questions: pairs.map(({ a, question }) => ({
          questionId: question.id,
          kind: question.kind,
          chosenIndex: a.chosenIndex,
          answerIndex: question.answerIndex,
          explanation: question.explanation,
          misinfoType: question.misinfoType ?? null,
          topic: question.topic,
        })),
      };

      // Maksimal 1 panggilan AI per pemain per balapan ditegakkan di evaluator (FR-H10).
      const result = await this.cfg.evaluator(input, this.cfg.seed);

      const payload = evalReadySchema.parse({
        questions: pairs.map(({ a, question }) => ({
          questionId: question.id,
          kind: question.kind,
          stem: question.stem,
          claim: question.claim ?? null,
          options: this.state.optionOrder.map((oi) => question.options[oi] ?? ''),
          chosenIndex: a.chosenIndex,
          answerIndex: question.answerIndex,
          explanation: question.explanation,
          sources: question.sources,
          topic: question.topic,
          misinfoType: question.misinfoType ?? null,
        })),
        aiSection: {
          pattern: result.output.pattern.length > 0 ? result.output.pattern : null,
          tip: result.output.tip.length > 0 ? result.output.tip : null,
          motivation:
            (result.output.motivation ?? '').length > 0 ? (result.output.motivation ?? '') : null,
          badge: result.badge,
        },
        badge: result.badge,
      });
      this.cfg.emitTo(p.id, 'eval:ready', payload);
    }
    logEvent(
      this.cfg.roomId,
      this.cfg.seed,
      'eval.ready',
      this.state.phase,
      'info',
      'evaluasi dikirim per pemain',
    );
  }

  // -------------------------------------------------------------------------
  // Privat
  // -------------------------------------------------------------------------

  private currentQuestion(p: Participant): Question | undefined {
    return this.questionBank[p.nextQuestionIndex];
  }

  private replaceParticipant(id: string, next: Participant): void {
    const i = this.state.participants.findIndex((x) => x.id === id);
    if (i >= 0) this.state.participants[i] = next;
  }

  /** Jadwalkan jawaban bot yang belum dijawab, dari seed + profil (FR-B14, FR-M10). */
  private scheduleBots(): void {
    for (const p of this.state.participants) {
      if (!p.isBot || p.status !== 'racing') continue;
      if (this.scheduledBots.has(p.id)) continue;
      const question = this.currentQuestion(p);
      if (!question) continue;
      const profile = nextBotProfile(this.botProfileIndex(p));
      const decision = botDecide(profile, this.botRng, question.answerIndex);
      this.botRng = decision.state;
      this.scheduledBots.add(p.id);
      const t = this.cfg.setTimer(() => {
        this.scheduledBots.delete(p.id);
        const cur = this.state.participants.find((x) => x.id === p.id);
        if (!cur || cur.status !== 'racing') return;
        const letterIdx = this.state.optionOrder.indexOf(decision.choiceIndex);
        const choice = OPTION_LETTERS[letterIdx >= 0 ? letterIdx : 0];
        if (choice) this.answer(p.id, { questionIndex: cur.nextQuestionIndex, choice });
      }, decision.delayMs);
      this.timers.add(t);
    }
  }

  /** Profil bot diambil berurutan dari slot bot-nya (Kilat → Santai → Teliti, FR-M10). */
  private botProfileIndex(p: Participant): number {
    const botSlots = this.state.participants.filter((x) => x.isBot);
    return Math.max(
      0,
      botSlots.findIndex((x) => x.id === p.id),
    );
  }

  private checkRaceEnd(): void {
    if (this.state.phase !== 'racing') return;
    if (!isRaceOver(this.state, this.cfg.now())) return;

    const humansLeft = this.state.participants.some((p) => !p.isBot && p.status !== 'left');
    this.state.phase = 'finished';
    for (const t of this.timers) this.cfg.clearTimer(t);
    this.timers.clear();

    if (!humansLeft) {
      // FR-B13: semua manusia keluar → balapan berakhir tanpa layar hasil, room dihapus.
      logEvent(
        this.cfg.roomId,
        this.cfg.seed,
        'race.end.empty',
        'finished',
        'info',
        'semua manusia keluar; room dihapus',
      );
      this.destroy();
      return;
    }

    this.emit('race:end', this.standingsPayload());
    logEvent(
      this.cfg.roomId,
      this.cfg.seed,
      'race.end',
      this.state.phase,
      'info',
      'balapan selesai',
    );

    void this.requestEvaluation().catch((err) => {
      logEvent(
        this.cfg.roomId,
        this.cfg.seed,
        'eval.error',
        this.state.phase,
        'error',
        `evaluasi gagal: ${(err as Error).message}`,
      );
    });

    // FR-H12: data room dihapus dari memori setelah hasil tidak dibuka lagi.
    const t = this.cfg.setTimer(() => this.destroy(), GAME.RESULT_RETENTION_S * 1000);
    this.timers.add(t);
  }

  /** Peringkat saat ini (bentuk sama dengan race:end, dipakai juga untuk race:standings). */
  private standingsPayload(): RaceEnd {
    const ranking = rankParticipants(this.state.participants);
    return raceEndSchema.parse({
      ranking: ranking.map((r) => ({
        rank: r.rank,
        nickname: r.nickname,
        animalId: r.animalId,
        isBot: r.isBot,
        correctCount: r.correctCount,
        status: r.status,
      })),
    });
  }

  /** Peringkat sementara HANYA ke satu pemain yang sudah selesai menjawab. */
  private emitStandings(socketId: string): void {
    this.cfg.emitTo(socketId, 'race:standings', this.standingsPayload());
  }

  private emit(event: string, payload: unknown): void {
    this.cfg.emit(event, payload);
  }

  private emitError(socketId: string, code: string, pesan: string): void {
    this.cfg.emitTo(socketId, 'error', { code, pesan });
  }

  private emitFeedback(
    socketId: string,
    raw: Omit<RaceFeedback, 'questionIndex'> & { questionIndex: number },
  ): void {
    const payload = raceFeedbackSchema.parse(raw);
    // FR-B06/NFR-08: feedback berisi kunci+penjelasan HANYA untuk pemain yang menjawab.
    this.cfg.emitTo(socketId, 'race:feedback', payload);
  }

  /**
   * room:state per socket: soal aktif peserta itu (stem/claim/options saja, FR-K11),
   * dan hanya saat balapan berjalan (tidak bocor di lobby maupun setelah finished).
   */
  private publicState(forSocketId: string): RoomState {
    const active = this.state.participants.find((p) => p.id === forSocketId);
    const activeVisible =
      this.state.phase === 'racing' &&
      active !== undefined &&
      (active.status === 'racing' || active.status === 'locked');
    const activeQuestion = activeVisible ? this.currentQuestion(active) : undefined;
    const raw = {
      roomId: this.state.roomId,
      phase: this.state.phase,
      participants: this.state.participants.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        animalId: p.animalId,
        isBot: p.isBot,
        slot: p.slot,
        steps: p.correctCount,
        status: p.status,
        ...(p.finishOrder !== undefined ? { finishOrder: p.finishOrder } : {}),
      })),
      timeLeftS:
        this.state.raceEndsAtMs !== undefined
          ? Math.max(0, Math.ceil((this.state.raceEndsAtMs - this.cfg.now()) / 1000))
          : 0,
      questionIndex: active?.nextQuestionIndex ?? 0,
      activeQuestion: activeQuestion
        ? questionPublicSchema.parse({
            ...activeQuestion,
            options: this.state.optionOrder.map((i) => activeQuestion.options[i] ?? ''),
          })
        : null,
      finishOrder: this.state.participants
        .filter((p) => p.status === 'finished')
        .sort((a, b) => (a.finishOrder ?? 0) - (b.finishOrder ?? 0))
        .map((p) => p.id),
    };
    return roomStateSchema.parse(raw);
  }

  /**
   * room:state dikirim per peserta manusia, membawa soal aktif masing-masing.
   * Bot tidak punya socket. Tanpa per-socket ini, state terakhir dari peserta lain
   * (tanpa soal) akan menghapus soal aktif di layar semua pemain.
   */
  private broadcast(): void {
    for (const p of this.state.participants) {
      // Peserta 'left' sudah tidak di room ini (mis. socket pindah ke room baru);
      // mengirim state ke socket id-nya akan mengirim state room lama ke room baru.
      if (p.isBot || p.status === 'left') continue;
      this.sendStateTo(p.id);
    }
  }

  private sendStateTo(socketId: string): void {
    this.cfg.emitTo(socketId, 'room:state', this.publicState(socketId));
  }

  destroy(): void {
    for (const t of this.timers) this.cfg.clearTimer(t);
    this.timers.clear();
    this.cfg.onEmpty(this.cfg.roomId);
  }
}
