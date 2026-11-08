import { Button } from '../components/Button';
import { GAME } from '../../shared/constants';
import './Queue.css';

/**
 * Layar Antre (DESIGN §3 screen 2; FR-M05, M07).
 */
export function QueueScreen({
  waitingS,
  found,
  onCancel,
}: {
  waitingS: number;
  found: number;
  onCancel: () => void;
}) {
  return (
    <main className="screen queue-screen">
      <div className="queue-content">
        <h1 className="queue-title" aria-live="polite" aria-atomic="true">
          Mencari pemain… ({found}/{GAME.MAX_PLAYERS})
        </h1>
        <p className="queue-wait" role="timer" aria-live="off">
          <span aria-hidden="true">⏳</span> Menunggu {waitingS} detik
        </p>
        <Button variant="secondary" className="queue-cancel" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </main>
  );
}
