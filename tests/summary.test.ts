import { describe, it, expect } from 'vitest';
import { mostCommonWrong, autoSummary, EvalCache } from '../src/server/evaluate/summary';
import type { EvalRequest, Tip } from '../src/shared/schema';
import type { EvalResult } from '../src/server/evaluate';

const tips: Tip[] = [
  { key: 'konteks-salah', label: 'Konteks salah', tip: 'Cek tanggal dan lokasi asli media.' },
  { key: 'sampah', label: 'Sampah', tip: 'Terapkan 3R sejak dari rumah.' },
];

function makeReq(overrides: Partial<EvalRequest['questions'][number]>[]): EvalRequest {
  return {
    questions: overrides.map((o) => ({
      questionId: 'q',
      kind: 'klaim',
      chosenIndex: 1,
      answerIndex: 0,
      explanation: 'Penjelasan.',
      misinfoType: 'konteks-salah',
      topic: 'sampah',
      ...o,
    })),
  };
}

describe('evaluate/summary (FR-H09, FR-H10)', () => {
  it('mostCommonWrong menghitung tipe & topik terbanyak yang salah', () => {
    const req = makeReq([
      { questionId: 'q1' },
      { questionId: 'q2' },
      { questionId: 'q3', misinfoType: 'catut-otoritas', topic: 'hutan' },
    ]);
    expect(mostCommonWrong(req)).toEqual({ misinfoType: 'konteks-salah', topic: 'sampah' });
  });

  it('semua benar → ucapan selamat tetap, badge bukan AI', () => {
    const req = makeReq([{ chosenIndex: 0 }]);
    const s = autoSummary(req, tips);
    expect((s.output.motivation ?? '').length).toBeGreaterThan(0);
    expect(s.badge).toBe('ringkasan-otomatis-bukan-ai');
  });

  it('ada yang salah → pattern menyebut tipe & topik terbanyak + tips', () => {
    const req = makeReq([{ questionId: 'q1' }]);
    const s = autoSummary(req, tips);
    expect(s.output.pattern).toContain('konteks salah');
    expect(s.output.pattern).toContain('sampah');
    expect(s.output.tip).toBe('Cek tanggal dan lokasi asli media.');
    expect(s.badge).toBe('ringkasan-otomatis-bukan-ai');
  });

  it('cache: hasil sama dipakai ulang tanpa panggilan ulang (FR-H10)', () => {
    const cache = new EvalCache();
    const req = makeReq([{ questionId: 'q1' }]);
    expect(cache.get(req)).toBeUndefined();
    const result: EvalResult = { ...autoSummary(req, tips), source: 'fallback' };
    cache.set(req, result);
    expect(cache.get(req)).toEqual(result);
    expect(cache.countAiCall(req)).toBe(1);
    expect(cache.countAiCall(req)).toBe(2);
  });
});
