import arrow from '../assets/kenney/arrow.png';

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

/** Teks opsi disisipkan sebelum titik kalimat: buang titik akhir supaya tidak ganda. */
const inline = (t: string | undefined) => t?.trim().replace(/\.+$/, '');

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
    <li className={`card eval-item${wrong ? ' is-wrong' : ''}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="eval-toggle">
        <span className={wrong ? 'eval-status eval-status-wrong' : 'eval-status eval-status-ok'}>
          Soal {questionNumber} — {wrong ? 'Salah' : 'Benar'}
        </span>
        <p className="eval-stem">{stem}</p>
        <img className="eval-arrow" src={arrow} alt="" aria-hidden="true" />
      </button>
      {open ? (
        <div className="eval-body">
          {claim ? <blockquote className="eval-claim">{claim}</blockquote> : null}
          {wrong ? (
            <p>
              Kamu memilih {inline(chosenText) ?? chosenLetter}, jawabannya{' '}
              {inline(answerText) ?? answerLetter}.
            </p>
          ) : null}
          {explanation ? <p>{explanation}</p> : null}
          {sources && sources.length > 0 ? (
            <ul className="eval-sources">
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
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
