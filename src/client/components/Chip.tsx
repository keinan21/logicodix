export type ChipKind = 'klaim' | 'pengetahuan' | 'misinfo-type' | 'topic';

export interface ChipProps {
  kind: ChipKind;
  children: string;
}

/** Chip — DESIGN §4: klaim, pengetahuan, tipe misinformasi, topik. */
export function Chip({ kind, children }: ChipProps) {
  const styles: Record<ChipKind, { bg: string; color: string }> = {
    klaim: { bg: 'var(--color-sun-500)', color: 'var(--color-sun-ink)' },
    pengetahuan: { bg: 'var(--color-sky-100)', color: 'var(--color-forest-900)' },
    'misinfo-type': { bg: 'var(--color-forest-100)', color: 'var(--color-forest-900)' },
    topic: { bg: 'var(--color-forest-100)', color: 'var(--color-forest-700)' },
  };
  const s = styles[kind];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: 'var(--space-1) var(--space-2)',
        borderRadius: 'var(--radius-pill)',
        font: 'var(--text-label)',
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {children}
    </span>
  );
}
