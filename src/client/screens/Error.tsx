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
      <div className="card error-panel error-content">
        <span className="error-icon" aria-hidden="true">
          {expired ? '🚪' : '⚠️'}
        </span>
        <h1 className="error-title">{expired ? 'Kamu keluar dari room' : 'Koneksi terputus'}</h1>
        <p className="error-text">
          {expired
            ? 'Balapan ini sudah berakhir untukmu.'
            : retrying
              ? 'Mencoba menyambung lagi…'
              : pesan || 'Terjadi kesalahan.'}
        </p>
        {retrying && !expired ? (
          <span className="error-code" aria-hidden="true">
            ⌛
          </span>
        ) : null}
        {code && !expired ? <p className="error-code">Kode: {code}</p> : null}
        {expired && onPlayAgain ? <Button onClick={onPlayAgain}>Main lagi</Button> : null}
      </div>
    </main>
  );
}
