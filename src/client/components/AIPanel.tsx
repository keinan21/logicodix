import type { EvalBadge } from '../../shared/schema';
import { Badge } from './Badge';

export interface AIPanelProps {
  /** null = masih menyusun. */
  content: { pattern: string | null; tip: string | null; motivation: string | null } | null;
  badge: EvalBadge;
  loading?: boolean;
}

/**
 * AIPanel — DESIGN §4: loading, pattern+tip, motivation, fallback, contoh.
 * Selalu ada badge sesuai asal teks (FR-H05). Ungu khusus AI (DESIGN §1).
 */
export function AIPanel({ content, badge, loading }: AIPanelProps) {
  const badgeKind =
    badge === 'dibuat-oleh-ai'
      ? 'ai'
      : badge === 'contoh-ai-dibuat-sebelumnya'
        ? 'example-ai'
        : 'auto-summary';

  return (
    <section
      aria-live="polite"
      style={{
        border: `2px solid var(--color-ai-600)`,
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-ai-100)',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <h3 style={{ margin: 0, font: 'var(--text-title)', color: 'var(--color-ai-600)' }}>
          Evaluasi AI
        </h3>
        {/* Badge asal teks baru bermakna setelah teksnya ada (FR-H05). */}
        {loading ? null : <Badge kind={badgeKind} />}
      </div>

      {loading || (!content && !loading) ? (
        <p style={{ margin: 0, font: 'var(--text-body)', color: 'var(--color-muted)' }}>
          AI sedang menyusun evaluasi…
        </p>
      ) : null}

      {content?.motivation ? (
        <p style={{ margin: 0, font: 'var(--text-body)' }}>{content.motivation}</p>
      ) : null}

      {content?.pattern ? (
        <p style={{ margin: 0, font: 'var(--text-body)' }}>{content.pattern}</p>
      ) : null}

      {content?.tip ? (
        <p style={{ margin: 'var(--space-2) 0 0', font: 'var(--text-body)' }}>
          <strong>Tips:</strong> {content.tip}
        </p>
      ) : null}
    </section>
  );
}
