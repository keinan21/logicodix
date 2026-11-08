import type { ParticipantPublic } from '../../shared/schema';

export interface ResultRowProps {
  rank: number;
  participant: ParticipantPublic;
  correctCount: number;
  status: string;
  /** Sorot bar pemain sendiri (FR-H01). */
  isMe: boolean;
}

/** ResultRow — DESIGN §4: normal, me, bot. */
export function ResultRow({ rank, participant, correctCount, status, isMe }: ResultRowProps) {
  return (
    <tr
      style={{
        backgroundColor: isMe ? 'var(--color-forest-100)' : 'transparent',
        font: 'var(--text-body)',
      }}
    >
      <td style={{ padding: 'var(--space-2)' }}>{rank}</td>
      <td style={{ padding: 'var(--space-2)' }}>
        {participant.nickname} {participant.isBot ? '(BOT)' : ''}
      </td>
      <td style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{correctCount}</td>
      <td style={{ padding: 'var(--space-2)', textAlign: 'center' }}>{statusLabel(status)}</td>
    </tr>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case 'finished':
      return 'Finish';
    case 'outOfQuestions':
      return 'Soal habis';
    case 'left':
      return 'Keluar';
    default:
      return 'Balapan';
  }
}
