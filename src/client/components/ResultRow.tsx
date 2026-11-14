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

/**
 * ResultRow — DESIGN §4: normal, me, bot.
 * Satu baris peringkat cozy: medali posisi, hewan, nickname (+ chip "KAMU"),
 * jumlah jawaban benar, dan pil status. Teks tetap jadi pembeda utama, bukan warna.
 */
export function ResultRow({
  rank,
  participant,
  correctCount,
  status,
  isMe,
  final = false,
}: ResultRowProps) {
  return (
    <tr className={isMe ? 'result-row is-me podium-me' : 'result-row'}>
      <td className="result-rank">
        <span className="result-medal" aria-hidden="true">
          {rank}
        </span>
        <span className="visually-hidden">Posisi {rank}</span>
      </td>
      <td className="result-player">
        <span className="result-name">{participant.nickname}</span>
        {participant.isBot ? <span className="result-bot">BOT</span> : null}
        {isMe ? <span className="result-you">KAMU</span> : null}
      </td>
      <td className="result-correct">
        {correctCount} <span className="result-correct-label">jawaban benar</span>
      </td>
      <td className="result-status">
        <span className="result-pill" data-status={status}>
          {statusLabel(status, final)}
        </span>
      </td>
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
