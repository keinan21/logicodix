/**
 * src/server/evaluate/prompt.ts — satu template prompt bahasa Indonesia (ARCHITECTURE §7).
 * Meminta JSON {pattern, tip} atau {motivation} untuk kasus semua benar.
 */

import type { EvalRequest } from '../../shared/schema';

export function buildPrompt(req: EvalRequest): string {
  const allCorrect = req.questions.every((q) => q.chosenIndex === q.answerIndex);
  if (allCorrect) {
    return [
      'Kamu adalah asisten evaluasi belajar untuk siswa SMP.',
      'Berikut ringkasan jawaban seorang pemain (tanpa nama): semua soal dijawab benar.',
      'Tulis satu pesan motivasi singkat dalam bahasa Indonesia (maks 400 karakter) yang menghargai',
      'keberhasilan mereka tanpa menyebutkan nama, tanpa URL, dan tanpa angka yang tidak ada di input.',
      'Input:',
      JSON.stringify(req.questions),
      'Keluaran JSON: {"motivation": "..."}',
    ].join(' ');
  }

  return [
    'Kamu adalah asisten evaluasi belajar untuk siswa SMP.',
    'Analisis pola kesalahan dari jawaban berikut (ID soal, jenis, pilihan pemain, kunci,',
    'penjelasan buatan tim, tipe misinformasi, topik). Jangan menyebut nama pemain.',
    'Tulis:',
    '- "pattern": satu paragraf bahasa Indonesia (maks 400 karakter) tentang tipe misinformasi',
    '  dan/atau topik lingkungan yang paling sering membuat pemain salah, hanya berdasarkan input.',
    '- "tip": satu kalimat tips bahasa Indonesia (maks 200 karakter).',
    'Larangan: tanpa URL, tanpa angka yang tidak ada di input, tanpa menyebut kunci jawaban',
    'yang berbeda dari kunci di input, hanya tipe/topik yang ada di input.',
    'Jangan memakai kata "menyesatkan", "salah tafsir", "konspirasi", "konten palsu", "catut otoritas",',
    '"iklim", "cuaca", "hutan", atau "air" kecuali tipe/topik itu ada di input.',
    'Input:',
    JSON.stringify(req.questions),
    'Keluaran JSON: {"pattern": "...", "tip": "..."}',
  ].join(' ');
}
