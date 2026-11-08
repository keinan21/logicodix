/**
 * src/server/evaluate/check.ts — cek keluaran AI (FR-H08, ARCHITECTURE §7).
 * Satu cek gagal berarti hasil dibuang.
 */

import type { EvalRequest } from '../../shared/schema';

export interface CheckFailure {
  rule: string;
  detail: string;
}

/** Ekstrak huruf A–D yang disebut dengan konteks kunci/jawaban. */
function mentionedKeyLetters(text: string): string[] {
  const letters: string[] = [];
  const patterns = [
    /(?:jawaban|kunci)(?:nya)?\s*(?:adalah|:)?\s*\(?([A-D])\)?/gi,
    /pilihan\s*(?:yang\s*)?benar\s*(?:adalah|:)?\s*([A-D])/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      if (m[1]) letters.push(m[1].toUpperCase());
    }
  }
  return letters;
}

/** Angka-angka yang muncul di teks. */
function numbersIn(text: string): string[] {
  return text.match(/\d+/g) ?? [];
}

/** Kata kunci tiap tipe misinformasi untuk deteksi sebutan di keluaran. */
const TYPE_WORDS: Record<string, string> = {
  'konten-palsu-konspirasi': 'konten palsu|konspirasi',
  'menyesatkan-salah-tafsir-data': 'menyesatkan|salah tafsir',
  'konteks-salah': 'konteks salah',
  'catut-otoritas': 'catut otoritas',
};

/** Kata kunci tiap topik lingkungan. */
const TOPIC_WORDS: Record<string, string> = {
  'iklim-cuaca': 'iklim|cuaca',
  sampah: 'sampah',
  hutan: 'hutan',
  air: '\\bair\\b',
};

export function checkAiOutput(
  raw: unknown,
  req: EvalRequest,
): { ok: boolean; reasons: CheckFailure[] } {
  const reasons: CheckFailure[] = [];
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reasons: [{ rule: 'format', detail: 'keluaran bukan objek JSON' }] };
  }
  const out = raw as Record<string, unknown>;
  const pattern = typeof out.pattern === 'string' ? out.pattern : '';
  const tip = typeof out.tip === 'string' ? out.tip : '';
  const motivation = typeof out.motivation === 'string' ? out.motivation : '';
  const text = `${pattern} ${tip} ${motivation}`;

  // 1. Format & panjang (FR-H03/H04)
  if (pattern.length > 400)
    reasons.push({ rule: 'length.pattern', detail: 'pattern > 400 karakter' });
  if (tip.length > 200) reasons.push({ rule: 'length.tip', detail: 'tip > 200 karakter' });
  if (motivation.length > 400)
    reasons.push({ rule: 'length.motivation', detail: 'motivation > 400 karakter' });
  const allCorrect = req.questions.every((q) => q.chosenIndex === q.answerIndex);
  if (allCorrect && motivation.length === 0)
    reasons.push({ rule: 'format', detail: 'semua benar tapi tanpa motivation' });
  if (!allCorrect && pattern.length === 0)
    reasons.push({ rule: 'format', detail: 'tanpa pattern' });

  // 2. Hanya tipe/topik dari input (FR-H08)
  const inputTypes = new Set<string>(
    req.questions.flatMap((q) => (q.misinfoType ? [q.misinfoType] : [])),
  );
  const inputTopics = new Set<string>(req.questions.map((q) => q.topic));
  for (const [type, words] of Object.entries(TYPE_WORDS)) {
    if (inputTypes.has(type)) continue;
    if (new RegExp(words, 'i').test(text)) {
      reasons.push({
        rule: 'type-not-in-input',
        detail: `menyebut tipe ${type} yang tidak ada di input`,
      });
    }
  }
  for (const [topic, words] of Object.entries(TOPIC_WORDS)) {
    if (inputTopics.has(topic)) continue;
    if (new RegExp(words, 'i').test(text)) {
      reasons.push({
        rule: 'topic-not-in-input',
        detail: `menyebut topik ${topic} yang tidak ada di input`,
      });
    }
  }

  // 3. Tanpa URL (FR-H08)
  if (/https?:\/\//i.test(text) || /\bwww\./i.test(text)) {
    reasons.push({ rule: 'no-url', detail: 'keluaran memuat URL' });
  }

  // 4. Tanpa angka yang tidak ada di input
  const inputText = JSON.stringify(req.questions);
  for (const num of numbersIn(text)) {
    if (!inputText.includes(num)) {
      reasons.push({ rule: 'no-foreign-number', detail: `angka ${num} tidak ada di input` });
      break;
    }
  }

  // 5. Tidak menyatakan kunci yang berbeda (FR-H08)
  const correctLetters = new Set(req.questions.map((q) => String.fromCharCode(65 + q.answerIndex)));
  for (const letter of mentionedKeyLetters(text)) {
    if (!correctLetters.has(letter)) {
      reasons.push({
        rule: 'wrong-key',
        detail: `menyebut kunci ${letter} yang berbeda dari input`,
      });
    }
  }

  return { ok: reasons.length === 0, reasons };
}
