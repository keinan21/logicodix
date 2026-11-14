import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ResultRow } from '../components/ResultRow';
import { ANIMAL_ASSETS } from '../components/animalAssets';
import type { RaceEnd } from '../../shared/schema';
import './Podium.css';

export interface PodiumScreenProps {
  raceEnd: RaceEnd | null;
  myNickname: string;
  onViewEvaluation: () => void;
  onPlayAgain: () => void;
  /** Peringkat sementara: balapan masih berjalan, urutan bisa berubah sampai race:end. */
  provisional?: boolean;
  /** Kembali menonton sisa balapan (hanya saat peringkat masih sementara). */
  onBackToRace?: () => void;
}

type Row = RaceEnd['ranking'][number];

/**
 * Layar Podium (DESIGN §3 screen 5; FR-H01).
 * Podium 1-2-3 (juara 2 di kiri, juara 1 di tengah) + tabel semua peserta.
 * Tampil tanpa menunggu AI; baris pemain sendiri disorot.
 */
export function PodiumScreen({
  raceEnd,
  myNickname,
  onViewEvaluation,
  onPlayAgain,
  provisional = false,
  onBackToRace,
}: PodiumScreenProps) {
  const ranking = raceEnd?.ranking ?? [];
  const top3 = ranking.slice(0, 3);
  const visual = [top3[1], top3[0], top3[2]].filter((row): row is Row => row !== undefined);

  return (
    <main className="screen podium-screen">
      <div className="screen-inner two-columns">
        <section aria-labelledby="podium-title">
          <div className="plank">
            <h1 id="podium-title" className="plank-title">
              {provisional ? 'Hasil sementara' : 'Hasil balapan'}
            </h1>
          </div>
          {provisional ? (
            <p className="podium-note" role="status">
              Balapan masih berjalan; peringkat bisa berubah sampai semua peserta selesai.
            </p>
          ) : null}

          {visual.length > 0 ? (
            <ol className="podium-steps">
              {visual.map((row) => {
                const isMe = row.nickname === myNickname;
                return (
                  <li
                    key={row.rank}
                    className={`podium-step podium-rank-${row.rank}${isMe ? ' podium-me' : ''}`}
                  >
                    <img className="podium-animal" src={ANIMAL_ASSETS[row.animalId].src} alt="" />
                    <span className="podium-nickname">{row.nickname}</span>
                    {row.isBot ? <Badge kind="bot" /> : null}
                    <span className="podium-rank" aria-label={`Posisi ${row.rank}`}>
                      {row.rank}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="podium-empty">Belum ada hasil balapan.</p>
          )}
        </section>

        <section aria-labelledby="podium-table" className="card podium-board">
          <h2 id="podium-table" className="podium-heading">
            Semua peserta
          </h2>
          <table className="podium-table">
            <thead>
              <tr>
                <th scope="col">Posisi</th>
                <th scope="col">Peserta</th>
                <th scope="col">Benar</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row) => (
                <ResultRow
                  key={`${row.rank}-${row.nickname}`}
                  rank={row.rank}
                  participant={{
                    id: row.nickname,
                    nickname: row.nickname,
                    animalId: row.animalId,
                    isBot: row.isBot,
                    slot: 1,
                    steps: row.correctCount,
                    status: row.status,
                  }}
                  correctCount={row.correctCount}
                  status={row.status}
                  isMe={row.nickname === myNickname}
                />
              ))}
            </tbody>
          </table>

          <div className="podium-actions">
            <Button variant="ai" onClick={onViewEvaluation}>
              Lihat evaluasi AI
            </Button>
            {provisional && onBackToRace ? (
              <Button variant="secondary" onClick={onBackToRace}>
                Kembali menonton
              </Button>
            ) : (
              <Button variant="secondary" onClick={onPlayAgain}>
                Main lagi
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
