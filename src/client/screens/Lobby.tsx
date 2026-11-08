import type { AnimalId, RoomState } from '../../shared/schema';
import { GAME } from '../../shared/constants';
import { Badge } from '../components/Badge';
import { CountdownRing } from '../components/CountdownRing';
import harimau from '../assets/home/tiger.svg';
import penyu from '../assets/home/turtle.svg';
import orangutan from '../assets/animals/orangutan.svg';
import gajah from '../assets/animals/gajah.svg';
import badak from '../assets/animals/badak.svg';
import burung from '../assets/animals/burung.svg';
import './Lobby.css';

const animals: Record<AnimalId, { src: string; name: string }> = {
  harimau: { src: harimau, name: 'Harimau' },
  penyu: { src: penyu, name: 'Penyu' },
  orangutan: { src: orangutan, name: 'Orangutan' },
  gajah: { src: gajah, name: 'Gajah' },
  badak: { src: badak, name: 'Badak' },
  burung: { src: burung, name: 'Burung' },
};

/** FR-M11: presentation only; countdown must be supplied by the room integration. */
export function LobbyScreen({
  state,
  countdown = null,
}: {
  state: RoomState | null;
  countdown?: number | null;
}) {
  const participants = state?.participants ?? [];
  const ready = participants.length === GAME.MAX_PLAYERS;
  const counting =
    ready && countdown !== null && countdown > 0 && countdown <= GAME.LOBBY_COUNTDOWN_S;
  return (
    <main className="screen lobby-screen">
      <div className="lobby-content">
        <h1 className="lobby-title">Siap-siap!</h1>
        {counting ? (
          <div aria-live="polite" aria-atomic="true">
            <CountdownRing remaining={countdown} total={GAME.LOBBY_COUNTDOWN_S} variant="lobby" />
          </div>
        ) : (
          <p className="lobby-wait" role="status">
            {ready ? 'Menunggu balapan dimulai…' : 'Menunggu data peserta…'}
          </p>
        )}
        {participants.length > 0 && (
          <ul className="lobby-participants" aria-label="Peserta balapan">
            {participants.map((participant) => (
              <li key={participant.id} className="lobby-participant">
                <img
                  className="lobby-animal"
                  src={animals[participant.animalId].src}
                  alt={animals[participant.animalId].name}
                />
                <span className="lobby-nickname">{participant.nickname}</span>
                {participant.isBot && <Badge kind="bot" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
