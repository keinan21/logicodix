import './Error.css';

/**
 * Layar Error (DESIGN §3 screen 7; FR-B11).
 * Koneksi putus → mencoba lagi otomatis (Socket.IO reconnect). >10 dtk → status "Keluar".
 */
export function ErrorScreen({
  code,
  pesan,
  retrying,
}: {
  code: string;
  pesan: string;
  retrying: boolean;
}) {
  return (
    <main className="screen error-screen" role="alert">
      <div className="card error-panel">
        <h1 className="error-title">Koneksi terputus</h1>
        <p className="error-text">
          {retrying ? 'Mencoba menyambung lagi…' : pesan || 'Terjadi kesalahan.'}
        </p>
        {code ? <p className="error-code">Kode: {code}</p> : null}
      </div>
    </main>
  );
}
