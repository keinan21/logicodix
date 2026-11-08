export type BadgeKind = 'ai' | 'auto-summary' | 'example-ai' | 'bot';

export interface BadgeProps {
  kind: BadgeKind;
}

/**
 * Badge — DESIGN §4/§7.
 * - ai: "Dibuat oleh AI" (ungu khusus AI)
 * - auto-summary: "Ringkasan otomatis (bukan AI)"
 * - example-ai: "Contoh AI (dibuat sebelumnya)"
 * - bot: "BOT"
 */
export function Badge({ kind }: BadgeProps) {
  const map: Record<BadgeKind, { text: string; bg: string; color: string }> = {
    ai: { text: 'Dibuat oleh AI', bg: 'var(--color-ai-100)', color: 'var(--color-ai-600)' },
    'auto-summary': {
      text: 'Ringkasan otomatis (bukan AI)',
      bg: 'var(--color-forest-100)',
      color: 'var(--color-muted)',
    },
    'example-ai': {
      text: 'Contoh AI (dibuat sebelumnya)',
      bg: 'var(--color-ai-100)',
      color: 'var(--color-ai-600)',
    },
    bot: { text: 'BOT', bg: 'var(--color-bot)', color: '#ffffff' },
  };
  const b = map[kind];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: 'var(--space-1) var(--space-2)',
        borderRadius: 'var(--radius-pill)',
        font: 'var(--text-label)',
        backgroundColor: b.bg,
        color: b.color,
      }}
    >
      {b.text}
    </span>
  );
}
