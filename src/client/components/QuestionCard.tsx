import type { QuestionPublic } from '../../shared/schema';
import { GAME } from '../../shared/constants';
import { CountdownRing } from './CountdownRing';
import './QuestionCard.css';

export interface QuestionCardProps {
  question: QuestionPublic;
  displayNumber: number;
  explanation?: string | undefined;
  sources?: { judul: string; url: string; lembaga: string }[] | undefined;
  lockRemainingS?: number | undefined;
}
/** FR-K11: no type/answer metadata is added to the public question contract. */
export function QuestionCard({
  question,
  displayNumber,
  explanation,
  sources,
  lockRemainingS,
}: QuestionCardProps) {
  return (
    <article className="question-card" aria-labelledby={`question-${displayNumber}`}>
      <div className="question-meta">
        <span>Soal {displayNumber}</span>
        {lockRemainingS !== undefined && (
          <CountdownRing remaining={lockRemainingS} total={GAME.LOCK_DURATION_S} />
        )}
      </div>
      {question.claim && <blockquote className="question-claim">{question.claim}</blockquote>}
      <h2 id={`question-${displayNumber}`} className="question-title">
        {question.stem}
      </h2>
      {explanation && (
        <div className="question-explanation" role="status">
          <p>{explanation}</p>
          {sources && sources.length > 0 && (
            <ul>
              {sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.judul} — {source.lembaga}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
