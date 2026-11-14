import type { QuestionPublic } from '../../shared/schema';
import './QuestionCard.css';

export interface QuestionCardProps {
  question: QuestionPublic;
  displayNumber: number;
}

/** FR-K11: no type/answer metadata is added to the public question contract. */
export function QuestionCard({ question, displayNumber }: QuestionCardProps) {
  return (
    <article className="card question-card" aria-labelledby={`question-${displayNumber}`}>
      <span className="eyebrow">Soal {displayNumber}</span>

      <h2 id={`question-${displayNumber}`} className="question-stem">
        {question.stem}
      </h2>

      {question.claim ? <blockquote className="question-claim">{question.claim}</blockquote> : null}
    </article>
  );
}
