export type ChipKind = 'klaim' | 'pengetahuan' | 'misinfo-type' | 'topic';

export interface ChipProps {
  kind: ChipKind;
  children: string;
}

/** Chip — DESIGN §4: klaim, pengetahuan, tipe misinformasi, topik. */
export function Chip({ kind, children }: ChipProps) {
  return <span className={`chip chip-${kind}`}>{children}</span>;
}
