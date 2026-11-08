export interface CountdownRingProps {
  /** Sisa detik, misal 5..1. */
  remaining: number;
  /** Total detik untuk menghitung lingkaran. */
  total: number;
  variant?: 'default' | 'lobby';
}

/**
 * CountdownRing — DESIGN §4/§6: lingkaran hitung mundur di pojok kartu saat lock 5 detik.
 * TODO(T-10): render SVG circle dengan stroke-dashoffset; angka tetap tampil sebagai teks
 * supaya tidak bergantung warna saja (DESIGN §8).
 */
export function CountdownRing({ remaining, total, variant = 'default' }: CountdownRingProps) {
  const fraction = total > 0 ? remaining / total : 0;
  if (variant === 'lobby') {
    return (
      <span
        className="lobby-countdown"
        role="timer"
        aria-label={`${remaining} detik`}
        style={{
          background: `conic-gradient(var(--color-err-600) ${Math.max(0, Math.min(1, fraction))}turn, var(--color-line) 0)`,
        }}
      >
        <span>{remaining}</span>
      </span>
    );
  }
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
