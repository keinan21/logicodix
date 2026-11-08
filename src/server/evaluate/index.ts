/**
 * src/server/evaluate/index.ts — pilih mode dari AI_MODE (ARCHITECTURE §7).
 * Kalau "live" tetapi API key kosong → otomatis "contoh" + peringatan log.
 * Semua mode punya tanda tangan fungsi yang sama → ganti penyedia cukup ganti live.ts.
 */

import type { EvalRequest, EvalAiOutput, EvalBadge } from '../../shared/schema';
import type { Tip } from '../../shared/schema';
import { liveEvaluate } from './live';
import { pickContoh } from './contoh';
import { mockEvaluate } from './mock';
import { autoSummary, EvalCache } from './summary';
import { logEvent } from '../log';
import { AI, type AiMode } from '../../shared/constants';

export interface EvalResult {
  output: EvalAiOutput;
  badge: EvalBadge;
  source: 'live' | 'contoh' | 'mock' | 'fallback';
}

export interface EvaluateDeps {
  mode: AiMode;
  geminiApiKey?: string | undefined;
  geminiModel?: string | undefined;
  tips: Tip[];
  contoh: Record<string, unknown>;
  cache?: EvalCache | undefined;
}

export function selectMode(env: {
  AI_MODE?: string | undefined;
  GEMINI_API_KEY?: string | undefined;
}): { mode: AiMode; downgraded: boolean } {
  const raw = (env.AI_MODE ?? AI.DEFAULT_MODE) as AiMode;
  if (raw === 'live' && !env.GEMINI_API_KEY) {
    logEvent(
      undefined,
      undefined,
      'eval.mode',
      undefined,
      'warn',
      'AI_MODE=live tanpa key; turun ke contoh',
    );
    return { mode: 'contoh', downgraded: true };
  }
  return { mode: raw, downgraded: false };
}

export function createEvaluator(deps: EvaluateDeps) {
  const cache = deps.cache ?? new EvalCache();

  return {
    async evaluate(req: EvalRequest, seed: number): Promise<EvalResult> {
      // FR-H10: hasil lolos check dipakai ulang tanpa memanggil AI lagi.
      const cached = cache.get(req);
      if (cached) {
        return cached;
      }

      try {
        if (deps.mode === 'live' && deps.geminiApiKey) {
          const calls = cache.countAiCall(req);
          if (calls > AI.MAX_CALLS_PER_PLAYER_PER_RACE) {
            throw new Error('batas 1 panggilan AI per pemain per balapan terlampaui (FR-H10)');
          }
          const output = await liveEvaluate(
            req,
            deps.geminiApiKey,
            deps.geminiModel ?? 'gemini-2.0-flash',
            AI.TIMEOUT_S * 1000,
          );
          const result: EvalResult = { output, badge: 'dibuat-oleh-ai', source: 'live' };
          cache.set(req, result);
          return result;
        }
        if (deps.mode === 'contoh') {
          const entry = pickContoh(req, deps.contoh);
          if (entry) {
            const output: EvalAiOutput = {
              pattern: entry.pattern ?? '',
              tip: entry.tip ?? '',
              motivation: entry.motivation ?? '',
            };
            return { output, badge: entry.badge, source: 'contoh' };
          }
        }
        // mock (default) atau contoh kosong — mode mock untuk dev + e2e (ARCH §11), BUKAN AI.
        const output = mockEvaluate(req);
        return { output, badge: 'ringkasan-otomatis-bukan-ai', source: 'mock' };
      } catch (err) {
        // FR-H09: kegagalan AI tidak pernah menghentikan alur atau mengubah peringkat.
        logEvent(
          undefined,
          seed,
          'eval.fallback',
          undefined,
          'warn',
          `AI gagal: ${(err as Error).message}`,
        );
        const summary = autoSummary(req, deps.tips);
        return { output: summary.output, badge: summary.badge, source: 'fallback' };
      }
    },
  };
}
