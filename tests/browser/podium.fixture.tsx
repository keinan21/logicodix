import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PodiumScreen } from '../../src/client/screens/Podium';
import type { RaceEnd } from '../../src/shared/schema';
import '../../src/client/styles.css';
const raceEnd: RaceEnd = {
  ranking: [
    {
      rank: 1,
      nickname: 'Raka',
      animalId: 'harimau',
      isBot: false,
      correctCount: 5,
      status: 'finished',
    },
    {
      rank: 2,
      nickname: 'BOT Kilat',
      animalId: 'badak',
      isBot: true,
      correctCount: 5,
      status: 'finished',
    },
    {
      rank: 3,
      nickname: 'Dina',
      animalId: 'penyu',
      isBot: false,
      correctCount: 3,
      status: 'racing',
    },
    {
      rank: 4,
      nickname: 'NamaPanjangSekali',
      animalId: 'gajah',
      isBot: false,
      correctCount: 2,
      status: 'left',
    },
  ],
};
function Fixture() {
  const [action, setAction] = useState('');
  const provisional = new URLSearchParams(location.search).has('sementara');
  return (
    <>
      <PodiumScreen
        raceEnd={raceEnd}
        myNickname="Raka"
        provisional={provisional}
        onViewEvaluation={() => setAction('Evaluasi')}
        onPlayAgain={() => setAction('Main')}
        onBackToRace={() => setAction('Menonton')}
      />
      <output aria-label="Navigasi">{action}</output>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
