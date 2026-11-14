import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { EvaluationScreen } from '../src/client/screens/Evaluation';
import { EvalItem } from '../src/client/components/EvalItem';
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
      createElement(EvaluationScreen, {
        evaluation,
        onPlayAgain: vi.fn(),
        onBackToResults: vi.fn(),
      }),
    );

    expect(html).toContain('Soal 1 — Salah');
    expect(html).toContain('Kamu memilih Pilihan B, jawabannya Pilihan A.');
    expect(html).toContain('Sampah plastik terurai dalam sebulan.');
    expect(html).toContain('Penjelasan buatan tim.');
    expect(html).toContain('Sumber uji — BMKG');
  });

  it('menampilkan bagian AI dengan badge asalnya', () => {
    const html = renderToStaticMarkup(
      createElement(EvaluationScreen, {
        evaluation,
        onPlayAgain: vi.fn(),
        onBackToResults: vi.fn(),
      }),
    );

    expect(html).toContain('Pola kesalahan uji.');
    expect(html).toContain('Tips uji.');
    expect(html).toContain('Ringkasan otomatis (bukan AI)');
  });

  it('menyediakan Baca lebih lanjut dari sumber soal yang dijawab', () => {
    const html = renderToStaticMarkup(
      createElement(EvaluationScreen, {
        evaluation,
        onPlayAgain: vi.fn(),
        onBackToResults: vi.fn(),
      }),
    );

    expect(html).toContain('Baca lebih lanjut');
    expect(html.match(/https:\/\/example.org\/sumber/g)).toHaveLength(2);
  });

  it('menampilkan status menyusun selama evaluasi belum tiba, tanpa badge yang menyesatkan', () => {
    const html = renderToStaticMarkup(
      createElement(EvaluationScreen, {
        evaluation: null,
        onPlayAgain: vi.fn(),
        onBackToResults: vi.fn(),
      }),
    );

    expect(html).toContain('AI sedang menyusun evaluasi…');
    expect(html).not.toContain('Ringkasan otomatis (bukan AI)');
  });

  it('soal benar yang dibuka menampilkan penjelasan dan sumber', () => {
    const question = evaluation.questions[0]!;
    const html = renderToStaticMarkup(
      createElement(EvalItem, {
        questionNumber: 1,
        stem: question.stem,
        explanation: question.explanation,
        sources: question.sources,
        wrong: false,
        open: true,
        onToggle: vi.fn(),
      }),
    );

    expect(html).toContain('Penjelasan buatan tim.');
    expect(html).toContain('Sumber uji — BMKG');
  });

  it('menyediakan tombol kembali ke hasil', () => {
    const html = renderToStaticMarkup(
      createElement(EvaluationScreen, {
        evaluation,
        onPlayAgain: vi.fn(),
        onBackToResults: vi.fn(),
      }),
    );
    expect(html).toContain('Kembali ke hasil');
  });
});
