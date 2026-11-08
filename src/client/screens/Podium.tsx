import { Button } from '../components/Button';
import { ResultRow } from '../components/ResultRow';
import type { RaceEnd } from '../../shared/schema';

/**
 * Layar Podium (DESIGN §3 screen 5; FR-H01).
 * Podium 1-2-3 + tabel semua peserta; bar pemain sendiri disorot.
 * Tampil tanpa menunggu AI.
 */
export function PodiumScreen({
  raceEnd,
  myNickname,
  onViewEvaluation,
  onPlayAgain,
}: {
  raceEnd: RaceEnd | null;
  myNickname: string;
  onViewEvaluation: () => void;
  onPlayAgain: () => void;
}) {
  const ranking = raceEnd?.ranking ?? [];
  return (
    <main className="screen">
      <div className="screen-inner">
        <h1 style={{ font: 'var(--text-title)', color: 'var(--color-forest-900)' }}>
          Hasil balapan
        </h1>

        {/* TODO(T-16): visual podium 1-2-3 (earth-500 untuk angka ≥24px bold). */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ font: 'var(--text-label)', color: 'var(--color-muted)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--space-2)' }}>Posisi</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-2)' }}>Peserta</th>
              <th style={{ textAlign: 'center', padding: 'var(--space-2)' }}>Benar</th>
              <th style={{ textAlign: 'center', padding: 'var(--space-2)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r) => (
              <ResultRow
                key={r.nickname + r.rank}
                rank={r.rank}
                participant={{
                  id: r.nickname,
                  nickname: r.nickname,
                  animalId: r.animalId,
                  isBot: r.isBot,
                  slot: 1,
                  steps: r.correctCount,
                  status: r.status,
                }}
                correctCount={r.correctCount}
                status={r.status}
                isMe={r.nickname === myNickname}
              />
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="ai" onClick={onViewEvaluation}>
            Lihat evaluasi AI
          </Button>
          <Button variant="secondary" onClick={onPlayAgain}>
            Main lagi
          </Button>
        </div>
      </div>
    </main>
  );
}
