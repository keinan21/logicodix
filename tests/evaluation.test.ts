import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { EvaluationScreen } from '../src/client/screens/Evaluation';
import type { EvalReady } from '../src/shared/schema';

const evaluation: EvalReady = {
  questions: [
    {
      questionId: 'q-1',
      kind: 'klaim',
      stem: 'Klaim uji tentang sampah',
      claim: 'Sampah plastik terurai dalam sebulan.',
      options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
      chosenIndex: 1,
      answerIndex: 0,
      explanation: 'Penjelasan buatan tim.',
      sources: [
        {
          judul: 'Sumber uji',
          url: 'https://example.org/sumber',
          lembaga: 'BMKG',
          tanggalCek: '2026-11-01',
        },
      ],
      topic: 'sampah',
      misinfoType: 'konteks-salah',
    },
  ],
  aiSection: {
    pattern: 'Pola kesalahan uji.',
    tip: 'Tips uji.',
    motivation: null,
    badge: 'ringkasan-otomatis-bukan-ai',
  },
  badge: 'ringkasan-otomatis-bukan-ai',
};

describe('Evaluasi (FR-H02, FR-H04, FR-H05)', () => {
  it('membuka soal salah otomatis dengan pilihan pemain, kunci, dan penjelasan', () => {
    const html = renderToStaticMarkup(
      createElement(EvaluationScreen, { evaluation, onPlayAgain: vi.fn() }),
    );

    expect(html).toContain('Soal 1 — Salah');
    expect(html).toContain('Kamu memilih B, jawabannya A.');
    expect(html).toContain('Penjelasan buatan tim.');
    expect(html).toContain('Sumber uji — BMKG');
  });

  it('menampilkan bagian AI dengan badge asalnya', () => {
    const html = renderToStaticMarkup(
      createElement(EvaluationScreen, { evaluation, onPlayAgain: vi.fn() }),
    );

    expect(html).toContain('Pola kesalahan uji.');
    expect(html).toContain('Tips uji.');
    expect(html).toContain('Ringkasan otomatis (bukan AI)');
  });

  it('menyediakan Baca lebih lanjut dari sumber soal yang dijawab', () => {
    const html = renderToStaticMarkup(
      createElement(EvaluationScreen, { evaluation, onPlayAgain: vi.fn() }),
    );

    expect(html).toContain('Baca lebih lanjut');
    expect(html.match(/https:\/\/example.org\/sumber/g)).toHaveLength(2);
  });

  it('menampilkan status menyusun selama evaluasi belum tiba, tanpa badge yang menyesatkan', () => {
    const html = renderToStaticMarkup(
      createElement(EvaluationScreen, { evaluation: null, onPlayAgain: vi.fn() }),
    );

    expect(html).toContain('AI sedang menyusun evaluasi…');
    expect(html).not.toContain('Ringkasan otomatis (bukan AI)');
  });
});
