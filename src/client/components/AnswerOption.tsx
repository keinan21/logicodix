export type AnswerOptionState =
  'default' | 'hover' | 'selected-waiting' | 'correct' | 'wrong' | 'dimmed';

export interface AnswerOptionProps {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  state: AnswerOptionState;
  disabled?: boolean;
  onSelect?: (letter: 'A' | 'B' | 'C' | 'D') => void;
}

/**
 * AnswerOption — DESIGN §4 + §6.
 * Status tidak pernah dibedakan dengan warna saja: selalu ada ikon ✓/✗ (DESIGN §6, §8).
 * Tampilan chunky ada di `.answer-option` (styles.css).
 */
export function AnswerOption({ letter, text, state, disabled, onSelect }: AnswerOptionProps) {
  const isCorrect = state === 'correct';
  const isWrong = state === 'wrong';
  const dimmed = state === 'dimmed';
  const modifier = isCorrect ? ' is-correct' : isWrong ? ' is-wrong' : dimmed ? ' is-dimmed' : '';

  return (
    <button
      type="button"
      disabled={disabled || dimmed}
      onClick={() => onSelect?.(letter)}
      aria-label={`Pilihan ${letter}: ${text}`}
      className={`answer-option${modifier}`}
    >
      <span aria-hidden="true" className="answer-letter">
        {letter}
      </span>
      <span className="answer-text">{text}</span>
      {isCorrect ? (
        <span aria-hidden="true" className="answer-mark answer-mark-ok">
          ✓
        </span>
      ) : null}
      {isWrong ? (
        <span aria-hidden="true" className="answer-mark answer-mark-err">
          ✗
        </span>
      ) : null}
      {(isCorrect || isWrong) && (
        <span className="visually-hidden">{isCorrect ? 'Benar' : 'Salah'}</span>
      )}
    </button>
  );
}
