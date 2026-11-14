import type { RoomState } from '../../shared/schema';
import { GAME } from '../../shared/constants';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CountdownRing } from '../components/CountdownRing';
import { ANIMAL_ASSETS } from '../components/animalAssets';
import './Lobby.css';

/** FR-M11: presentation only; countdown must be supplied by the room integration. */
export function LobbyScreen({
  state,
  countdown = null,
  onLeave,
}: {
  state: RoomState | null;
  countdown?: number | null;
  /** Batal dan kembali ke beranda. */
  onLeave?: () => void;
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
            {participants.map((participant) => {
              const animal = ANIMAL_ASSETS[participant.animalId];
              return (
                <li key={participant.id} className="lobby-participant">
                  <img className="lobby-animal" src={animal.src} alt={animal.nama} />
                  <span className="lobby-nickname">{participant.nickname}</span>
                  {participant.isBot && <Badge kind="bot" />}
                </li>
              );
            })}
          </ul>
        )}
        {onLeave ? (
          <Button variant="secondary" className="lobby-leave" onClick={onLeave}>
            Keluar
          </Button>
        ) : null}
      </div>
    </main>
  );
}
