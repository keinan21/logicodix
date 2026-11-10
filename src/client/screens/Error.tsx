import { Button } from '../components/Button';
import './Error.css';

/**
 * Layar Error (DESIGN §3 screen 7; FR-B11).
 * Koneksi putus → mencoba lagi otomatis (Socket.IO reconnect). >10 dtk → status "Keluar".
 */
export function ErrorScreen({
  code,
  pesan,
  retrying,
  onPlayAgain,
}: {
  code: string;
  pesan: string;
  retrying: boolean;
  onPlayAgain?: () => void;
}) {
  const expired = code === 'resume-expired' || code === 'session-not-found';
  return (
    <main className="screen error-screen" role="alert">
      <div className="error-content">
        <span className="error-icon" aria-hidden="true">
          {expired ? '🚪' : '⚠️'}
        </span>
        <h1>{expired ? 'Kamu keluar dari room' : 'Koneksi terputus'}</h1>
        <p style={{ font: 'var(--text-body)', color: 'var(--color-muted)' }}>
          {expired
            ? 'Balapan ini sudah berakhir untukmu.'
            : retrying
              ? 'Mencoba menyambung lagi…'
              : pesan || 'Terjadi kesalahan.'}
        </p>
        {retrying && !expired ? <span aria-hidden="true">⌛</span> : null}
        {expired && onPlayAgain ? <Button onClick={onPlayAgain}>Main lagi</Button> : null}
      </div>
    </main>
  );
}
