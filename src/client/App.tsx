import { useEffect, useState } from 'react';

import { animalIdSchema, nicknameSchema, type AnimalId } from '../shared/schema';
import { HomeScreen } from './screens/Home';
import { QueueScreen } from './screens/Queue';
import { LobbyScreen } from './screens/Lobby';
import { RaceScreen } from './screens/Race';
import { PodiumScreen } from './screens/Podium';
import { EvaluationScreen } from './screens/Evaluation';
import { ErrorScreen } from './screens/Error';
import { useRoom } from './socket';

/**
 * App — satu state machine untuk alur Beranda → Antre → Lobby → Balapan → Podium → Evaluasi.
 * Fase datang dari room:state server (ARCHITECTURE §4: browser hanya menampilkan state server).
 * Yang disimpan lokal hanya navigasi (antre/evaluasi) dan timer tampilan.
 */
export function App() {
  const { session, joinQueue, leaveQueue, answer, reset } = useRoom();
  const [route, setRoute] = useState<'home' | 'queue' | 'evaluation' | 'result'>('home');
  const [queuedAtMs, setQueuedAtMs] = useState<number | null>(null);
  const [waitingS, setWaitingS] = useState(0);

  // Reconnect membuat entri antrean baru di server; waktu tunggu ikut dimulai ulang.
  useEffect(() => {
    if (route === 'queue' && session.connected && session.state === null) {
      setQueuedAtMs(Date.now());
      setWaitingS(0);
    }
  }, [route, session.connected, session.state]);

  // Lama menunggu antre (FR-M05) — tampilan saja; pencocokan tetap di server.
  useEffect(() => {
    if (route !== 'queue' || queuedAtMs === null) return;
    const tick = () => setWaitingS(Math.floor((Date.now() - queuedAtMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [route, queuedAtMs]);

  const phase = session.state?.phase;

  const me = session.state?.participants.find((p) => p.id === session.myId) ?? null;
  const myNickname = me?.nickname ?? sessionStorage.getItem('nickname') ?? '';

  const join = (nickname: string, animalId: AnimalId, mode: 'quick' | 'bot') => {
    setRoute('queue');
    setQueuedAtMs(Date.now());
    setWaitingS(0);
    joinQueue({ nickname, animalId, mode });
  };

  const cancelQueue = () => {
    leaveQueue();
    setRoute('home');
    setQueuedAtMs(null);
  };

  const playAgain = () => {
    reset();
    const nickname = sessionStorage.getItem('nickname') ?? '';
    const animal = animalIdSchema.safeParse(sessionStorage.getItem('animalId'));
    if (nicknameSchema.safeParse(nickname).success && animal.success) {
      join(nickname, animal.data, 'quick');
      return;
    }
    setRoute('home');
    setQueuedAtMs(null);
  };

  // Koneksi putus: Socket.IO mencoba menyambung sendiri (FR-B11).
  if (session.error?.code === 'resume-expired' || session.error?.code === 'session-not-found') {
    return (
      <ErrorScreen
        code={session.error.code}
        pesan={session.error.pesan}
        retrying={false}
        onPlayAgain={playAgain}
      />
    );
  }
  const awaitingResume =
    session.connected && (phase === 'lobby' || phase === 'racing') && me === null;
  if (((session.everConnected || route === 'queue') && !session.connected) || awaitingResume) {
    return (
      <ErrorScreen
        code="connection"
        pesan="Koneksi terputus, mencoba menyambung lagi…"
        retrying={true}
      />
    );
  }

  if (!session.state) {
    if (route === 'queue' && session.error === null) {
      return (
        <QueueScreen
          waitingS={waitingS}
          found={Math.max(session.found, 1)}
          onCancel={cancelQueue}
        />
      );
    }
    return <HomeScreen joinError={session.error?.pesan ?? null} onJoin={join} />;
  }

  if (phase === 'lobby') {
    return <LobbyScreen state={session.state} countdown={session.state.lobbyCountdownS ?? null} />;
  }

  // "Lihat hasil sekarang": pemain sudah selesai menjawab, jadi layar hasil memakai peringkat
  // sementara dari server (race:standings) dan otomatis berubah final saat race:end tiba.
  if (route === 'result') {
    return (
      <PodiumScreen
        raceEnd={session.raceEnd ?? session.standings}
        myNickname={myNickname}
        provisional={session.raceEnd === null}
        onViewEvaluation={() => setRoute('evaluation')}
        onPlayAgain={playAgain}
        onBackToRace={() => setRoute('home')}
      />
    );
  }

  if (route === 'evaluation') {
    return (
      <EvaluationScreen
        evaluation={session.evaluation}
        onPlayAgain={playAgain}
        onBackToResults={() => setRoute('result')}
      />
    );
  }

  if (phase === 'racing') {
    return (
      <RaceScreen
        answerError={session.error?.code === 'invalid-answer' ? session.error : null}
        state={session.state}
        feedback={session.feedback}
        feedbackAtMs={session.feedbackAtMs}
        myId={session.myId}
        onAnswer={answer}
        onSkipToResults={() => setRoute('result')}
      />
    );
  }

  return (
    <PodiumScreen
      raceEnd={session.raceEnd}
      myNickname={myNickname}
      onViewEvaluation={() => setRoute('evaluation')}
      onPlayAgain={playAgain}
    />
  );
}
