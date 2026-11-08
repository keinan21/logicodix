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
    <main className="screen" role="alert">
      <div
        className="screen-inner"
        style={{ maxWidth: 480, alignItems: 'center', textAlign: 'center' }}
      >
        <h1 style={{ font: 'var(--text-title)', color: 'var(--color-err-600)' }}>
          Koneksi terputus
        </h1>
        <p style={{ font: 'var(--text-body)', color: 'var(--color-muted)' }}>
          {retrying ? 'Mencoba menyambung lagi…' : pesan || 'Terjadi kesalahan.'}
        </p>
        {code ? (
          <p style={{ font: 'var(--text-small)', color: 'var(--color-muted)' }}>Kode: {code}</p>
        ) : null}
      </div>
    </main>
  );
}
