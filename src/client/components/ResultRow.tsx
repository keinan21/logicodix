import type { ParticipantPublic } from '../../shared/schema';

export interface ResultRowProps {
  rank: number;
  participant: ParticipantPublic;
  correctCount: number;
  status: string;
  /** Sorot bar pemain sendiri (FR-H01). */
  isMe: boolean;
  final?: boolean;
}

/** ResultRow — DESIGN §4: normal, me, bot. */
export function ResultRow({
  rank,
  participant,
  correctCount,
  status,
  isMe,
  final = false,
}: ResultRowProps) {
  return (
    <tr className={isMe ? 'result-row is-me' : 'result-row'}>
      <td>{rank}</td>
      <td>
        {participant.nickname} {participant.isBot ? '(BOT)' : ''}
      </td>
      <td className="result-cell-center">{correctCount}</td>
      <td className="result-cell-center">{statusLabel(status, final)}</td>
    </tr>
  );
}

function statusLabel(status: string, final: boolean): string {
  switch (status) {
    case 'finished':
      return 'Finish';
    case 'outOfQuestions':
      return 'Soal habis';
    case 'left':
      return 'Keluar';
    default:
      return final ? 'Waktu habis' : 'Balapan';
  }
}
