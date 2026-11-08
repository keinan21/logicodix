import { useState } from 'react';
import { AIPanel } from '../components/AIPanel';
import { EvalItem } from '../components/EvalItem';
import { Button } from '../components/Button';
import type { EvalReady } from '../../shared/schema';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

/**
 * Layar Evaluasi (DESIGN §3 screen 6; FR-H02..H05, FR-H12, FR-H13).
 * - Daftar soal disusun server dari kunci (bukan AI). Salah terbuka otomatis, benar tertutup.
 * - Bagian AI dengan badge; bila gagal → ringkasan otomatis berlabel "bukan AI".
 */
export function EvaluationScreen({
  evaluation,
  onPlayAgain,
}: {
  evaluation: EvalReady | null;
  onPlayAgain: () => void;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const questions = evaluation?.questions ?? [];
  const ai = evaluation?.aiSection;

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const badge = evaluation?.badge ?? 'ringkasan-otomatis-bukan-ai';

  return (
    <main className="screen">
      <div className="screen-inner">
        <h1 style={{ font: 'var(--text-title)', color: 'var(--color-forest-900)' }}>Evaluasimu</h1>

        <section aria-labelledby="eval-questions">
          <h2
            id="eval-questions"
            style={{ font: 'var(--text-label)', color: 'var(--color-muted)' }}
          >
            Soal yang kamu jawab
          </h2>
          <ul
            style={{
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            {questions.map((q, i) => {
              const wrong = q.chosenIndex !== q.answerIndex;
              // Soal salah terbuka otomatis (FR-H02)
              const open = wrong || openIds.has(q.questionId);
              return (
                <EvalItem
                  key={q.questionId}
                  questionNumber={i + 1}
                  stem={q.stem}
                  chosenLetter={wrong ? LETTERS[q.chosenIndex] : undefined}
                  answerLetter={wrong ? LETTERS[q.answerIndex] : undefined}
                  explanation={wrong ? q.explanation : undefined}
                  sources={wrong ? q.sources : undefined}
                  wrong={wrong}
                  open={open}
                  onToggle={() => toggle(q.questionId)}
                />
              );
            })}
          </ul>
        </section>

        <AIPanel
          content={ai ? { pattern: ai.pattern, tip: ai.tip, motivation: ai.motivation } : null}
          badge={badge}
          loading={ai === null}
        />

        {ai?.motivation ? (
          <section aria-labelledby="baca-lebih-lanjut" className="card">
            <h2 id="baca-lebih-lanjut" style={{ font: 'var(--text-label)' }}>
              Baca lebih lanjut
            </h2>
            {/* TODO(T-16): daftar sumber terverifikasi dari soal yang dijawab (FR-H04). AI tidak membuat tautan. */}
          </section>
        ) : null}

        <div>
          <Button variant="primary" onClick={onPlayAgain}>
            Main lagi
          </Button>
        </div>
      </div>
    </main>
  );
}
