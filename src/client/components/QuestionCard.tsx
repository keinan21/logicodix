import type { QuestionPublic } from '../../shared/schema';

export interface QuestionCardProps {
  question: QuestionPublic;
  /** Indeks soal dalam urutan room (1-based untuk tampilan). */
  displayNumber: number;
  /** Penjelasan + sumber hanya tampil setelah pemain menjawab salah (FR-B05). */
  explanation?: string | undefined;
  sources?: { judul: string; url: string; lembaga: string }[] | undefined;
  /** Sisa detik lock (5..1) bila sedang terkunci. */
  lockRemainingS?: number | undefined;
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
}: QuestionCardProps) {
  return (
    <article className="card" aria-labelledby={`question-${displayNumber}`}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span style={{ font: 'var(--text-label)', color: 'var(--color-muted)' }}>
          Soal {displayNumber}
        </span>
      </div>

      <h2
        id={`question-${displayNumber}`}
        style={{ font: 'var(--text-title)', margin: '0 0 var(--space-2)' }}
      >
        {question.stem}
      </h2>

      {question.claim ? (
        <blockquote
          style={{
            margin: '0 0 var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderLeft: `4px solid var(--color-forest-500)`,
            backgroundColor: 'var(--color-forest-100)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {question.claim}
        </blockquote>
      ) : null}

      {explanation ? (
        <div
          style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-forest-100)',
          }}
        >
          <p style={{ margin: '0 0 var(--space-2)', font: 'var(--text-body)' }}>{explanation}</p>
          {lockRemainingS !== undefined ? (
            <p style={{ margin: 0, font: 'var(--text-small)', color: 'var(--color-muted)' }}>
              Lanjut dalam {lockRemainingS} detik…
            </p>
          ) : null}
          {sources && sources.length > 0 ? (
            <ul
              style={{
                margin: 'var(--space-2) 0 0',
                paddingLeft: 'var(--space-4)',
                font: 'var(--text-small)',
              }}
            >
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
    </article>
  );
}
