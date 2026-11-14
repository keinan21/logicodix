/**
 * scripts/ai-live-check.ts — uji sekali jalan mode AI live dengan key asli (FR-H06–H07).
 * Jalankan: GEMINI_API_KEY=... [GEMINI_MODEL=...] bun run ai-live
 * Tidak mencetak key. Keluar dengan kode 1 bila gagal.
 */
import { liveEvaluate } from '../src/server/evaluate/live';
import type { EvalRequest } from '../src/shared/schema';

const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
if (!key) {
  console.error('GEMINI_API_KEY kosong');
  process.exit(1);
}

const req: EvalRequest = {
  questions: [
    {
      questionId: 'q-1',
      kind: 'klaim',
      chosenIndex: 1,
      answerIndex: 0,
      explanation: 'Penjelasan klaim tentang sampah.',
      misinfoType: 'konteks-salah',
      topic: 'sampah',
    },
  ],
};

const t0 = performance.now();
try {
  const out = await liveEvaluate(req, key, model);
  console.log(`OK model=${model} ${Math.round(performance.now() - t0)}ms`);
  console.log(JSON.stringify(out, null, 2));
} catch (e) {
  console.error(`GAGAL model=${model} ${Math.round(performance.now() - t0)}ms:`, String(e));
  process.exit(1);
}
