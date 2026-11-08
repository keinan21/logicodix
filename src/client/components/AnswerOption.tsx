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
 */
export function AnswerOption({ letter, text, state, disabled, onSelect }: AnswerOptionProps) {
  const isCorrect = state === 'correct';
  const isWrong = state === 'wrong';
  const dimmed = state === 'dimmed';

  let borderColor = 'var(--color-line)';
  let backgroundColor = '#ffffff';
  if (isCorrect) {
    borderColor = 'var(--color-ok-600)';
    backgroundColor = 'var(--color-ok-100)';
  } else if (isWrong) {
    borderColor = 'var(--color-err-600)';
    backgroundColor = 'var(--color-err-100)';
  }

  return (
    <button
      type="button"
      disabled={disabled || dimmed}
      onClick={() => onSelect?.(letter)}
      aria-label={`Pilihan ${letter}: ${text}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        minHeight: 48,
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: `2px solid ${borderColor}`,
        backgroundColor,
        opacity: dimmed ? 0.45 : 1,
        cursor: disabled ? 'default' : 'pointer',
        font: 'var(--text-body)',
        textAlign: 'left',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-forest-100)',
          color: 'var(--color-forest-900)',
          font: 'var(--text-label)',
          flexShrink: 0,
        }}
      >
        {letter}
      </span>
      <span style={{ flex: 1 }}>{text}</span>
      {isCorrect ? (
        <span aria-hidden="true" style={{ color: 'var(--color-ok-600)', fontWeight: 700 }}>
          ✓
        </span>
      ) : null}
      {isWrong ? (
        <span aria-hidden="true" style={{ color: 'var(--color-err-600)', fontWeight: 700 }}>
          ✗
        </span>
      ) : null}
      {(isCorrect || isWrong) && (
        <span className="visually-hidden">{isCorrect ? 'Benar' : 'Salah'}</span>
      )}
    </button>
  );
}
