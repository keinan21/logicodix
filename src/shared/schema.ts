/**
 * src/shared/schema.ts
 * Satu skema zod untuk tiga pemakaian (ARCHITECTURE §1 prinsip 4):
 * 1. Validasi pesan socket (kedua sisi)
 * 2. Validasi bank soal content/
 * 3. Cek keluaran AI (evaluate/check.ts)
 */

import { z } from 'zod';
import { CONTENT, GAME } from './constants';

// ---------------------------------------------------------------------------
// Enumerasi bersama
// ---------------------------------------------------------------------------

export const misinfoTypeSchema = z.enum([
  'konten-palsu-konspirasi',
  'menyesatkan-salah-tafsir-data',
  'konteks-salah',
  'catut-otoritas',
]);
export type MisinfoType = z.infer<typeof misinfoTypeSchema>;

export const topicSchema = z.enum(['iklim-cuaca', 'sampah', 'hutan', 'air']);
export type Topic = z.infer<typeof topicSchema>;

export const kindSchema = z.enum(['klaim', 'pengetahuan']);
export type QuestionKind = z.infer<typeof kindSchema>;

export const questionStatusSchema = z.enum(['draf', 'terverifikasi']);
export type QuestionStatus = z.infer<typeof questionStatusSchema>;

// ---------------------------------------------------------------------------
// 1. Bank soal (FR-K03)
// ---------------------------------------------------------------------------

export const sourceSchema = z.object({
  judul: z.string().min(1),
  url: z.string().url(),
  lembaga: z.string().min(1),
  tanggalCek: z.string().min(1),
});
export type Source = z.infer<typeof sourceSchema>;

/**
 * Soal draf (dibuat agen/peran C) boleh belum punya sumber & reviewer.
 * Validator (scripts/check-content.ts) menegakkan kelengkapan hanya untuk
 * status "terverifikasi" (FR-K07, FR-K10). Agen dilarang mengisi reviewedBy/
 * reviewedAt sendiri (AGENTS.md §4, D-58).
 */
/**
 * Bentuk dasar soal (tanpa refinement) supaya bisa di-.omit() untuk payload publik.
 */
const questionShapeSchema = z.object({
  id: z.string().uuid(),
  kind: kindSchema,
  stem: z.string().min(1).max(160),
  claim: z.string().max(300).optional(),
  options: z.array(z.string().min(1).max(80)).length(CONTENT.OPTIONS_PER_QUESTION),
  answerIndex: z
    .number()
    .int()
    .min(0)
    .max(CONTENT.OPTIONS_PER_QUESTION - 1),
  explanation: z.string().min(1).max(300),
  sources: z.array(sourceSchema),
  misinfoType: misinfoTypeSchema.optional(),
  topic: topicSchema,
  status: questionStatusSchema,
  writtenBy: z.string().min(1),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
});

export const questionSchema = questionShapeSchema
  .refine((q) => (q.kind === 'klaim' ? q.claim !== undefined : q.claim === undefined), {
    message: 'claim wajib untuk soal klaim dan tidak boleh ada untuk soal pengetahuan',
  })
  .refine((q) => (q.kind === 'klaim' ? q.misinfoType !== undefined : q.misinfoType === undefined), {
    message: 'misinfoType wajib untuk soal klaim dan tidak boleh ada untuk soal pengetahuan',
  })
  .refine(
    (q) =>
      q.status !== 'terverifikasi' ||
      (q.sources.length > 0 &&
        q.reviewedBy !== undefined &&
        q.reviewedAt !== undefined &&
        q.writtenBy !== q.reviewedBy),
    {
      message:
        'soal terverifikasi wajib punya >=1 sumber, reviewedBy berbeda dari writtenBy, dan reviewedAt (FR-K07)',
    },
  );
export type Question = z.infer<typeof questionSchema>;

/**
 * Payload soal SEBELUM dijawab (FR-K11): HANYA stem, claim, options.
 * id/kind/topic pun tidak dikirim — client menampilkan nomor soal dari room:state.
 * Chip jenis soal baru tampil di Evaluasi (eval:ready), bukan saat balapan.
 */
