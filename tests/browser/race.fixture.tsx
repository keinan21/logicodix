import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RaceScreen } from '../../src/client/screens/Race';
import { GAME } from '../../src/shared/constants';
import type { RaceAnswerPayload, RaceFeedback, RoomState } from '../../src/shared/schema';
import '../../src/client/styles.css';

const question = {
  stem: 'Pilih jawaban untuk soal contoh ini.',
  claim: 'Klaim contoh untuk pengujian tampilan, bukan materi pembelajaran.',
  options: [
    'Pilihan pertama',
    'Pilihan kedua dengan teks yang lebih panjang',
    'Pilihan ketiga',
    'Pilihan keempat',
  ],
};
const initial: RoomState = {
  roomId: 'preview-race',
  phase: 'racing',
  timeLeftS: 161,
  questionIndex: 0,
  activeQuestion: question,
  finishOrder: [],
  participants: [
    {
      id: 'me',
      nickname: 'Raka',
      animalId: 'harimau',
      isBot: false,
      slot: 1,
      steps: 2,
      status: 'racing',
    },
    {
      id: 'other',
      nickname: 'Dina',
      animalId: 'penyu',
      isBot: false,
      slot: 2,
      steps: 1,
      status: 'racing',
    },
    {
      id: 'bot1',
      nickname: 'BOT Kilat',
      animalId: 'badak',
      isBot: true,
      slot: 3,
      steps: 3,
      status: 'racing',
    },
    {
      id: 'bot2',
      nickname: 'BOT Santai',
      animalId: 'gajah',
      isBot: true,
      slot: 4,
      steps: 0,
      status: 'racing',
    },
  ],
};

function Fixture() {
  const [answerError, setAnswerError] = useState<{ pesan: string } | null>(null);
  const [state, setState] = useState(initial);
  const [feedback, setFeedback] = useState<RaceFeedback | null>(null);
  const [feedbackAtMs, setFeedbackAtMs] = useState<number | null>(null);
  const [answers, setAnswers] = useState<RaceAnswerPayload[]>([]);
  const respond = (correct: boolean, finish = false) => {
    const now = Date.now();
    setFeedbackAtMs(now);
    setFeedback({
      questionIndex: state.questionIndex,
      correct,
      answerIndex: 1,
      explanation: 'Penjelasan contoh setelah jawaban diterima.',
      sources: [],
      ...(correct ? {} : { lockEndsAtMs: now + GAME.LOCK_DURATION_S * 1000 }),
    });
    setState((previous) => ({
      ...previous,
      questionIndex: previous.questionIndex + 1,
      activeQuestion: finish ? null : { ...question, stem: 'Soal berikutnya.' },
      participants: previous.participants.map((p) =>
        p.id === 'me' && correct
          ? finish
            ? { ...p, steps: GAME.STEPS_TO_FINISH, status: 'finished', finishOrder: 1 }
            : { ...p, steps: p.steps + 1 }
          : p,
      ),
    }));
  };
  return (
    <>
      <RaceScreen
        answerError={answerError}
        state={state}
        feedback={feedback}
        feedbackAtMs={feedbackAtMs}
        myId="me"
        onAnswer={(answer) => {
          setAnswerError(null);
          setAnswers((previous) => [...previous, answer]);
        }}
        onSkipToResults={() => {}}
      />
      <aside aria-label="Kontrol pengujian">
        <output aria-label="Jumlah kiriman">{answers.length}</output>
        <button onClick={() => setAnswerError({ pesan: 'Jawaban tidak valid.' })}>
          Tolak jawaban
        </button>
        <button onClick={() => respond(false)}>Respons salah</button>
        <button onClick={() => respond(true)}>Respons benar</button>
        <button onClick={() => respond(true, true)}>Respons benar terakhir</button>
        <button
          onClick={() =>
            setState((previous) => ({
              ...previous,
              activeQuestion: null,
              participants: previous.participants.map((p) =>
                p.id === 'me'
                  ? { ...p, steps: GAME.STEPS_TO_FINISH, status: 'finished', finishOrder: 1 }
                  : p,
              ),
            }))
          }
        >
          Simulasikan finish
        </button>
        <button
          onClick={() =>
            setState((previous) => ({
              ...previous,
              activeQuestion: null,
              participants: previous.participants.map((p) =>
                p.id === 'me' ? { ...p, status: 'outOfQuestions' } : p,
              ),
            }))
          }
        >
          Simulasikan soal habis
        </button>
      </aside>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
