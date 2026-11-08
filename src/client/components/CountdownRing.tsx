export interface CountdownRingProps {
  /** Sisa detik, misal 5..1. */
  remaining: number;
  /** Total detik untuk menghitung lingkaran. */
  total: number;
  variant?: 'default' | 'lobby';
}

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * CountdownRing — DESIGN §4/§6: lingkaran hitung mundur (lock 5 detik, lobby 3-2-1).
 * Angka tetap tampil sebagai teks supaya status tidak bergantung pada warna saja (DESIGN §8).
 */
export function CountdownRing({ remaining, total, variant = 'default' }: CountdownRingProps) {
  const safeTotal = total > 0 ? total : 1;
  const fraction = Math.max(0, Math.min(1, remaining / safeTotal));

  if (variant === 'lobby') {
    return (
      <span
        className="lobby-countdown"
        role="timer"
        aria-label={`${remaining} detik`}
        style={{
          background: `conic-gradient(var(--color-err-600) ${fraction}turn, var(--color-line) 0)`,
        }}
      >
        <span>{remaining}</span>
      </span>
    );
  }

  return (
    <span className="countdown-ring" role="timer" aria-label={`${remaining} detik`}>
      <svg className="countdown-ring-svg" viewBox="0 0 44 44" aria-hidden="true">
        <circle className="countdown-ring-track" cx="22" cy="22" r={RADIUS} />
        <circle
          className="countdown-ring-value"
          cx="22"
          cy="22"
          r={RADIUS}
          style={{
            strokeDasharray: CIRCUMFERENCE,
            strokeDashoffset: CIRCUMFERENCE * (1 - fraction),
          }}
        />
      </svg>
      <span className="countdown-ring-number" aria-hidden="true">
        {remaining}
      </span>
    </span>
  );
}
