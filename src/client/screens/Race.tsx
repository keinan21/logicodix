import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME } from '../../shared/constants';
import { Lane } from '../components/Lane';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerOption, type AnswerOptionState } from '../components/AnswerOption';
import { Button } from '../components/Button';
import { RaceResultDialog } from './RaceResultDialog';
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
  answerError?: { pesan: string } | null;
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
 * sejenak supaya umpan balik terbaca: benar "Benar!" 1 dtk (FR-B04), salah sampai lock 5 dtk habis
 * (FR-B05). Selama tahan, soal yang dijawab tetap tampil beserta kunci/penjelasan dari race:feedback.
 * Kunci tidak pernah datang sebelum menjawab (FR-K11).
 */
export function RaceScreen({
  answerError = null,
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
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [myChoice, setMyChoice] = useState<Letter | null>(null);
  const submitted = useRef(false);
  useEffect(() => {
    if (answerError) {
      setMyChoice(null);
      submitted.current = false;
    }
  }, [answerError]);
  const [resultDismissed, setResultDismissed] = useState(false);
  const watchActions = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (resultDismissed) watchActions.current?.querySelector('button')?.focus();
  }, [resultDismissed]);

  useEffect(() => {
    setResultDismissed(false);
  }, [state.roomId]);

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

  // Derive the feedback hold in the same render as new server props, so the next
  // question cannot briefly reset the selected answer before feedback is shown.
  const untilMs = feedback?.correct
    ? (feedbackAtMs ?? 0) + GAME.CORRECT_FLASH_S * 1000
    : (feedback?.lockEndsAtMs ?? 0);
  const holding =
    feedback !== null && feedback.questionIndex === lastQuestion?.index && nowMs < untilMs;
  const waiting = myChoice !== null && feedback?.questionIndex !== lastQuestion?.index;
  const retainQuestion = holding || waiting;
  const shown = retainQuestion ? (lastQuestion?.question ?? null) : active;
  const shownIndex = retainQuestion
    ? (lastQuestion?.index ?? state.questionIndex)
    : state.questionIndex;

  // Pilihan baru bisa ditekan saat tidak menahan umpan balik dan peserta masih balapan.
  const canAnswer = !holding && myChoice === null && me?.status === 'racing' && shown !== null;

  useEffect(() => {
    setMyChoice(null);
    submitted.current = false;
  }, [shownIndex, state.roomId]);

  const selectAnswer = useCallback(
    (letter: Letter) => {
      if (!canAnswer || submitted.current || shown === null) return;
      submitted.current = true;
      setLastQuestion({ question: shown, index: shownIndex });
      setMyChoice(letter);
      onAnswer({ questionIndex: shownIndex, choice: letter });
    },
    [canAnswer, onAnswer, shown, shownIndex],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const letter = KEY_TO_LETTER[event.key.toLowerCase()];
      if (
        letter === undefined ||
        !canAnswer ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, select, [contenteditable="true"]')
      )
        return;
      event.preventDefault();
      selectAnswer(letter);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canAnswer, selectAnswer]);

  const wrongFeedback = holding && feedback !== null && !feedback.correct ? feedback : null;
  const correctFlash = holding && feedback?.correct === true;

  const lockRemainingS =
    wrongFeedback?.lockEndsAtMs !== undefined
      ? Math.max(0, Math.ceil((wrongFeedback.lockEndsAtMs - nowMs) / 1000))
      : undefined;

  const optionState = (index: number): AnswerOptionState => {
    if (correctFlash && myChoice === LETTERS[index]) return 'correct';
    if (wrongFeedback === null) return myChoice === LETTERS[index] ? 'selected-waiting' : 'default';
    if (wrongFeedback.answerIndex === index) return 'correct';
    if (myChoice !== null && LETTERS.indexOf(myChoice) === index) return 'wrong';
    return 'dimmed';
  };

  const spectatorStatus =
    ((holding || waiting) && me?.status !== 'left') ||
    me === null ||
    me.status === 'racing' ||
    me.status === 'locked'
      ? null
      : me.status;

  return (
    <main className="screen race-screen">
      <div className="race-layout">
        <header className="race-header">
          <h1 className="race-meta">
            Soal {shown !== null ? shownIndex + 1 : state.questionIndex + 1}
          </h1>
          <div className="race-header-status">
            {spectatorStatus !== null && <span className="race-spectating">Menonton</span>}
            <span className="race-time">Sisa {formatClock(displayLeftS)}</span>
          </div>
        </header>

        <section className="race-track" aria-label="Lintasan">
          <div className="race-scenery" aria-hidden="true" />
          {state.participants.map((p) => (
            <Lane
              key={p.id}
              participant={p}
              steps={p.steps}
              correct={p.id === myId && correctFlash}
            />
          ))}
        </section>

        <div className="race-content">
          {answerError ? (
            <p role="alert" className="race-answer-error">
              {answerError.pesan} Silakan pilih jawaban lagi.
            </p>
          ) : null}
          {spectatorStatus !== null && !resultDismissed ? (
            <RaceResultDialog
              title={
                spectatorStatus === 'finished'
                  ? `Finish! Posisi ke-${me?.finishOrder ?? '–'}`
                  : spectatorStatus === 'outOfQuestions'
                    ? 'Soalmu habis'
                    : 'Kamu keluar'
              }
              onWatch={() => setResultDismissed(true)}
              onResults={onSkipToResults}
            />
          ) : null}

          {spectatorStatus !== null && resultDismissed ? (
            <p className="race-banner" role="status">
              {spectatorStatus === 'finished'
                ? `Finish! Posisi ke-${me?.finishOrder ?? '–'}`
                : spectatorStatus === 'outOfQuestions'
                  ? 'Soal habis'
                  : 'Keluar'}
              <span className="race-banner-sub"> Menonton sisa balapan…</span>
              <span className="race-banner-action" ref={watchActions}>
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
              explanation={wrongFeedback?.explanation}
              sources={wrongFeedback?.sources}
              lockRemainingS={lockRemainingS}
            />
          ) : null}

          {correctFlash ? (
            <p className="visually-hidden" role="status" aria-live="assertive">
              <span aria-hidden="true">✓</span> Benar!
            </p>
          ) : null}

          {shown !== null && spectatorStatus === null ? (
            <>
              <div className="race-options" role="group" aria-label="Pilihan jawaban">
                {shown.options.map((text, index) => {
                  const letter = LETTERS[index];
                  if (letter === undefined) return null;
                  return (
                    <div className="race-option-cell" key={letter}>
                      <AnswerOption
                        letter={letter}
                        text={text}
                        state={optionState(index)}
                        disabled={!canAnswer}
                        onSelect={selectAnswer}
                      />
                      <kbd className="race-shortcut" aria-hidden="true">
                        {letter} / {index + 1}
                      </kbd>
                    </div>
                  );
                })}
              </div>
              <p className="race-hint" role="status">
                {waiting
                  ? 'Jawaban terkirim. Menunggu respons…'
                  : wrongFeedback
                    ? 'Jawaban belum tepat. Baca penjelasannya sebelum lanjut.'
                    : correctFlash
                      ? 'Benar! Hewanmu maju satu langkah.'
                      : 'Pilih satu jawaban. Tekan A–D atau 1–4 untuk menjawab.'}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
