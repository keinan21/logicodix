import { describe, it, expect, vi } from 'vitest';
import { selectMode, createEvaluator } from '../src/server/evaluate/index';
import { liveEvaluate, LiveEvaluateError, type GenAiClient } from '../src/server/evaluate/live';
import type { EvalRequest, Tip } from '../src/shared/schema';

const sampleReq: EvalRequest = {
  questions: [
    {
      questionId: 'q-1',
      kind: 'klaim',
      chosenIndex: 1,
      answerIndex: 0,
      explanation: 'Penjelasan klaim tentang sampah.',
      misinfoType: 'konteks-salah',
      topic: 'sampah',
    },
  ],
};

const sampleTips: Tip[] = [
  { key: 'konteks-salah', label: 'Konteks salah', tip: 'Periksa tanggal media.' },
  { key: 'sampah', label: 'Sampah', tip: 'Kelola sampah dengan bijak.' },
];

const sampleContoh = {
  'scenario1-kebanyakan-salah-konteks': {
    scenario: 'scenario1-kebanyakan-salah-konteks',
    pattern: 'Kamu sering terkecoh konteks salah.',
    tip: 'Cek tanggal rilis berita.',
    motivation: null,
    badge: 'contoh-ai-dibuat-sebelumnya',
  },
};

describe('Pipeline Evaluasi AI (FR-H06–FR-H11)', () => {
  describe('selectMode (ARCHITECTURE §7)', () => {
    it('live tanpa GEMINI_API_KEY turun ke contoh', () => {
      const res = selectMode({ AI_MODE: 'live', GEMINI_API_KEY: '' });
      expect(res.mode).toBe('contoh');
      expect(res.downgraded).toBe(true);
    });

    it('live dengan GEMINI_API_KEY tetap live', () => {
      const res = selectMode({ AI_MODE: 'live', GEMINI_API_KEY: 'test-key' });
      expect(res.mode).toBe('live');
      expect(res.downgraded).toBe(false);
    });

    it('mode default bila tidak diset adalah mock', () => {
      const res = selectMode({});
      expect(res.mode).toBe('mock');
      expect(res.downgraded).toBe(false);
    });
  });

  describe('liveEvaluate (FR-H06, FR-H07, FR-H08)', () => {
    it('melempar error bila API key kosong', async () => {
      await expect(liveEvaluate(sampleReq, '', 'gemini-2.0-flash')).rejects.toThrow(
        LiveEvaluateError,
      );
    });

    it('timeout membatalkan permintaan setelah batas waktu terlampaui (FR-H07)', async () => {
      const slowClient: GenAiClient = {
        models: {
          generateContent: async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return { text: '{"pattern": "Pola", "tip": "Tips"}' };
          },
        },
      };

      await expect(
        liveEvaluate(sampleReq, 'dummy-key', 'gemini-2.0-flash', 50, slowClient),
      ).rejects.toThrow(/timeout 50ms terlampaui/);
    });

    it('keluaran valid lolos schema dan check (FR-H08)', async () => {
      const validClient: GenAiClient = {
        models: {
          generateContent: async () => ({
            text: JSON.stringify({
              pattern: 'Kamu sering terkecoh klaim konteks salah pada topik sampah.',
              tip: 'Periksa tanggal rilis asli media.',
            }),
          }),
        },
      };

      const out = await liveEvaluate(sampleReq, 'dummy-key', 'gemini-2.0-flash', 1000, validClient);
      expect(out.pattern).toContain('konteks salah');
      expect(out.tip).toContain('tanggal rilis');
    });

    it('keluaran dengan URL ditolak oleh check (FR-H08)', async () => {
      const badClient: GenAiClient = {
        models: {
          generateContent: async () => ({
            text: JSON.stringify({
              pattern: 'Lihat info lengkap di https://bad-url.com.',
              tip: 'Waspada selalu.',
            }),
          }),
        },
      };

      await expect(
        liveEvaluate(sampleReq, 'dummy-key', 'gemini-2.0-flash', 1000, badClient),
      ).rejects.toThrow(/check gagal: no-url/);
    });

    it('keluaran bukan JSON melempar LiveEvaluateError', async () => {
      const invalidJsonClient: GenAiClient = {
        models: {
          generateContent: async () => ({
            text: 'Bukan format JSON yang benar',
          }),
        },
      };

      await expect(
        liveEvaluate(sampleReq, 'dummy-key', 'gemini-2.0-flash', 1000, invalidJsonClient),
      ).rejects.toThrow(/keluaran bukan JSON/);
    });
  });

  describe('createEvaluator (FR-H09, FR-H10, FR-H11)', () => {
    it('mode live mengembalikan hasil AI dan menyimpan di cache (FR-H10)', async () => {
      const liveFn = vi.fn().mockResolvedValue({
        pattern: 'Pola AI langsung.',
        tip: 'Tips AI langsung.',
      });

      const evaluator = createEvaluator({
        mode: 'live',
        geminiApiKey: 'test-key',
        tips: sampleTips,
        contoh: sampleContoh,
        liveEvaluator: liveFn,
      });

      const first = await evaluator.evaluate(sampleReq, 42);
      expect(first.badge).toBe('dibuat-oleh-ai');
      expect(first.source).toBe('live');
      expect(first.output.pattern).toBe('Pola AI langsung.');
      expect(liveFn).toHaveBeenCalledTimes(1);

      // Panggilan kedua dengan request yang sama memakai cache tanpa memanggil AI (FR-H10)
      const second = await evaluator.evaluate(sampleReq, 42);
      expect(second.badge).toBe('dibuat-oleh-ai');
      expect(second.output.pattern).toBe('Pola AI langsung.');
      expect(liveFn).toHaveBeenCalledTimes(1);
    });

    it('kegagalan AI live beralih otomatis ke ringkasan otomatis bukan AI (FR-H09)', async () => {
      const failingLiveFn = vi.fn().mockRejectedValue(new Error('Koneksi terputus'));

      const evaluator = createEvaluator({
        mode: 'live',
        geminiApiKey: 'test-key',
        tips: sampleTips,
        contoh: sampleContoh,
        liveEvaluator: failingLiveFn,
      });

      const res = await evaluator.evaluate(sampleReq, 42);
      expect(res.badge).toBe('ringkasan-otomatis-bukan-ai');
      expect(res.source).toBe('fallback');
      expect(res.output.pattern).toContain('konteks salah');
      expect(res.output.tip).toContain('Periksa tanggal media.');
    });

    it('mode contoh mengembalikan contoh pregenerated dengan badge sesuai (FR-H11)', async () => {
      const evaluator = createEvaluator({
        mode: 'contoh',
        tips: sampleTips,
        contoh: sampleContoh,
      });

      const res = await evaluator.evaluate(sampleReq, 42);
      expect(res.badge).toBe('contoh-ai-dibuat-sebelumnya');
      expect(res.source).toBe('contoh');
      expect(res.output.pattern).toBe('Kamu sering terkecoh konteks salah.');
    });

    it('mode mock mengembalikan ringkasan otomatis berlabel bukan AI', async () => {
      const evaluator = createEvaluator({
        mode: 'mock',
        tips: sampleTips,
        contoh: sampleContoh,
      });

      const res = await evaluator.evaluate(sampleReq, 42);
      expect(res.badge).toBe('ringkasan-otomatis-bukan-ai');
      expect(res.source).toBe('mock');
      expect(res.output.pattern).toBeDefined();
    });
  });
});
