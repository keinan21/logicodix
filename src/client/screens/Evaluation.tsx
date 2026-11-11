import { useState } from 'react';
import { AIPanel } from '../components/AIPanel';
import { EvalItem } from '../components/EvalItem';
import { Button } from '../components/Button';
import type { EvalReady } from '../../shared/schema';
import './Evaluation.css';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export interface EvaluationScreenProps {
  evaluation: EvalReady | null;
  onPlayAgain: () => void;
  onBackToResults: () => void;
}

/**
 * Layar Evaluasi (DESIGN §3 screen 6; FR-H02..H05, FR-H12, FR-H13).
 * - Daftar soal disusun server dari kunci (bukan AI). Salah terbuka otomatis, benar tertutup.
 * - Bagian AI dengan badge; bila gagal → ringkasan otomatis berlabel "bukan AI".
 * - "Baca lebih lanjut" hanya memuat sumber terverifikasi dari soal yang dijawab; AI tidak membuat tautan.
 */
export function EvaluationScreen({
  evaluation,
  onPlayAgain,
  onBackToResults,
}: EvaluationScreenProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const questions = evaluation?.questions ?? [];
  const ai = evaluation?.aiSection ?? null;
  const loading = evaluation === null || evaluation.badge === null;

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const badge = evaluation?.badge ?? null;
  const sources = Array.from(
    new Map(
      questions.flatMap((question) => question.sources).map((source) => [source.url, source]),
    ).values(),
  );

  return (
    <main className="screen evaluation-screen">
      <header className="evaluation-header">
        <h1>Evaluasimu</h1>
      </header>
      <div className="screen-inner evaluation-inner">
        <div className="evaluation-columns">
          <section aria-labelledby="eval-questions" className="evaluation-questions">
            <h2
              id="eval-questions"
              style={{ font: 'var(--text-label)', color: 'var(--color-muted)' }}
            >
              Soal yang kamu jawab
            </h2>
            {questions.length === 0 ? (
              <p role="status">
                {evaluation === null
                  ? 'Menunggu riwayat jawaban…'
                  : 'Belum ada soal yang kamu jawab.'}
              </p>
            ) : null}
            <ul
              style={{
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              {questions.map((question, index) => {
                const wrong = question.chosenIndex !== question.answerIndex;
                // Soal salah terbuka otomatis (FR-H02)
                const open = wrong !== openIds.has(question.questionId);
                return (
                  <EvalItem
                    key={question.questionId}
                    questionNumber={index + 1}
                    stem={question.stem}
                    claim={question.claim ?? undefined}
                    chosenText={question.options[question.chosenIndex]}
                    answerText={question.options[question.answerIndex]}
                    chosenLetter={wrong ? LETTERS[question.chosenIndex] : undefined}
                    answerLetter={wrong ? LETTERS[question.answerIndex] : undefined}
                    explanation={question.explanation}
                    sources={question.sources}
                    wrong={wrong}
                    open={open}
                    onToggle={() => toggle(question.questionId)}
                  />
                );
              })}
            </ul>
          </section>

          <div className="evaluation-summary">
            <AIPanel
              content={ai ? { pattern: ai.pattern, tip: ai.tip, motivation: ai.motivation } : null}
              badge={badge}
              loading={loading}
            />

            {sources.length > 0 ? (
              <section aria-labelledby="baca-lebih-lanjut" className="card">
                <h2 id="baca-lebih-lanjut" style={{ font: 'var(--text-label)' }}>
                  Baca lebih lanjut
                </h2>
                <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', font: 'var(--text-small)' }}>
                  {sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--color-forest-700)' }}
                      >
                        {source.judul} — {source.lembaga}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="evaluation-actions">
              <Button variant="secondary" onClick={onBackToResults}>
                Kembali ke hasil
              </Button>
              <Button variant="primary" onClick={onPlayAgain}>
                Main lagi
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
