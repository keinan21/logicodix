import type { QuestionPublic } from '../../shared/schema';
import { GAME } from '../../shared/constants';
import { CountdownRing } from './CountdownRing';
import './QuestionCard.css';

export interface QuestionCardProps {
  question: QuestionPublic;
  displayNumber: number;
  /** Penjelasan + sumber tampil setelah menjawab — benar maupun salah (FR-B05). */
  explanation?: string | undefined;
  sources?: { judul: string; url: string; lembaga: string }[] | undefined;
  lockRemainingS?: number | undefined;
  /** Hasil jawaban terakhir; menentukan warna panel penjelasan. */
  correct?: boolean | undefined;
  /** Lewati masa baca penjelasan lebih cepat (hanya saat jawaban benar). */
  onSkipExplanation?: (() => void) | undefined;
}
/** FR-K11: no type/answer metadata is added to the public question contract. */
export function QuestionCard({
  question,
  displayNumber,
  explanation,
  sources,
  lockRemainingS,
  correct,
  onSkipExplanation,
}: QuestionCardProps) {
  return (
    <article className="card question-card" aria-labelledby={`question-${displayNumber}`}>
      <div className="question-meta">
        <span className="eyebrow">Soal {displayNumber}</span>
        {lockRemainingS !== undefined && (
          <CountdownRing remaining={lockRemainingS} total={GAME.LOCK_DURATION_S} />
        )}
      </div>

      <h2 id={`question-${displayNumber}`} className="question-stem">
        {question.stem}
      </h2>

      {question.claim ? <blockquote className="question-claim">{question.claim}</blockquote> : null}

      {explanation ? (
        <div
          className={
            correct === false
              ? 'question-explanation question-explanation-wrong'
              : 'question-explanation'
          }
          role="status"
        >
          <p className="question-explanation-title">Penjelasan</p>
          <p>{explanation}</p>
          {lockRemainingS !== undefined ? (
            <p className="question-lock">Lanjut dalam {lockRemainingS} detik…</p>
          ) : null}
          {sources && sources.length > 0 ? (
            <ul className="question-sources">
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.judul} — {s.lembaga}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {lockRemainingS === undefined && onSkipExplanation ? (
            <button type="button" className="question-skip" onClick={onSkipExplanation}>
              Lanjut
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
