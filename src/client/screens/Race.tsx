import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME } from '../../shared/constants';
import { Lane } from '../components/Lane';
import { QuestionCard } from '../components/QuestionCard';
import { FeedbackSheet } from '../components/FeedbackSheet';
import { AnswerOption, type AnswerOptionState } from '../components/AnswerOption';
import { Button } from '../components/Button';
import { RaceResultDialog } from './RaceResultDialog';
import type {
  QuestionPublic,
  RaceAnswerPayload,
  RaceEnd,
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
  /** Peringkat akhir dari server; ada = balapan sudah berakhir untuk semua. */
  raceEnd?: RaceEnd | null;
  /** Jeda / lanjut (server hanya menerima di room satu manusia lawan bot). */
  onPause?: (paused: boolean) => void;
  /** Keluar dari balapan lalu kembali ke beranda. */
  onLeave?: () => void;
}

/** Ringkasan hasil untuk dialog akhir balapan: menang, kalah, atau alasan berhenti. */
function describeOutcome(
  raceEnd: RaceEnd,
  myNickname: string | undefined,
  timeUp: boolean,
): { title: string; text: string } {
  const mine = raceEnd.ranking.find((row) => row.nickname === myNickname);
  if (!mine) return { title: 'Balapan selesai', text: 'Lihat hasil lengkapnya.' };
  if (mine.status === 'left') return { title: 'Kamu keluar', text: 'Balapan ini sudah selesai.' };
  if (mine.status === 'finished') {
    return mine.rank === 1
      ? { title: 'Kamu juara 1!', text: 'Kamu finish paling depan. Lihat hasilnya.' }
      : { title: `Finish di posisi ${mine.rank}`, text: 'Balapan selesai. Lihat hasilnya.' };
  }
  if (mine.status === 'outOfQuestions') {
    return { title: 'Kamu kalah', text: 'Soalmu habis sebelum sampai garis finish.' };
  }
  return {
    title: 'Kamu kalah',
    text: timeUp
      ? 'Waktu habis sebelum kamu sampai garis finish.'
      : 'Semua lawan sudah finish lebih dulu.',
  };
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
  answerError = null,
  state,
  feedback,
  feedbackAtMs,
  myId,
  onAnswer,
  onSkipToResults,
  raceEnd = null,
  onPause,
  onLeave,
}: RaceScreenProps) {
  const me = state.participants.find((p) => p.id === myId) ?? null;
  const myNickname = me?.nickname;
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
  /** Tombol "Lanjut" melewati masa baca penjelasan jawaban benar (FR-B04). */
  const [holdSkipped, setHoldSkipped] = useState(false);
  const watchActions = useRef<HTMLSpanElement>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const paused = state.paused === true;
  const soloVsBot = state.participants.filter((p) => !p.isBot).length === 1;

  useEffect(() => {
    if (resultDismissed) watchActions.current?.querySelector('button')?.focus();
  }, [resultDismissed]);

  useEffect(() => {
    setResultDismissed(false);
  }, [state.roomId]);

  // Feedback baru = masa baca baru; tombol "Lanjut" hanya berlaku untuk feedback itu.
  useEffect(() => {
    setHoldSkipped(false);
  }, [feedback]);

  // Jam berjalan lokal: room:state hanya datang saat ada kejadian (bot menjawab, lock habis),
  // jadi "Sisa" dan hitung mundur lock dihitung sendiri dari nilai server terakhir supaya
  // tidak tampak membeku saat tidak ada event.
  const [clockBase, setClockBase] = useState({ left: state.timeLeftS, at: Date.now() });
  useEffect(() => {
    setClockBase({ left: state.timeLeftS, at: Date.now() });
  }, [state.timeLeftS, state.roomId]);
  useEffect(() => {
    if (paused) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 200);
    return () => clearInterval(id);
  }, [paused]);
  const elapsedS = paused ? 0 : Math.max(0, Math.floor((nowMs - clockBase.at) / 1000));
  const displayLeftS = Math.max(0, clockBase.left - elapsedS);

  // Derive the feedback hold in the same render as new server props, so the next
  // question cannot briefly reset the selected answer before feedback is shown.
  const untilMs = feedback?.correct
    ? (feedbackAtMs ?? 0) + GAME.CORRECT_EXPLANATION_S * 1000
    : (feedback?.lockEndsAtMs ?? 0);
  const holding =
    feedback !== null &&
    feedback.questionIndex === lastQuestion?.index &&
    nowMs < untilMs &&
    !holdSkipped;
  const waiting = myChoice !== null && feedback?.questionIndex !== lastQuestion?.index;
  const retainQuestion = holding || waiting;
  const shown = retainQuestion ? (lastQuestion?.question ?? null) : active;
  const shownIndex = retainQuestion
    ? (lastQuestion?.index ?? state.questionIndex)
    : state.questionIndex;

  // Pilihan baru bisa ditekan saat tidak menahan umpan balik dan peserta masih balapan.
  const canAnswer =
    !holding &&
    !paused &&
    raceEnd === null &&
    myChoice === null &&
    me?.status === 'racing' &&
    shown !== null;

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

  const holdRemainingS = Math.max(0, Math.ceil((untilMs - nowMs) / 1000));
  const sheetFeedback = holding ? feedback : null;

  const askQuit = () => {
    if (soloVsBot && me?.status !== 'left') onPause?.(true);
    setConfirmQuit(true);
  };
  const cancelQuit = () => {
    setConfirmQuit(false);
    if (soloVsBot) onPause?.(false);
  };

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
          <Button
            variant="secondary"
            className="race-nav"
            onClick={askQuit}
            aria-label="Keluar dari balapan"
          >
            <span aria-hidden="true">←</span> Keluar
          </Button>
          <div className="race-header-status">
            {spectatorStatus !== null && <span className="race-spectating">Menonton</span>}
            <span className="race-time">Sisa {formatClock(displayLeftS)}</span>
            {soloVsBot && onPause && (me?.status === 'racing' || me?.status === 'locked') ? (
              <Button
                variant="secondary"
                className="race-nav"
                onClick={() => onPause(true)}
                aria-label="Jeda balapan"
              >
                <span aria-hidden="true">❚❚</span> Jeda
              </Button>
            ) : null}
          </div>
        </header>

        <section className="race-track" aria-label="Lintasan">
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
          {raceEnd !== null ? (
            <RaceResultDialog
              {...describeOutcome(raceEnd, myNickname, displayLeftS === 0)}
              actions={[
                { label: 'Lihat hasil', onClick: onSkipToResults, variant: 'primary' },
                ...(onLeave ? [{ label: 'Ke beranda', onClick: onLeave }] : []),
              ]}
            />
          ) : confirmQuit ? (
            <RaceResultDialog
              title="Keluar dari balapan?"
              text={
                spectatorStatus === null
                  ? 'Kamu dihitung keluar dan tidak bisa kembali ke balapan ini.'
                  : 'Kamu tidak akan melihat hasil dan evaluasi balapan ini.'
              }
              onCancel={cancelQuit}
              actions={[
                { label: 'Tetap main', onClick: cancelQuit, variant: 'primary' },
                { label: 'Keluar', onClick: () => onLeave?.() },
              ]}
            />
          ) : paused ? (
            <RaceResultDialog
              title="Balapan dijeda"
              text="Waktu dan lawan berhenti. Lanjut kapan saja."
              onCancel={() => onPause?.(false)}
              actions={[
                { label: 'Lanjut', onClick: () => onPause?.(false), variant: 'primary' },
                { label: 'Keluar', onClick: askQuit },
              ]}
            />
          ) : spectatorStatus !== null && !resultDismissed ? (
            <RaceResultDialog
              title={
                spectatorStatus === 'finished'
                  ? `Finish! Posisi ke-${me?.finishOrder ?? '–'}`
                  : spectatorStatus === 'outOfQuestions'
                    ? 'Soalmu habis'
                    : 'Kamu keluar'
              }
              text="Balapan masih berjalan. Mau menonton sisanya atau langsung melihat hasil?"
              onCancel={() => setResultDismissed(true)}
              actions={[
                { label: 'Tonton sisa balapan', onClick: () => setResultDismissed(true) },
                { label: 'Lihat hasil sekarang', onClick: onSkipToResults, variant: 'primary' },
              ]}
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
            <QuestionCard question={shown} displayNumber={shownIndex + 1} />
          ) : null}

          {shown !== null && spectatorStatus === null ? (
            <>
              <div className="race-options" role="group" aria-label="Pilihan jawaban">
                {shown.options.map((text, index) => {
                  const letter = LETTERS[index];
                  if (letter === undefined) return null;
                  // Saat penjelasan tampil, hanya pilihanmu dan kunci yang tersisa supaya muat satu layar.
                  if (holding && optionState(index) === 'dimmed') return null;
                  return (
                    <AnswerOption
                      key={`${shownIndex}-${letter}`}
                      order={index}
                      letter={letter}
                      text={text}
                      state={optionState(index)}
                      disabled={!canAnswer}
                      onSelect={selectAnswer}
                    />
                  );
                })}
              </div>
              {sheetFeedback !== null ? (
                <FeedbackSheet
                  feedback={sheetFeedback}
                  holdS={sheetFeedback.correct ? GAME.CORRECT_EXPLANATION_S : GAME.LOCK_DURATION_S}
                  remainingS={holdRemainingS}
                  onSkip={correctFlash ? () => setHoldSkipped(true) : undefined}
                />
              ) : (
                <p className="race-hint" role="status">
                  {waiting
                    ? 'Jawaban terkirim. Menunggu respons…'
                    : 'Pilih satu jawaban. Tekan A–D atau 1–4 untuk menjawab.'}
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
