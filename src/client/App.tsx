import { useEffect, useState } from 'react';
import { GAME } from '../shared/constants';
import type { AnimalId } from '../shared/schema';
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
  const [route, setRoute] = useState<'home' | 'queue' | 'evaluation'>('home');
  const [queuedAtMs, setQueuedAtMs] = useState<number | null>(null);
  const [waitingS, setWaitingS] = useState(0);
  const [lobbyCountdown, setLobbyCountdown] = useState<number | null>(null);

  // Lama menunggu antre (FR-M05) — tampilan saja; pencocokan tetap di server.
  useEffect(() => {
    if (route !== 'queue' || queuedAtMs === null) return;
    const tick = () => setWaitingS(Math.floor((Date.now() - queuedAtMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [route, queuedAtMs]);

  const phase = session.state?.phase;
  const roomId = session.state?.roomId;

  // Hitung mundur lobby 3-2-1 (FR-M11). Hanya tampilan: balapan tetap dimulai oleh server.
  useEffect(() => {
    if (phase !== 'lobby') {
      setLobbyCountdown(null);
      return;
    }
    const startedAtMs = Date.now();
    const tick = () => {
      const left = GAME.LOBBY_COUNTDOWN_S - Math.floor((Date.now() - startedAtMs) / 1000);
      setLobbyCountdown(Math.min(GAME.LOBBY_COUNTDOWN_S, Math.max(0, left)));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, roomId]);

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
    setRoute('home');
    setQueuedAtMs(null);
  };

  // Koneksi putus: Socket.IO mencoba menyambung sendiri (FR-B11).
  if (session.everConnected && !session.connected) {
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
    return <LobbyScreen state={session.state} countdown={lobbyCountdown} />;
  }

  if (phase === 'racing') {
    return (
      <RaceScreen
        state={session.state}
        feedback={session.feedback}
        feedbackAtMs={session.feedbackAtMs}
        myId={session.myId}
        onAnswer={answer}
      />
    );
  }

  if (route === 'evaluation') {
    return <EvaluationScreen evaluation={session.evaluation} onPlayAgain={playAgain} />;
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