export const questionPublicSchema = questionShapeSchema.omit({
  id: true,
  kind: true,
  answerIndex: true,
  explanation: true,
  sources: true,
  misinfoType: true,
  topic: true,
  status: true,
  writtenBy: true,
  reviewedBy: true,
  reviewedAt: true,
});
export type QuestionPublic = z.infer<typeof questionPublicSchema>;

// ---------------------------------------------------------------------------
// 2. Kontrak socket (ARCHITECTURE §6)
// ---------------------------------------------------------------------------

export const nicknameSchema = z
  .string()
  .min(2)
  .max(16)
  .regex(/^[a-zA-Z0-9 ]+$/, 'Nickname 2–16 karakter, hanya huruf, angka, dan spasi');

export const animalIdSchema = z.enum(['orangutan', 'harimau', 'gajah', 'penyu', 'badak', 'burung']);
export type AnimalId = z.infer<typeof animalIdSchema>;

export const joinQueuePayloadSchema = z.object({
  nickname: nicknameSchema,
  animalId: animalIdSchema,
  mode: z.enum(['quick', 'bot']),
});
export type JoinQueuePayload = z.infer<typeof joinQueuePayloadSchema>;

export const raceAnswerPayloadSchema = z.object({
  questionIndex: z.number().int().min(0),
  choice: z.string().regex(/^[A-D]$/, 'Pilihan A–D'),
});
export type RaceAnswerPayload = z.infer<typeof raceAnswerPayloadSchema>;

export const sessionResumePayloadSchema = z.object({
  token: z.string().min(1),
});

export const participantPublicSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  animalId: animalIdSchema,
  isBot: z.boolean(),
  slot: z.number().int().min(1).max(4),
  steps: z.number().int().min(0).max(GAME.STEPS_TO_FINISH),
  status: z.enum(['racing', 'locked', 'finished', 'outOfQuestions', 'left']),
  /** Urutan finish (1 = pertama) — untuk "Finish! Posisi ke-N" (FR-B07). */
  finishOrder: z.number().int().min(1).optional(),
});
export type ParticipantPublic = z.infer<typeof participantPublicSchema>;

/** room:state — soal aktif TANPA kunci (FR-K11, NFR-08). */
export const roomStateSchema = z.object({
  roomId: z.string(),
  phase: z.enum(['waiting', 'lobby', 'racing', 'finished']),
  /** Sisa hitung mundur dari server; tidak dihitung ulang ketika peserta berubah. */
  lobbyCountdownS: z.number().int().min(0).optional(),
  participants: z.array(participantPublicSchema),
  timeLeftS: z.number().int().min(0),
  questionIndex: z.number().int().min(0),
  activeQuestion: questionPublicSchema.nullable(),
  /** urutan finish peserta yang sudah finish */
  finishOrder: z.array(z.string()),
});
export type RoomState = z.infer<typeof roomStateSchema>;

export const raceFeedbackSchema = z.object({
  questionIndex: z.number().int().min(0),
  correct: z.boolean(),
  /** kunci hanya dikirim bila salah (FR-B05) */
  answerIndex: z
    .number()
    .int()
    .min(0)
    .max(CONTENT.OPTIONS_PER_QUESTION - 1)
    .optional(),
  /** penjelasan dikirim setelah menjawab, benar maupun salah (FR-B05) */
  explanation: z.string().optional(),
  sources: z.array(sourceSchema).optional(),
  lockEndsAtMs: z.number().int().optional(),
});
export type RaceFeedback = z.infer<typeof raceFeedbackSchema>;

export const raceEndSchema = z.object({
  ranking: z.array(
    z.object({
      rank: z.number().int().min(1),
      nickname: z.string(),
      animalId: animalIdSchema,
      isBot: z.boolean(),
      correctCount: z.number().int().min(0),
      status: z.enum(['finished', 'outOfQuestions', 'racing', 'locked', 'left']),
    }),
  ),
});
export type RaceEnd = z.infer<typeof raceEndSchema>;

