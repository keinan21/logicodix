/**
 * src/server/evaluate/contoh.ts — mode contoh: evaluasi pregenerated dari 3 skenario sintetis (FR-H11, D-33).
 * Dipakai saat tidak ada internet/API key, dan untuk demo video.
 */

import type { EvalRequest, EvalBadge } from '../../shared/schema';

export interface ContohEntry {
  scenario: string;
  pattern: string | null;
  tip: string | null;
  motivation: string | null;
  badge: EvalBadge;
}

const BADGE: EvalBadge = 'contoh-ai-dibuat-sebelumnya';

/** Pilih skenario dari request: semua benar → motivasi; mayoritas salah satu tipe → skenario tipe itu. */
export function pickContoh(req: EvalRequest, contoh: Record<string, unknown>): ContohEntry | null {
  const allCorrect = req.questions.every((q) => q.chosenIndex === q.answerIndex);
  const fallback: ContohEntry = {
    scenario: 'default',
    pattern: 'Pola kesalahanmu beragam. Perhatikan penjelasan bersumber pada soal-soal yang salah.',
    tip: 'Cek sumber resmi sebelum membagikan klaim.',
    motivation: null,
    badge: BADGE,
  };

  if (allCorrect) {
    const entry = readContoh(contoh, 'scenario3-semua-benar');
    return (
      entry ?? {
        ...fallback,
        pattern: null,
        tip: null,
        motivation: 'Kerja bagus, semua jawabanmu benar!',
      }
    );
  }

  // Hitung mayoritas tipe salah
  const count = new Map<string, number>();
  for (const q of req.questions) {
    if (q.chosenIndex !== q.answerIndex && q.misinfoType) {
      count.set(q.misinfoType, (count.get(q.misinfoType) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [k, n] of count) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  const scenarioFile =
    best === 'konteks-salah'
      ? 'scenario1-kebanyakan-salah-konteks'
      : best === 'catut-otoritas'
        ? 'scenario2-campur'
        : null;
  if (scenarioFile) {
    const entry = readContoh(contoh, scenarioFile);
    if (entry) return entry;
  }
  return fallback;
}

function readContoh(contoh: Record<string, unknown>, key: string): ContohEntry | null {
  const raw = contoh[key];
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<ContohEntry>;
  return {
    scenario: r.scenario ?? key,
    pattern: r.pattern ?? null,
    tip: r.tip ?? null,
    motivation: r.motivation ?? null,
    badge: BADGE,
  };
}
