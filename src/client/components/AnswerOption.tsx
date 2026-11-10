import './AnswerOption.css';

export type AnswerOptionState =
  'default' | 'hover' | 'selected-waiting' | 'correct' | 'wrong' | 'dimmed';
export interface AnswerOptionProps {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  state: AnswerOptionState;
  disabled?: boolean;
  onSelect?: (letter: 'A' | 'B' | 'C' | 'D') => void;
}
export function AnswerOption({ letter, text, state, disabled, onSelect }: AnswerOptionProps) {
  const result =
    state === 'correct'
      ? 'Benar'
      : state === 'wrong'
        ? 'Salah'
        : state === 'selected-waiting'
          ? 'Menunggu respons'
          : '';
  return (
    <button
      type="button"
      className="answer-option"
      data-state={state}
      disabled={disabled || state === 'dimmed'}
      onClick={() => onSelect?.(letter)}
      aria-label={`Pilihan ${letter}: ${text}${result ? ` — ${result}` : ''}`}
    >
      <span className="answer-letter" aria-hidden="true">
        {letter}
      </span>
      <span className="answer-text">{text}</span>
      {result && (
        <span className="answer-mark" aria-hidden="true">
          {state === 'correct' ? '✓' : state === 'wrong' ? '✗' : '…'}
        </span>
      )}
    </button>
  );
}
