import { useEffect, useRef, type CSSProperties } from 'react';
import { Button } from './Button';
import type { RaceFeedback } from '../../shared/schema';
import './FeedbackSheet.css';

export interface FeedbackSheetProps {
  feedback: RaceFeedback;
  /** Lama tahan tampilan (detik); dipakai bar waktu dan teks hitung mundur. */
  holdS: number;
  remainingS: number;
  /** Hanya ada saat jawaban benar (FR-B04). */
  onSkip?: (() => void) | undefined;
}

/**
 * Lembar umpan balik di dasar layar: hasil, penjelasan, sumber, dan sisa waktu baca.
 * Menempel di bawah supaya soal + pilihan (dengan tanda ✓/✗) tetap terlihat di atasnya.
 */
export function FeedbackSheet({ feedback, holdS, remainingS, onSkip }: FeedbackSheetProps) {
  const ok = feedback.correct;
  const ref = useRef<HTMLElement>(null);
  // Layar kecil: pastikan lembar penuh terlihat tanpa menutupi soal dan pilihan.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [feedback]);
  return (
    <section
      ref={ref}
      className={`feedback-sheet ${ok ? 'is-ok' : 'is-wrong'}`}
      aria-label="Penjelasan jawaban"
    >
      <div className="feedback-head">
        <span className="feedback-icon" aria-hidden="true">
          {ok ? '✓' : '✗'}
        </span>
        <h3 className="feedback-title">{ok ? 'Benar! Hewanmu maju.' : 'Belum tepat'}</h3>
        <span className="feedback-timer" role="timer" aria-label={`${remainingS} detik`}>
          {ok ? 'Lanjut' : 'Tunggu'} {remainingS}s
        </span>
      </div>
      {feedback.explanation ? <p className="feedback-text">{feedback.explanation}</p> : null}
      {feedback.sources && feedback.sources.length > 0 ? (
        <ul className="feedback-sources">
          {feedback.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.judul} — {source.lembaga}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {onSkip ? (
        <Button variant="primary" className="feedback-skip" onClick={onSkip}>
          Lanjut
        </Button>
      ) : null}
      <span
        className="feedback-bar"
        aria-hidden="true"
        style={{ '--hold': `${holdS}s` } as CSSProperties}
      />
    </section>
  );
}
