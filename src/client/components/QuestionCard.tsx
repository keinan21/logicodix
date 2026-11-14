import type { QuestionPublic } from '../../shared/schema';

export interface QuestionCardProps {
  question: QuestionPublic;
  /** Indeks soal dalam urutan room (1-based untuk tampilan). */
  displayNumber: number;
  /** Penjelasan + sumber tampil setelah menjawab — benar maupun salah (FR-B05). */
  explanation?: string | undefined;
  sources?: { judul: string; url: string; lembaga: string }[] | undefined;
  /** Sisa detik lock (5..1) bila sedang terkunci. */
  lockRemainingS?: number | undefined;
  /** Hasil jawaban terakhir; menentukan warna panel penjelasan. */
  correct?: boolean | undefined;
  /** Lewati masa baca penjelasan lebih cepat (hanya saat jawaban benar). */
  onSkipExplanation?: (() => void) | undefined;
}

/**
 * QuestionCard — DESIGN §4: variant klaim / pengetahuan; dengan/tanpa penjelasan.
 * Kunci, penjelasan, sumber hanya tampil setelah menjawab (FR-K11).
 * Catatan: sebelum menjawab, payload hanya stem/claim/options (FR-K11) —
 * chip jenis soal sengaja TIDAK tampil di layar balapan; chip tampil di Evaluasi.
 */
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
