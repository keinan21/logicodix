import { useState } from 'react';
import { GAME } from '../../shared/constants';
import type { RoomState } from '../../shared/schema';
import { LobbyScreen } from '../screens/Lobby';
import './LobbyPreview.css';

/** Synthetic design fixture; loaded only by Vite development mode. */
const sample: RoomState = {
  roomId: 'preview',
  phase: 'lobby',
  timeLeftS: GAME.RACE_DURATION_S,
  questionIndex: 0,
  activeQuestion: null,
  finishOrder: [],
  participants: [
    {
      id: 'preview-1',
      nickname: 'Raka',
      animalId: 'harimau',
      isBot: false,
      slot: 1,
      steps: 0,
      status: 'racing',
    },
    {
      id: 'preview-2',
      nickname: 'Dina',
      animalId: 'penyu',
      isBot: false,
      slot: 2,
      steps: 0,
      status: 'racing',
    },
    {
      id: 'preview-3',
      nickname: 'BOT Kilat',
      animalId: 'badak',
      isBot: true,
      slot: 3,
      steps: 0,
      status: 'racing',
    },
    {
      id: 'preview-4',
      nickname: 'BOT Santai',
      animalId: 'gajah',
      isBot: true,
      slot: 4,
      steps: 0,
      status: 'racing',
    },
  ],
};

export function LobbyPreview() {
  const [countdown, setCountdown] = useState<number | null>(GAME.LOBBY_COUNTDOWN_S);
  return (
    <>
      <aside className="lobby-preview-controls" aria-label="Kontrol pratinjau Lobby">
        <label>
          Pratinjau Lobby · data contoh
          <select
            value={countdown ?? ''}
            onChange={(event) =>
              setCountdown(event.target.value === '' ? null : Number(event.target.value))
            }
          >
            {Array.from(
              { length: GAME.LOBBY_COUNTDOWN_S },
              (_, index) => GAME.LOBBY_COUNTDOWN_S - index,
            ).map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds} detik
              </option>
            ))}
            <option value="">Menunggu data</option>
          </select>
        </label>
        <a href="/">Kembali ke Beranda</a>
      </aside>
      <LobbyScreen state={countdown === null ? null : sample} countdown={countdown} />
    </>
  );
}
