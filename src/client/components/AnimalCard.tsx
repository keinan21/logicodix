import type { AnimalId } from '../../shared/schema';

export interface AnimalCardProps {
  animalId: AnimalId;
  nama: string;
  fakta: string;
  selected: boolean;
  onSelect: (animalId: AnimalId) => void;
}

/**
 * AnimalCard — DESIGN §4: default, selected, focus.
 * TODO(T-11): ganti placeholder emoji dengan SVG Noto Emoji dari src/client/assets/animals/<id>.svg
 * (DESIGN §12 risiko: emoji sistem bisa beda di HP; hewan wajib SVG Noto di repo).
 */
export function AnimalCard({ animalId, nama, fakta, selected, onSelect }: AnimalCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(animalId)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        border: `3px solid ${selected ? 'var(--color-forest-700)' : 'var(--color-line)'}`,
        backgroundColor: selected ? 'var(--color-forest-100)' : '#ffffff',
        cursor: 'pointer',
      }}
    >
      {/* TODO(T-11): <img src={animalSvg(animalId)} alt="" /> */}
      <span aria-hidden="true" style={{ fontSize: '2.5rem' }}>
        {animalPlaceholder(animalId)}
      </span>
      <span style={{ font: 'var(--text-label)' }}>{nama}</span>
      <span style={{ font: 'var(--text-small)', color: 'var(--color-muted)', textAlign: 'center' }}>
        {fakta}
      </span>
    </button>
  );
}

function animalPlaceholder(id: AnimalId): string {
  const map: Record<AnimalId, string> = {
    orangutan: '🦧',
    harimau: '🐅',
    gajah: '🐘',
    penyu: '🐢',
    badak: '🦏',
    burung: '🦜',
  };
  return map[id];
}
