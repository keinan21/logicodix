/**
 * src/server/evaluate/mock.ts — mode mock: output deterministik untuk dev + e2e (ARCHITECTURE §11).
 * Tidak memanggil AI. Menghasilkan keluaran yang lolos check.ts.
 */

import type { EvalRequest, EvalAiOutput } from '../../shared/schema';
import { mostCommonWrong } from './summary';

export function mockEvaluate(req: EvalRequest): EvalAiOutput {
  const { misinfoType, topic } = mostCommonWrong(req);
  const allCorrect = req.questions.every((q) => q.chosenIndex === q.answerIndex);
  if (allCorrect) {
    return {
      pattern: '',
      tip: '',
      motivation: 'Luar biasa, semua jawabanmu benar! Terus biasakan cek sumber resmi ya.',
    };
  }
  const pattern =
    `Pola kesalahanmu: ${misinfoType ? `tipe misinformasi ${misinfoType}` : 'beberapa tipe'}` +
    `${topic ? `, terutama di topik ${topic}` : ''}. ` +
    `Cermati penjelasan bersumber pada setiap soal yang salah.`;
  return {
    pattern,
    tip: 'Baca dulu penjelasan dan sumber resminya sebelum menjawab.',
  };
}
