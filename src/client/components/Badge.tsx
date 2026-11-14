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
  const text: Record<BadgeKind, string> = {
    ai: 'Dibuat oleh AI',
    'auto-summary': 'Ringkasan otomatis (bukan AI)',
    'example-ai': 'Contoh AI (dibuat sebelumnya)',
    bot: 'BOT',
  };

  return <span className={`badge badge-${kind}`}>{text[kind]}</span>;
}
