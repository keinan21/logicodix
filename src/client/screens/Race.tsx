import { useEffect, useState } from 'react';
import { GAME } from '../../shared/constants';
import { Lane } from '../components/Lane';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerOption, type AnswerOptionState } from '../components/AnswerOption';
import { CountdownRing } from '../components/CountdownRing';
import { Button } from '../components/Button';
import type {
  QuestionPublic,
  RaceAnswerPayload,
  RaceFeedback,
  RoomState,
} from '../../shared/schema';
import './Race.css';

const LETTERS = ['A', 'B', 'C', 'D'] as const;
type Letter = (typeof LETTERS)[number];

const KEY_TO_LETTER: Record<string, Letter> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
  '1': 'A',
  '2': 'B',
  '3': 'C',
  '4': 'D',
};

/** m:ss untuk "Sisa" (DESIGN §7). */
function formatClock(totalS: number): string {
  const minutes = Math.floor(totalS / 60);
  const seconds = totalS % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export interface RaceScreenProps {
  state: RoomState;
  feedback: RaceFeedback | null;
  /** Waktu client saat feedback diterima (dipakai untuk masa tahan tampilan). */
  feedbackAtMs: number | null;
  myId: string | null;
  onAnswer: (payload: RaceAnswerPayload) => void;
  /** Lompat ke layar hasil tanpa menunggu bot menyelesaikan sisa balapan. */
  onSkipToResults: () => void;
}

/**
 * Layar Balapan (DESIGN §3 screen 4; FR-B02..B08).
 *
 * Server sudah mengirim soal berikutnya tepat setelah jawaban, jadi layar ini menahan tampilan
 * sejenak supaya umpan balik terbaca: benar → penjelasan sampai 8 dtk dan bisa dilewati dengan
 * tombol "Lanjut" (FR-B04), salah → penjelasan sampai lock 5 dtk habis (FR-B05). Selama tahan,
 * soal yang dijawab tetap tampil beserta kunci/penjelasan dari race:feedback.
 * Kunci tidak pernah datang sebelum menjawab (FR-K11).
 */
export function RaceScreen({
  state,
  feedback,
  feedbackAtMs,
  myId,
  onAnswer,
  onSkipToResults,
}: RaceScreenProps) {
  const me = state.participants.find((p) => p.id === myId) ?? null;
  const active = state.activeQuestion;

  const [lastQuestion, setLastQuestion] = useState<{
    question: QuestionPublic;
    index: number;
  } | null>(null);
  const [hold, setHold] = useState<{ index: number; untilMs: number } | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [myChoice, setMyChoice] = useState<Letter | null>(null);
  const [resultDismissed, setResultDismissed] = useState(false);

  useEffect(() => {
    setResultDismissed(false);
  }, [state.roomId]);

  // Mulai masa tahan saat feedback baru datang.
  useEffect(() => {
    if (!feedback) return;
    const startMs = feedbackAtMs ?? Date.now();
    const untilMs = feedback.correct
      ? startMs + GAME.CORRECT_EXPLANATION_S * 1000
      : (feedback.lockEndsAtMs ?? startMs + GAME.LOCK_DURATION_S * 1000);
    setHold({ index: feedback.questionIndex, untilMs });
  }, [feedback, feedbackAtMs]);

  // Ingat soal yang sedang tampil supaya tetap terlihat selama masa tahan.
  useEffect(() => {
    if (active !== null && hold === null) {
      setLastQuestion({ question: active, index: state.questionIndex });
    }
  }, [active, hold, state.questionIndex]);

  // Jam berjalan lokal: room:state hanya datang saat ada kejadian (bot menjawab, lock habis),
  // jadi "Sisa" dan hitung mundur lock dihitung sendiri dari nilai server terakhir supaya
  // tidak tampak membeku saat tidak ada event.
  const [clockBase, setClockBase] = useState({ left: state.timeLeftS, at: Date.now() });
  useEffect(() => {
    setClockBase({ left: state.timeLeftS, at: Date.now() });
  }, [state.timeLeftS, state.roomId]);
  useEffect(() => {
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  const elapsedS = Math.max(0, Math.floor((nowMs - clockBase.at) / 1000));
  const displayLeftS = Math.max(0, clockBase.left - elapsedS);

  useEffect(() => {
    if (hold !== null && nowMs >= hold.untilMs) setHold(null);
  }, [hold, nowMs]);

  const holding = hold !== null;
  const shown = holding ? (lastQuestion?.question ?? null) : active;
  const shownIndex = holding ? (lastQuestion?.index ?? hold.index) : state.questionIndex;

  // Pilihan baru bisa ditekan saat tidak menahan umpan balik dan peserta masih balapan.
  const canAnswer = !holding && me?.status === 'racing' && shown !== null;

  useEffect(() => {
    setMyChoice(null);
  }, [shownIndex, state.roomId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const letter = KEY_TO_LETTER[event.key.toLowerCase()];
      if (letter === undefined || !canAnswer || shown === null) return;
      event.preventDefault();
      setMyChoice(letter);
      onAnswer({ questionIndex: shownIndex, choice: letter });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canAnswer, onAnswer, shown, shownIndex]);

  const shownFeedback = holding ? feedback : null;
  const wrongFeedback = shownFeedback !== null && !shownFeedback.correct ? shownFeedback : null;
  const correctFlash = holding && feedback?.correct === true;

  const lockRemainingS =
    wrongFeedback?.lockEndsAtMs !== undefined
      ? Math.max(0, Math.ceil((wrongFeedback.lockEndsAtMs - nowMs) / 1000))
      : undefined;

  const optionState = (index: number): AnswerOptionState => {
    if (wrongFeedback === null) return 'default';
    if (wrongFeedback.answerIndex === index) return 'correct';
    if (myChoice !== null && LETTERS.indexOf(myChoice) === index) return 'wrong';
    return 'dimmed';
  };

  const spectatorStatus =
    me === null || me.status === 'racing' || me.status === 'locked' ? null : me.status;

  return (
    <main className="screen race-screen">
      <div className="screen-inner race-layout">
        <header className="race-header">
          <span className="race-meta">
            Soal {shown !== null ? shownIndex + 1 : state.questionIndex + 1}
          </span>
          <span className="race-meta">Sisa {formatClock(displayLeftS)}</span>
        </header>

        <section className="race-track" aria-label="Lintasan">
          {state.participants.map((p) => (
            <Lane key={p.id} participant={p} steps={p.steps} />
          ))}
        </section>

        {spectatorStatus !== null && !resultDismissed ? (
          <section
            className="race-result"
            role="dialog"
            aria-modal="true"
            aria-labelledby="race-result-title"
          >
            <h2 id="race-result-title" className="race-result-title">
              {spectatorStatus === 'finished'
                ? `Finish! Posisi ke-${me?.finishOrder ?? '–'}`
                : spectatorStatus === 'outOfQuestions'
                  ? 'Soalmu habis'
                  : 'Kamu keluar'}
            </h2>
            <p className="race-result-text">
              Balapan masih berjalan. Mau menonton sisanya atau langsung melihat hasil?
            </p>
            <div className="race-result-actions">
              <Button variant="secondary" onClick={() => setResultDismissed(true)}>
                Tonton sisa balapan
              </Button>
              <Button onClick={onSkipToResults}>Lihat hasil sekarang</Button>
            </div>
          </section>
        ) : null}

        {spectatorStatus !== null && resultDismissed ? (
          <p className="race-banner" role="status">
            {spectatorStatus === 'finished'
              ? `Finish! Posisi ke-${me?.finishOrder ?? '–'}`
              : spectatorStatus === 'outOfQuestions'
                ? 'Soal habis'
                : 'Keluar'}
            <span className="race-banner-sub"> Menonton sisa balapan…</span>
            <span className="race-banner-action">
              <Button variant="secondary" onClick={onSkipToResults}>
                Lihat hasil
              </Button>
            </span>
          </p>
        ) : null}

        {shown !== null && spectatorStatus === null ? (
          <QuestionCard
            question={shown}
            displayNumber={shownIndex + 1}
            explanation={shownFeedback?.explanation}
            sources={shownFeedback?.sources}
            lockRemainingS={lockRemainingS}
            correct={shownFeedback?.correct}
            onSkipExplanation={() => setHold(null)}
          />
        ) : null}

        {correctFlash ? (
          <p className="race-flash" role="status" aria-live="assertive">
            <span aria-hidden="true">✓</span> Benar!
          </p>
        ) : null}

        {wrongFeedback ? (
          <p className="race-flash race-flash-wrong" role="status" aria-live="assertive">
            <span aria-hidden="true">✗</span> Salah
          </p>
        ) : null}

        {shown !== null && spectatorStatus === null ? (
          <>
            <div className="race-options" role="group" aria-label="Pilihan jawaban">
              {shown.options.map((text, index) => {
                const letter = LETTERS[index];
                if (letter === undefined) return null;
                return (
                  <AnswerOption
                    key={letter}
                    letter={letter}
                    text={text}
                    state={optionState(index)}
                    disabled={!canAnswer}
                    onSelect={() => {
                      if (!canAnswer) return;
                      setMyChoice(letter);
                      onAnswer({ questionIndex: shownIndex, choice: letter });
                    }}
                  />
                );
              })}
            </div>
            <p className="race-hint">Tekan A–D atau 1–4 untuk menjawab.</p>
          </>
        ) : null}

        {lockRemainingS !== undefined ? (
          <div className="race-lock">
            <CountdownRing remaining={lockRemainingS} total={GAME.LOCK_DURATION_S} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
