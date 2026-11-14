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
    <section aria-live="polite" className="ai-panel">
      <div className="ai-panel-head">
        <h3 className="ai-panel-title">Evaluasi AI</h3>
        {/* Badge asal teks baru bermakna setelah teksnya ada (FR-H05). */}
        {loading ? null : <Badge kind={badgeKind} />}
      </div>

      {loading || (!content && !loading) ? <p>AI sedang menyusun evaluasi…</p> : null}

      {content?.motivation ? <p>{content.motivation}</p> : null}

      {content?.pattern ? <p>{content.pattern}</p> : null}

      {content?.tip ? (
        <p className="ai-panel-tip">
          <strong>Tips:</strong> {content.tip}
        </p>
      ) : null}
    </section>
  );
}
