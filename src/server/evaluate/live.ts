/**
 * src/server/evaluate/live.ts — mode live: Gemini Flash termurah (FR-H06/H07, ARCHITECTURE §7).
 * - Input hanya ID soal, jenis, pilihan, kunci, penjelasan, tipe, topik. TANPA nickname.
 * - Timeout 8 detik dengan AbortController (FR-H07).
 * - Keluaran lolos check.ts atau dibuang.
 * TODO(P-06): nama model Flash termurah dicek saat setup; GEMINI_MODEL dari env.
 */

import { GoogleGenAI } from '@google/genai';
import type { EvalRequest, EvalAiOutput } from '../../shared/schema';
import { buildPrompt } from './prompt';
import { checkAiOutput } from './check';
import { AI } from '../../shared/constants';

export class LiveEvaluateError extends Error {}

export async function liveEvaluate(
  req: EvalRequest,
  apiKey: string,
  model: string,
  timeoutMs: number = AI.TIMEOUT_S * 1000,
): Promise<EvalAiOutput> {
  if (!apiKey) throw new LiveEvaluateError('GEMINI_API_KEY kosong');

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(req);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // TODO(T-15): verifikasi respons mode JSON @google/genai 2.31 (responseMimeType application/json).
    const resp = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const text = resp.text ?? '';
    const parsed = parseJson(text);
    const checked = checkAiOutput(parsed, req);
    if (!checked.ok) {
      throw new LiveEvaluateError(`check gagal: ${checked.reasons.map((r) => r.rule).join(', ')}`);
    }
    return normalize(parsed);
  } finally {
    clearTimeout(timer);
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
