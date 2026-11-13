/**
 * scripts/check-content.ts — validator struktural bank soal (FR-K10).
 * Hanya memeriksa struktur; kebenaran isi diverifikasi manusia (FR-K07).
 * Tidak membuka URL sumber (CI tidak bergantung situs luar).
 *
 * Keluar: error menyebut nama file + field → exit 1.
 * Peringatan (tidak gagal): sebaran tipe ≠2 (FR-K02), pilihan terpanjang adalah kunci
 * dan >1,5× pilihan terpendek (FR-K04), draf tanpa sumber.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { questionSchema } from '../src/shared/schema';
import type { Question } from '../src/shared/schema';

const ROOT = process.cwd();

interface Issue {
  file: string;
  field: string;
  message: string;
}

function loadQuestions(): { questions: Question[]; errors: Issue[]; warnings: Issue[] } {
  const dir = join(ROOT, 'content', 'questions');
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const questions: Question[] = [];

  if (!existsSync(dir)) {
    errors.push({
      file: 'content/questions/',
      field: '(folder)',
      message: 'folder bank soal tidak ditemukan',
    });
    return { questions, errors, warnings };
  }

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const ids = new Set<string>();

  for (const name of files) {
    const file = name;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));
    } catch {
      errors.push({ file, field: '(json)', message: 'bukan JSON valid' });
      continue;
    }

    const result = questionSchema.safeParse(parsed);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ file, field: issue.path.join('.') || '(root)', message: issue.message });
      }
      continue;
    }

    const q = result.data;
    if (ids.has(q.id)) {
      errors.push({ file, field: 'id', message: `id ganda: ${q.id}` });
      continue;
    }
    ids.add(q.id);
    questions.push(q);

    // FR-K04: pilihan terpanjang adalah kunci dan >1,5× pilihan terpendek → peringatan
    const lengths = q.options.map((o) => o.length);
    const shortest = Math.min(...lengths);
    const longestIdx = lengths.indexOf(Math.max(...lengths));
    if (longestIdx === q.answerIndex && shortest > 0 && lengths[longestIdx]! > 1.5 * shortest) {
      warnings.push({
        file,
        field: 'options',
        message: 'pilihan terpanjang adalah kunci dan >1,5× pilihan terpendek (FR-K04)',
      });
    }

    // Draf tanpa sumber → peringatan (verifikasi P-02/P-03)
    if (q.status === 'draf' && q.sources.length === 0) {
      warnings.push({
        file,
        field: 'sources',
        message: 'soal draf belum punya sumber (TODO-SUMBER)',
      });
    }
  }

  return { questions, errors, warnings };
}

function checkDistribution(questions: Question[], warnings: Issue[]): void {
  // FR-K02: setiap tipe misinformasi muncul tepat 2 soal klaim — peringatan bila belum
  const counts = new Map<string, number>();
  for (const q of questions) {
    if (q.kind === 'klaim' && q.misinfoType) {
      counts.set(q.misinfoType, (counts.get(q.misinfoType) ?? 0) + 1);
    }
  }
  for (const type of [
    'konten-palsu-konspirasi',
    'menyesatkan-salah-tafsir-data',
    'konteks-salah',
    'catut-otoritas',
  ]) {
    const n = counts.get(type) ?? 0;
    if (n !== 2) {
      warnings.push({
        file: '(bank)',
        field: 'misinfoType',
        message: `tipe ${type} muncul ${n} soal klaim (target 2) — peringatan, bukan kegagalan (FR-K02)`,
      });
    }
  }
}

function main(): void {
  const { questions, errors, warnings } = loadQuestions();
  checkDistribution(questions, warnings);

  for (const w of warnings) {
    console.warn(`PERINGATAN ${w.file}: ${w.field} — ${w.message}`);
  }
  for (const e of errors) {
    console.error(`ERROR ${e.file}: ${e.field} — ${e.message}`);
  }

  console.log(
    `Soal termuat: ${questions.length} (draf: ${questions.filter((q) => q.status === 'draf').length}, terverifikasi: ${questions.filter((q) => q.status === 'terverifikasi').length})`,
  );

  if (errors.length > 0) {
    console.error(`Validasi konten GAGAL: ${errors.length} error.`);
    process.exit(1);
  }
  console.log('Validasi konten lulus (struktural).');
}

main();
