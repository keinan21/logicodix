import { useEffect, useState } from 'react';
import { Lane } from '../components/Lane';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerOption } from '../components/AnswerOption';
import { CountdownRing } from '../components/CountdownRing';
import type { RaceFeedback, RoomState } from '../../shared/schema';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

/**
 * Layar Balapan (DESIGN §3 screen 4; FR-B02..B08).
 * - Pilihan A–D, keyboard A/B/C/D & 1–4 (DESIGN §8).
 * - Benar: ✓ 1 detik lalu soal berikutnya. Salah: kunci hijau, penjelasan + sumber, lock 5 detik (FR-B05).
 * - Kunci/penjelasan/sumber hanya dari race:feedback setelah menjawab (FR-K11).
 * TODO(T-09): animasi lintasan (motion-step, bob, parallax, tunas 🌱).
 */
export function RaceScreen({
  state,
  feedback,
}: {
  state: RoomState | null;
  feedback: RaceFeedback | null;
}) {
  // Lock dihitung dari lockEndsAtMs server (countdown tampilan UI saja; keputusan game tetap di server).
  const [lockRemaining, setLockRemaining] = useState<number | undefined>(undefined);
  const lockEndsAtMs = feedback?.lockEndsAtMs;

  useEffect(() => {
    if (lockEndsAtMs === undefined) {
      setLockRemaining(undefined);
      return;
    }
    const update = () => {
      const s = Math.ceil((lockEndsAtMs - Date.now()) / 1000);
      setLockRemaining(s > 0 ? s : undefined);
    };
    update();
    const t = setInterval(update, 250);
    return () => clearInterval(t);
  }, [lockEndsAtMs]);

  const q = state?.activeQuestion;
  const questionNumber = (state?.questionIndex ?? 0) + 1;

  // Pilihan sudah pernah dijawab → nonaktif (FR-B03)
  const answered = feedback !== null;

  useEffect(() => {
    if (!q) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = {
        a: 0,
        b: 1,
        c: 2,
        d: 3,
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
      };
      const idx = map[e.key.toLowerCase()];
      if (idx !== undefined && !answered) {
        // TODO(T-09): emit race:answer {questionIndex, choice}
        void idx;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, answered]);

  return (
    <main className="screen">
      <div className="screen-inner">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ font: 'var(--text-label)' }}>Soal {questionNumber}</span>
          <span style={{ font: 'var(--text-label)' }}>
            Sisa {/* TODO(T-09): format m:ss dari state.timeLeftS */} {state?.timeLeftS ?? '--'}
          </span>
        </header>

        <section aria-label="Lintasan">
          {(state?.participants ?? []).map((p) => (
            <Lane key={p.id} participant={p} steps={p.steps} />
          ))}
        </section>

        {q ? (
          <QuestionCard
            question={q}
            displayNumber={questionNumber}
            explanation={feedback && !feedback.correct ? feedback.explanation : undefined}
            sources={feedback && !feedback.correct ? feedback.sources : undefined}
            lockRemainingS={lockRemaining}
          />
        ) : null}

        <div
          style={{ display: 'grid', gap: 'var(--space-2)' }}
          role="group"
          aria-label="Pilihan jawaban"
        >
          {q?.options.map((text, i) => {
            const letter = LETTERS[i] ?? 'A';
            let optionState: 'default' | 'correct' | 'wrong' | 'dimmed' = 'default';
            if (feedback && !feedback.correct) {
              if (feedback.answerIndex === i) optionState = 'correct';
              else optionState = 'dimmed';
            }
            return (
              <AnswerOption
                key={i}
                letter={letter}
                text={text}
                state={optionState}
                disabled={answered}
                onSelect={() => {
                  // TODO(T-09): emit race:answer
                }}
              />
            );
          })}
        </div>

        {lockRemaining !== undefined ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <CountdownRing remaining={lockRemaining} total={5} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
