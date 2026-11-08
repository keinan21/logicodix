import type { ParticipantPublic } from '../../shared/schema';

export interface LaneProps {
  participant: ParticipantPublic;
  /** Posisi langkah 0..5 (0 = start). */
  steps: number;
}

/**
 * Lane — DESIGN §4/§5: 4 jalur tanah, label nickname warna slot (atau warna bot),
 * hewan menghadap kanan (flip bila perlu), 6 titik posisi, tunas 🌱 per langkah,
 * status finish menampilkan posisi, "Keluar" membuat hewan abu-abu 50%.
 * TODO(T-10): animasi motion-step, motion-bob, parallax pohon; SVG hewan dari assets/animals.
 */
export function Lane({ participant, steps }: LaneProps) {
  const slotColor = participant.isBot
    ? 'var(--color-bot)'
    : (`var(--color-slot-${participant.slot})` as string);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) 0',
        borderBottom: `2px dashed var(--color-earth-500)`,
        opacity: participant.status === 'left' ? 0.5 : 1,
      }}
    >
      <span
        style={{
          minWidth: 96,
          font: 'var(--text-label)',
          color: slotColor,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {participant.nickname}
        {participant.isBot ? ' · BOT' : ''}
      </span>

      {/* TODO(T-10): ganti dengan <img> SVG hewan; transform: scaleX(-1) bila flip */}
      <span aria-hidden="true" style={{ fontSize: '1.75rem', display: 'inline-block' }}>
        {animalEmoji(participant.animalId)}
      </span>

      {/* 6 titik posisi: start + 5 langkah */}
      <span
        style={{ display: 'inline-flex', gap: 'var(--space-2)', alignItems: 'center' }}
        aria-hidden="true"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: i <= steps ? 'var(--color-forest-500)' : 'var(--color-earth-300)',
            }}
          />
        ))}
      </span>

      {participant.status === 'finished' ? (
        <span style={{ font: 'var(--text-label)', color: 'var(--color-forest-700)' }}>Finish</span>
      ) : null}
      {participant.status === 'outOfQuestions' ? (
        <span style={{ font: 'var(--text-label)', color: 'var(--color-muted)' }}>Soal habis</span>
      ) : null}
      {participant.status === 'left' ? (
        <span style={{ font: 'var(--text-label)', color: 'var(--color-muted)' }}>Keluar</span>
      ) : null}
    </div>
  );
}

function animalEmoji(id: string): string {
  const map: Record<string, string> = {
    orangutan: '🦧',
    harimau: '🐅',
    gajah: '🐘',
    penyu: '🐢',
    badak: '🦏',
    burung: '🦜',
  };
  return map[id] ?? '🐾';
}
