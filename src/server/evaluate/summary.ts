/**
 * src/server/evaluate/summary.ts — ringkasan otomatis (FR-H09) + cache (FR-H10).
 * Dihitung server dari kunci (input sudah berisi answerIndex). Tanpa nickname.
 */

import type { EvalRequest, EvalAiOutput, EvalBadge, Tip } from '../../shared/schema';
import type { EvalResult } from './index';

export interface SummaryResult {
  output: EvalAiOutput;
  badge: EvalBadge;
}

/** Hitung tipe misinformasi & topik terbanyak yang SALAH. */
export function mostCommonWrong(req: EvalRequest): {
  misinfoType: string | null;
  topic: string | null;
} {
  const wrong = req.questions.filter((q) => q.chosenIndex !== q.answerIndex);
  if (wrong.length === 0) return { misinfoType: null, topic: null };

  const typeCount = new Map<string, number>();
  const topicCount = new Map<string, number>();
  for (const q of wrong) {
    if (q.misinfoType) typeCount.set(q.misinfoType, (typeCount.get(q.misinfoType) ?? 0) + 1);
    topicCount.set(q.topic, (topicCount.get(q.topic) ?? 0) + 1);
  }
  const pick = (m: Map<string, number>): string | null => {
    let best: string | null = null;
    let bestN = 0;
    for (const [k, n] of m) {
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    }
    return best;
  };
  return { misinfoType: pick(typeCount), topic: pick(topicCount) };
}

/** Tips tetap dari tips.json untuk kunci tertentu (FR-K09). */
export function tipFor(tips: Tip[], key: string | null): string | null {
  if (!key) return null;
  return tips.find((t) => t.key === key)?.tip ?? null;
}

/**
 * Ringkasan otomatis: tipe & topik terbanyak salah + tips tetap.
 * Kasus semua benar → ucapan selamat tetap (FR-H09).
 */
export function autoSummary(req: EvalRequest, tips: Tip[]): SummaryResult {
  const { misinfoType, topic } = mostCommonWrong(req);
  const allCorrect = req.questions.every((q) => q.chosenIndex === q.answerIndex);

  if (allCorrect) {
    return {
      output: {
        pattern: '',
        tip: '',
        motivation:
          'Hebat! Kamu menjawab semua soal dengan benar. Tetap cek sumber resmi sebelum membagikan informasi lingkungan ke siapa pun.',
      },
      badge: 'ringkasan-otomatis-bukan-ai',
    };
  }

  const typeLabel = misinfoType ? misinfoType.replace(/-/g, ' ') : null;
  const topicLabel = topic ? topic.replace(/-/g, ' ') : null;
  const pattern =
    `Kesalahanmu paling sering muncul pada ` +
    `${typeLabel ? `klaim bertipe ${typeLabel}` : ''}${typeLabel && topicLabel ? ' dan ' : ''}${topicLabel ? `topik ${topicLabel}` : ''}.` +
    ` Periksa kembali sumber resmi sebelum memercayai atau membagikan klaim.`;
  const tip =
    tipFor(tips, misinfoType ?? null) ??
    tipFor(tips, topic ?? null) ??
    'Cek sumber resmi sebelum membagikan informasi.';

  return {
    output: { pattern, tip, motivation: '' },
    badge: 'ringkasan-otomatis-bukan-ai',
  };
}

/**
 * Cache FR-H10: kunci = daftar (questionId, chosenIndex) terurut, tanpa nickname.
 * Map di memori; hilang saat server mati.
 */
export class EvalCache {
  private map = new Map<string, EvalResult>();
  private aiCalls = new Map<string, number>();

  static key(req: EvalRequest): string {
    return req.questions
      .map((q) => `${q.questionId}:${q.chosenIndex}`)
      .sort()
      .join('|');
  }

  get(req: EvalRequest): EvalResult | undefined {
    return this.map.get(EvalCache.key(req));
  }

  set(req: EvalRequest, result: EvalResult): void {
    this.map.set(EvalCache.key(req), result);
  }

  /** FR-H10: maksimal 1 panggilan AI per kombinasi jawaban per balapan. */
  countAiCall(req: EvalRequest): number {
    const k = EvalCache.key(req);
    const n = (this.aiCalls.get(k) ?? 0) + 1;
    this.aiCalls.set(k, n);
    return n;
  }
}
