import type { ParticipantPublic, RoomState } from '../../shared/schema';

import { GAME } from '../../shared/constants';

/**
 * Layar Lobby (DESIGN §3 screen 3; FR-M11).
 * Menampilkan 4 peserta + hitung mundur 3-2-1. TODO(T-09): countdown digerakkan server.
 */
export function LobbyScreen({ state }: { state: RoomState | null }) {
  const participants: ParticipantPublic[] = state?.participants ?? [];
  return (
    <main className="screen">
      <div className="screen-inner" style={{ maxWidth: 560 }}>
        <h1 style={{ font: 'var(--text-title)', color: 'var(--color-forest-900)' }}>Siap-siap!</h1>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {participants.map((p) => (
            <li
              key={p.id}
              className="card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>
                {p.nickname} {p.isBot ? '(BOT)' : ''}
              </span>
              <span style={{ font: 'var(--text-label)', color: 'var(--color-muted)' }}>
                Slot {p.slot}
              </span>
            </li>
          ))}
        </ul>
        <p
          aria-live="polite"
          style={{
            font: 'var(--text-display)',
            color: 'var(--color-forest-700)',
            textAlign: 'center',
          }}
        >
          {/* TODO(T-09): hitung mundur 3-2-1 digerakkan server (FR-M11) */}
          {GAME.LOBBY_COUNTDOWN_S}
        </p>
      </div>
    </main>
  );
}
