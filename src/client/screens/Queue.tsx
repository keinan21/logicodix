import { Button } from '../components/Button';

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
    <main className="screen">
      <div
        className="screen-inner"
        style={{ maxWidth: 480, alignItems: 'center', textAlign: 'center' }}
      >
        <h1 style={{ font: 'var(--text-title)', color: 'var(--color-forest-900)' }}>
          Mencari pemain… ({found}/4)
        </h1>
        <p style={{ font: 'var(--text-body)', color: 'var(--color-muted)' }}>
          Sudah menunggu {waitingS} detik. Slot kosong akan diisi bot berlabel "BOT" setelah 10
          detik.
        </p>
        <Button variant="secondary" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </main>
  );
}
