/**
 * src/server/log.ts — log JSON tanpa nickname (NFR-09, FR-H06, ARCHITECTURE §13).
 * Hanya field allowlist per event yang boleh masuk log. Nickname/connectionId dibuang di sini.
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogFields {
  ts?: string;
  roomId?: string;
  seed?: number;
  event?: string;
  phase?: string;
  level?: LogLevel;
  message?: string;
  /** Detail bebas hanya untuk event yang memang mengizinkan (mis. konten). */
  detail?: unknown;
}

/** Field yang diizinkan per event. Event lain → detail dibuang. */
const ALLOWED_DETAIL_EVENTS = new Set([
  'server.start',
  'content.invalid',
  'eval.fallback',
  'match.timeout',
]);

function nowIso(): string {
  // Timestamp log infra (bukan logika game) — diizinkan memakai waktu sungguhan.
  return new Date().toISOString();
}

/**
 * Log satu baris JSON. Membuang field tidak dikenal & field terlarang (nickname, connectionId, …).
 */
export function logEvent(
  roomId: string | undefined,
  seed: number | undefined,
  event: string,
  phase: string | undefined,
  level: LogLevel,
  message: string,
  detail?: unknown,
): void {
  const entry: Record<string, unknown> = {
    ts: nowIso(),
    level,
    event,
    message,
  };
  if (roomId !== undefined) entry.roomId = roomId;
  if (seed !== undefined) entry.seed = seed;
  if (phase !== undefined) entry.phase = phase;
  if (detail !== undefined && ALLOWED_DETAIL_EVENTS.has(event)) {
    entry.detail = detail;
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}
