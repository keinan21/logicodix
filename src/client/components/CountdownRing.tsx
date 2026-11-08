export interface CountdownRingProps {
  /** Sisa detik, misal 5..1. */
  remaining: number;
  /** Total detik untuk menghitung lingkaran. */
  total: number;
}

/**
 * CountdownRing — DESIGN §4/§6: lingkaran hitung mundur di pojok kartu saat lock 5 detik.
 * TODO(T-10): render SVG circle dengan stroke-dashoffset; angka tetap tampil sebagai teks
 * supaya tidak bergantung warna saja (DESIGN §8).
 */
export function CountdownRing({ remaining, total }: CountdownRingProps) {
  const fraction = total > 0 ? remaining / total : 0;
  return (
    <span
      role="timer"
      aria-label={`${remaining} detik`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: `4px solid var(--color-err-600)`,
        font: 'var(--text-label)',
        color: 'var(--color-err-600)',
        // Sementara: opacity menggambarkan sisa waktu; diganti SVG ring di T-10.
        opacity: 0.4 + 0.6 * fraction,
      }}
    >
      {remaining}
    </span>
  );
}
