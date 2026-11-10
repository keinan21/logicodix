/**
 * src/server/evaluate/live.ts — mode live: Gemini Flash termurah (FR-H06/H07, ARCHITECTURE §7).
 * - Input hanya ID soal, jenis, pilihan, kunci, penjelasan, tipe, topik. TANPA nickname.
 * - Timeout 8 detik dengan AbortController (FR-H07).
 * - Keluaran lolos check.ts atau dibuang.
 * TODO(P-06): nama model Flash termurah dicek saat setup; GEMINI_MODEL dari env.
 */

import { GoogleGenAI } from '@google/genai';
import type { EvalAiOutput, EvalRequest } from '../../shared/schema';
import { evalAiOutputSchema } from '../../shared/schema';
import { AI } from '../../shared/constants';
import { buildPrompt } from './prompt';
import { checkAiOutput } from './check';

export class LiveEvaluateError extends Error {}

export interface GenAiClient {
  models: {
    generateContent(params: {
      model: string;
      contents: string;
      config?: { responseMimeType?: string };
    }): Promise<{ text?: string | null }>;
  };
}

export async function liveEvaluate(
  req: EvalRequest,
  apiKey: string,
  model: string,
  timeoutMs: number = AI.TIMEOUT_S * 1000,
  client?: GenAiClient,
): Promise<EvalAiOutput> {
  if (!apiKey) throw new LiveEvaluateError('GEMINI_API_KEY kosong');

  const ai = client ?? new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(req);

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new LiveEvaluateError(`timeout ${timeoutMs}ms terlampaui (FR-H07)`));
    }, timeoutMs);
  });

  try {
    const resp = await Promise.race([
      ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      }),
      timeoutPromise,
    ]);
    const text = resp.text ?? '';
    const parsed = parseJson(text);
    const schemaResult = evalAiOutputSchema.safeParse(parsed);
    if (!schemaResult.success) {
      throw new LiveEvaluateError(
        `keluaran tidak sesuai schema: ${schemaResult.error.issues[0]?.message ?? 'format'}`,
      );
    }
    const checked = checkAiOutput(parsed, req);
    if (!checked.ok) {
      throw new LiveEvaluateError(`check gagal: ${checked.reasons.map((r) => r.rule).join(', ')}`);
    }
    return normalize(parsed);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function parseJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new LiveEvaluateError('keluaran bukan JSON');
  return JSON.parse(text.slice(start, end + 1)) as unknown;
}

function normalize(raw: unknown): EvalAiOutput {
  const o = raw as { pattern?: string; tip?: string; motivation?: string };
  return {
    pattern: typeof o.pattern === 'string' ? o.pattern : '',
    tip: typeof o.tip === 'string' ? o.tip : '',
    motivation: typeof o.motivation === 'string' ? o.motivation : '',
  };
}
