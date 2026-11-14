import type { ParticipantPublic } from '../../shared/schema';
import { ANIMAL_ASSETS } from './animalAssets';

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
 * Baris peringkat pipih: nomor posisi, hewan, nickname (+ chip KAMU/BOT),
 * jumlah jawaban benar, dan pil status. Teks gelap di panel terang.
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
        <span className="result-rank-num" aria-hidden="true">
          {rank}
        </span>
        <span className="visually-hidden">Posisi {rank}</span>
      </td>
      <td className="result-player">
        <img
          className="result-animal"
          src={ANIMAL_ASSETS[participant.animalId].src}
          alt=""
          aria-hidden="true"
        />
        <span className="result-player-text">
          <span className="result-name">
            {participant.nickname}
            {participant.isBot ? <span className="result-bot">BOT</span> : null}
            {isMe ? <span className="result-you">KAMU</span> : null}
          </span>
          <span className="result-score">{correctCount} jawaban benar</span>
        </span>
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
