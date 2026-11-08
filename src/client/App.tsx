import { useState } from 'react';
import { HomeScreen } from './screens/Home';
import { QueueScreen } from './screens/Queue';
import { LobbyScreen } from './screens/Lobby';
import { RaceScreen } from './screens/Race';
import { PodiumScreen } from './screens/Podium';
import { EvaluationScreen } from './screens/Evaluation';
import { ErrorScreen } from './screens/Error';
import type { ClientScreen } from './socket';

/**
 * App — skeleton switch layar. Fase sesungguhnya datang dari room:state server
 * (ARCHITECTURE §4: browser hanya menampilkan state yang dikirim server).
 * TODO(T-09/T-13/T-16): sambungkan useRoom() ke tiap layar.
 */
export function App() {
  const [screen, setScreen] = useState<ClientScreen>('home');
  const [myNickname] = useState(() => sessionStorage.getItem('nickname') ?? '');

  switch (screen) {
    case 'home':
      return <HomeScreen onJoin={() => setScreen('queue')} />;
    case 'queue':
      return <QueueScreen waitingS={0} found={1} onCancel={() => setScreen('home')} />;
    case 'lobby':
      return <LobbyScreen state={null} />;
    case 'race':
      return <RaceScreen state={null} feedback={null} />;
    case 'podium':
      return (
        <PodiumScreen
          raceEnd={null}
          myNickname={myNickname}
          onViewEvaluation={() => setScreen('evaluation')}
          onPlayAgain={() => setScreen('home')}
        />
      );
    case 'evaluation':
      return <EvaluationScreen evaluation={null} onPlayAgain={() => setScreen('home')} />;
    default:
      return <ErrorScreen code="unknown" pesan="Layar tidak dikenal." retrying={false} />;
  }
}
