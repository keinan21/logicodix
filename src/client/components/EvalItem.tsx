export interface EvalItemProps {
  questionNumber: number;
  stem: string;
  claim?: string | undefined;
  chosenText?: string | undefined;
  answerText?: string | undefined;
  /** Pilihan pemain (huruf A–D) — hanya untuk soal salah. */
  chosenLetter?: string | undefined;
  /** Kunci (huruf A–D) — hanya untuk soal salah. */
  answerLetter?: string | undefined;
  explanation?: string | undefined;
  sources?: { judul: string; url: string; lembaga: string }[] | undefined;
  wrong: boolean;
  open: boolean;
  onToggle: () => void;
}

/**
 * EvalItem — DESIGN §4: benar (tertutup), salah (terbuka).
 * Soal salah terbuka otomatis berisi pilihan pemain, kunci, penjelasan, sumber (FR-H02).
 */
export function EvalItem({
  questionNumber,
  stem,
  claim,
  chosenText,
  answerText,
  chosenLetter,
  answerLetter,
  explanation,
  sources,
  wrong,
  open,
  onToggle,
}: EvalItemProps) {
  return (
    <li className={`card eval-item${wrong ? ' is-wrong' : ''}`} style={{ listStyle: 'none' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          padding: 0,
        }}
      >
        <span
          style={{
            font: 'var(--text-label)',
            color: wrong ? 'var(--color-err-600)' : 'var(--color-ok-600)',
          }}
        >
          Soal {questionNumber} — {wrong ? 'Salah' : 'Benar'} {open ? '▲' : '▼'}
        </span>
        <p style={{ margin: 'var(--space-1) 0 0', font: 'var(--text-body)' }}>{stem}</p>
      </button>
      {open ? (
        <div
          style={{
            marginTop: 'var(--space-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {claim ? <blockquote className="eval-claim">{claim}</blockquote> : null}
          {wrong ? (
            <p style={{ margin: 0, font: 'var(--text-body)' }}>
              Kamu memilih {chosenText ?? chosenLetter}, jawabannya {answerText ?? answerLetter}.
            </p>
          ) : null}
          {explanation ? (
            <p style={{ margin: 0, font: 'var(--text-body)' }}>{explanation}</p>
          ) : null}
          {sources && sources.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', font: 'var(--text-small)' }}>
              {sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--color-forest-700)' }}
                  >
                    {s.judul} — {s.lembaga}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
