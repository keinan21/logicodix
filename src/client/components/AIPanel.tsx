import type { EvalBadge } from '../../shared/schema';
import { Badge } from './Badge';

export interface AIPanelProps {
  /** null = masih menyusun. */
  content: { pattern: string | null; tip: string | null; motivation: string | null } | null;
  badge: EvalBadge | null;
  loading?: boolean;
}

/**
 * AIPanel — DESIGN §4: loading, pattern+tip, motivation, fallback, contoh.
 * Selalu ada badge sesuai asal teks (FR-H05). Ungu khusus AI (DESIGN §1).
 */
export function AIPanel({ content, badge, loading }: AIPanelProps) {
  const isExample = badge === 'contoh-ai-dibuat-sebelumnya';
  const isAutomatic = badge === 'ringkasan-otomatis-bukan-ai';
  const badgeKind =
    badge === 'dibuat-oleh-ai'
      ? 'ai'
      : badge === 'contoh-ai-dibuat-sebelumnya'
        ? 'example-ai'
        : 'auto-summary';

  return (
    <section
      aria-live="polite"
      aria-busy={loading === true}
      className={`evaluation-message-panel ${isAutomatic ? 'is-automatic' : ''} ${isExample ? 'is-example' : ''}`}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <h2 className="evaluation-panel-title">
          {isExample ? 'Mode Contoh' : isAutomatic ? 'Ringkasan Otomatis' : 'Evaluasi AI'}
        </h2>
        {/* Badge asal teks baru bermakna setelah teksnya ada (FR-H05). */}
        {loading || badge === null ? null : <Badge kind={badgeKind} />}
      </div>

      {loading ? (
        <p style={{ margin: 0, font: 'var(--text-body)', color: 'var(--color-muted)' }}>
          AI sedang menyusun evaluasi…
        </p>
      ) : null}
      {!loading && !content ? (
        <p role="status">Evaluasi belum tersedia. Kamu tetap bisa membaca penjelasan soal.</p>
      ) : null}

      {content?.motivation ? (
        <p style={{ margin: 0, font: 'var(--text-body)' }}>{content.motivation}</p>
      ) : null}

      {content?.pattern ? (
        <p style={{ margin: 0, font: 'var(--text-body)' }}>{content.pattern}</p>
      ) : null}

      {content?.tip ? (
        <p className="evaluation-tip">
          <strong>Tips:</strong> {content.tip}
        </p>
      ) : null}
    </section>
  );
}
