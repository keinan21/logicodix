import { describe, it, expect } from 'vitest';
import { checkAiOutput } from '../src/server/evaluate/check';
import type { EvalRequest } from '../src/shared/schema';

const req: EvalRequest = {
  questions: [
    {
      questionId: 'q1',
      kind: 'klaim',
      chosenIndex: 1,
      answerIndex: 0,
      explanation: 'Penjelasan soal satu.',
      misinfoType: 'konteks-salah',
      topic: 'sampah',
    },
    {
      questionId: 'q2',
      kind: 'pengetahuan',
      chosenIndex: 0,
      answerIndex: 0,
      explanation: 'Penjelasan soal dua.',
      misinfoType: null,
      topic: 'sampah',
    },
  ],
};

describe('evaluate/check (FR-H08)', () => {
  it('keluaran baik lolos', () => {
    expect(
      checkAiOutput({ pattern: 'Kamu sering salah konteks.', tip: 'Cek tanggal aslinya.' }, req).ok,
    ).toBe(true);
  });

  it('URL dilarang', () => {
    const r = checkAiOutput({ pattern: 'Lihat https://example.com ya.', tip: 'ok' }, req);
    expect(r.ok).toBe(false);
    expect(r.reasons.some((x) => x.rule === 'no-url')).toBe(true);
  });

  it('angka yang tidak ada di input dilarang', () => {
    const r = checkAiOutput({ pattern: 'Kamu salah 777 kali.', tip: 'ok' }, req);
    expect(r.ok).toBe(false);
    expect(r.reasons.some((x) => x.rule === 'no-foreign-number')).toBe(true);
  });

  it('menyebut kunci berbeda dari input dilarang', () => {
    const r = checkAiOutput({ pattern: 'Sebenarnya jawabannya adalah B.', tip: 'ok' }, req);
    expect(r.ok).toBe(false);
    expect(r.reasons.some((x) => x.rule === 'wrong-key')).toBe(true);
  });

  it('tipe misinformasi yang tidak ada di input dilarang', () => {
    const r = checkAiOutput({ pattern: 'Kamu tersangkut catut otoritas.', tip: 'ok' }, req);
    expect(r.ok).toBe(false);
    expect(r.reasons.some((x) => x.rule === 'type-not-in-input')).toBe(true);
  });

  it('topik yang tidak ada di input dilarang', () => {
    const r = checkAiOutput({ pattern: 'Kamu salah soal hutan.', tip: 'ok' }, req);
    expect(r.ok).toBe(false);
    expect(r.reasons.some((x) => x.rule === 'topic-not-in-input')).toBe(true);
  });

  it('pattern lebih dari 400 karakter gagal', () => {
    const r = checkAiOutput({ pattern: 'p'.repeat(401), tip: 'ok' }, req);
    expect(r.ok).toBe(false);
    expect(r.reasons.some((x) => x.rule === 'length.pattern')).toBe(true);
  });

  it('semua benar tanpa motivation gagal', () => {
    const allCorrect: EvalRequest = {
      questions: [{ ...req.questions[0]!, chosenIndex: 0 }],
    };
    const r = checkAiOutput({ pattern: '', tip: '', motivation: '' }, allCorrect);
    expect(r.ok).toBe(false);
  });
});
