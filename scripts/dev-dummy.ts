/**
 * scripts/dev-dummy.ts — jalankan server dengan bank soal DUMMY agar web bisa dicoba
 * sebelum soal asli terverifikasi. Bukan untuk produksi maupun demo juri.
 *
 * Pakai:
 *   bun run dev:dummy     → Vite 5173 + server 3000 (buka http://localhost:5173)
 *   bun run start:dummy   → satu port 3000 (setelah bun run build)
 *
 * content/ tidak diubah. Gate FR-K01 tetap dijalankan untuk bank yang dipakai.
 */
import { readContent } from '../src/server/content';
import { start } from '../src/server/index';
import { DUMMY_QUESTIONS } from './dummy-questions';

process.env.AI_MODE = process.env.AI_MODE ?? 'mock';

const port = Number(process.env.PORT ?? 3000);
const content = readContent();

start(port, { content: { ...content, verified: DUMMY_QUESTIONS } });
