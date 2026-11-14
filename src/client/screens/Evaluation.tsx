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
}

/**
 * Layar Evaluasi (DESIGN §3 screen 6; FR-H02..H05, FR-H12, FR-H13).
 * - Daftar soal disusun server dari kunci (bukan AI). Salah terbuka otomatis, benar tertutup.
 * - Bagian AI dengan badge; bila gagal → ringkasan otomatis berlabel "bukan AI".
 * - "Baca lebih lanjut" hanya memuat sumber terverifikasi dari soal yang dijawab; AI tidak membuat tautan.
 */
export function EvaluationScreen({ evaluation, onPlayAgain }: EvaluationScreenProps) {
  /**
   * Buka/tutup akordeon. `null` = ikut bawaan (soal salah terbuka, soal benar tertutup).
   * Soal salah juga bisa ditutup pengguna, jadi state ini menyimpan pilihan eksplisit.
   */
  const [openOverrides, setOpenOverrides] = useState<Map<string, boolean>>(new Map());
  const questions = evaluation?.questions ?? [];
  const ai = evaluation?.aiSection ?? null;
  const loading = evaluation === null;

  const toggle = (id: string, defaultOpen: boolean) => {
    setOpenOverrides((prev) => {
      const next = new Map(prev);
      next.set(id, !(prev.get(id) ?? defaultOpen));
      return next;
    });
  };

  const badge = evaluation?.badge ?? 'ringkasan-otomatis-bukan-ai';
  const sources = Array.from(
    new Map(
      questions.flatMap((question) => question.sources).map((source) => [source.url, source]),
    ).values(),
  );

  return (
    <main className="screen">
      <div className="screen-inner evaluation">
        <div className="plank">
          <h1 className="plank-title">Evaluasimu</h1>
        </div>

        <section aria-labelledby="eval-questions">
          <h2 id="eval-questions" className="evaluation-heading">
            Soal yang kamu jawab
          </h2>
          <ul className="eval-list">
            {questions.map((question, index) => {
              const wrong = question.chosenIndex !== question.answerIndex;
              // Soal salah terbuka otomatis (FR-H02), tapi tetap bisa ditutup pengguna.
              const open = openOverrides.get(question.questionId) ?? wrong;
              return (
                <EvalItem
                  key={question.questionId}
                  questionNumber={index + 1}
                  stem={question.stem}
                  chosenLetter={wrong ? LETTERS[question.chosenIndex] : undefined}
                  answerLetter={wrong ? LETTERS[question.answerIndex] : undefined}
                  explanation={wrong ? question.explanation : undefined}
                  sources={wrong ? question.sources : undefined}
                  wrong={wrong}
                  open={open}
                  onToggle={() => toggle(question.questionId, wrong)}
                />
              );
            })}
          </ul>
        </section>

        <AIPanel
          content={ai ? { pattern: ai.pattern, tip: ai.tip, motivation: ai.motivation } : null}
          badge={badge}
          loading={loading}
        />

        {sources.length > 0 ? (
          <section aria-labelledby="baca-lebih-lanjut" className="card evaluation-sources">
            <h2 id="baca-lebih-lanjut" className="evaluation-heading">
              Baca lebih lanjut
            </h2>
            {sources.map((source) => (
              <p key={source.url} className="evaluation-source-link">
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.judul} — {source.lembaga}
                </a>
              </p>
            ))}
          </section>
        ) : null}

        <div className="evaluation-actions">
          <Button variant="primary" onClick={onPlayAgain}>
            Main lagi
          </Button>
        </div>
      </div>
    </main>
  );
}