// ---------------------------------------------------------------------------
// 3. Evaluasi AI (FR-H06, FR-H08)
// ---------------------------------------------------------------------------

/** Satu soal yang dijawab, dikirim ke AI. Tanpa nickname (FR-H06, D-39). */
export const evalQuestionInputSchema = z.object({
  questionId: z.string(),
  kind: kindSchema,
  chosenIndex: z
    .number()
    .int()
    .min(0)
    .max(CONTENT.OPTIONS_PER_QUESTION - 1),
  answerIndex: z
    .number()
    .int()
    .min(0)
    .max(CONTENT.OPTIONS_PER_QUESTION - 1),
  explanation: z.string(),
  misinfoType: misinfoTypeSchema.nullable(),
  topic: topicSchema,
});
export type EvalQuestionInput = z.infer<typeof evalQuestionInputSchema>;

/** Input evaluasi AI per pemain (FR-H06): daftar soal dijawab, tanpa nickname. */
export interface EvalRequest {
  questions: EvalQuestionInput[];
}

/** Keluaran AI yang lolos check (FR-H08). */
export const evalAiOutputSchema = z
  .object({
    pattern: z.string().max(400),
    tip: z.string().max(200),
    motivation: z.string().max(400).optional(),
  })
  .refine((o) => (o.motivation ? o.pattern.length === 0 : o.pattern.length > 0), {
    message: 'kasus semua benar hanya memakai motivation; lainnya hanya pattern+tip',
  });
export type EvalAiOutput = z.infer<typeof evalAiOutputSchema>;

export const evalBadgeSchema = z.enum([
  'dibuat-oleh-ai',
  'ringkasan-otomatis-bukan-ai',
  'contoh-ai-dibuat-sebelumnya',
]);
export type EvalBadge = z.infer<typeof evalBadgeSchema>;

/** eval:ready payload (FR-H02, FR-H05). */
export const evalReadySchema = z.object({
  questions: z.array(
    z.object({
      questionId: z.string(),
      kind: kindSchema,
      stem: z.string(),
      claim: z.string().nullable(),
      options: z.array(z.string()).length(CONTENT.OPTIONS_PER_QUESTION),
      chosenIndex: z
        .number()
        .int()
        .min(0)
        .max(CONTENT.OPTIONS_PER_QUESTION - 1),
      answerIndex: z
        .number()
        .int()
        .min(0)
        .max(CONTENT.OPTIONS_PER_QUESTION - 1),
      explanation: z.string(),
      sources: z.array(sourceSchema),
      topic: topicSchema,
      misinfoType: misinfoTypeSchema.nullable(),
    }),
  ),
  aiSection: z
    .object({
      pattern: z.string().nullable(),
      tip: z.string().nullable(),
      motivation: z.string().nullable(),
      badge: evalBadgeSchema,
    })
    .nullable(),
  badge: evalBadgeSchema.nullable(),
});
export type EvalReady = z.infer<typeof evalReadySchema>;

// ---------------------------------------------------------------------------
// 4. Konten hewan + tips (FR-M14, FR-K09)
// ---------------------------------------------------------------------------

export const animalSchema = z.object({
  id: animalIdSchema,
  nama: z.string().min(1),
  fakta: z.string().max(200),
  /** Sumber fakta hewan wajib diverifikasi C/D sebelum status konten final (FR-M14, P-04). */
  sumber: sourceSchema.optional(),
  flip: z.boolean(),
});
export type Animal = z.infer<typeof animalSchema>;

export const tipSchema = z.object({
  key: z.string(), // misinfoType atau topic
  label: z.string().min(1),
  tip: z.string().min(1).max(200),
});
export type Tip = z.infer<typeof tipSchema>;

export const officialSourceSchema = z.object({
  lembaga: z.string().min(1),
  domains: z.array(z.string().min(1)).min(1),
});
export type OfficialSource = z.infer<typeof officialSourceSchema>;
