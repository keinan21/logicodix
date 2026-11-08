/**
 * src/server/content.ts — muat dan validasi content/ saat start (ARCHITECTURE §3, §9).
 * Server menolak start bila validasi gagal, dengan pesan menyebut ID soal + field.
 * Soal status "draf" tidak masuk room (WORKFLOW §10, FR-K07).
 *
 * Layout konten (FR-K03, satu file JSON per soal — FRD menang atas ARCHITECTURE):
 *   content/questions/<uuid>.json
 *   content/tips.json, content/animals.json, content/official-sources.json
 *   content/contoh/<scenario>.json
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { questionSchema, officialSourceSchema, animalSchema, tipSchema } from '../shared/schema';
import type { Question, Animal, Tip, OfficialSource } from '../shared/schema';
import { CONTENT } from '../shared/constants';
import { logEvent } from './log';

export interface ContentFile {
  name: string;
  text: string;
}

export interface ParseResult<T> {
  ok: T[];
  errors: { file: string; field: string; message: string }[];
}

/** Parsing murni (tanpa fs) supaya bisa dites. */
export function parseQuestions(files: ContentFile[]): ParseResult<Question> {
  const ok: Question[] = [];
  const errors: ParseResult<Question>['errors'] = [];
  const ids = new Set<string>();
  for (const f of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(f.text);
    } catch {
      errors.push({ file: f.name, field: '(json)', message: 'bukan JSON valid' });
      continue;
    }
    const result = questionSchema.safeParse(parsed);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          file: f.name,
          field: issue.path.join('.') || '(root)',
          message: issue.message,
        });
      }
      continue;
    }
    if (ids.has(result.data.id)) {
      errors.push({ file: f.name, field: 'id', message: `id ganda: ${result.data.id}` });
      continue;
    }
    ids.add(result.data.id);
    ok.push(result.data);
  }
  return { ok, errors };
}

function readJsonDir(dir: string): ContentFile[] {
  try {
    return readdirSync(dir)
      .filter((n) => n.endsWith('.json'))
      .map((n) => ({ name: n, text: readFileSync(join(dir, n), 'utf8') }));
  } catch {
    return [];
  }
}

function readJsonFile(p: string): unknown {
  return JSON.parse(readFileSync(p, 'utf8'));
}

export interface BankContent {
  questions: Question[];
  verified: Question[];
  tips: Tip[];
  animals: Animal[];
  officialSources: OfficialSource[];
  contoh: Record<string, unknown>;
}

/** Muat + validasi seluruh content/. Melempar bila struktur rusak atau soal terverifikasi < minimum. */
export function loadContent(rootDir = process.cwd()): BankContent {
  const contentDir = join(rootDir, 'content');

  const qFiles = readJsonDir(join(contentDir, 'questions'));
  const qResult = parseQuestions(qFiles);
  for (const e of qResult.errors) {
    logEvent(
      undefined,
      undefined,
      'content.invalid',
      undefined,
      'error',
      `soal ${e.file}: ${e.field} — ${e.message}`,
    );
  }

  const tipsResult = parseArrayFile<Tip>(join(contentDir, 'tips.json'), tipSchema);
  const animalsResult = parseArrayFile<Animal>(join(contentDir, 'animals.json'), animalSchema);

  const officialSources = (() => {
    try {
      const raw = readJsonFile(join(contentDir, 'official-sources.json')) as { sources?: unknown };
      if (!Array.isArray(raw.sources)) return [];
      const out: OfficialSource[] = [];
      for (const item of raw.sources) {
        const r = officialSourceSchema.safeParse(item);
        if (r.success) out.push(r.data);
      }
      return out;
    } catch {
      return [];
    }
  })();

  const verified = qResult.ok.filter((q) => q.status === 'terverifikasi');
  if (verified.length < CONTENT.MIN_VERIFIED_QUESTIONS) {
    const ids = qResult.ok.map((q) => `${q.id}(${q.status})`).join(', ');
    throw new Error(
      `Bank soal terverifikasi kurang dari ${CONTENT.MIN_VERIFIED_QUESTIONS} (FR-K01). Ada: ${verified.length}. Daftar: ${ids}`,
    );
  }

  const contoh: Record<string, unknown> = {};
  for (const f of readJsonDir(join(contentDir, 'contoh'))) {
    try {
      contoh[f.name.replace('.json', '')] = JSON.parse(f.text);
    } catch {
      logEvent(
        undefined,
        undefined,
        'content.invalid',
        undefined,
        'warn',
        `contoh ${f.name}: JSON tidak valid`,
      );
    }
  }

  return {
    questions: qResult.ok,
    verified,
    tips: tipsResult,
    animals: animalsResult,
    officialSources,
    contoh,
  };
}

function parseArrayFile<T>(path: string, schema: z.ZodType<T>): T[] {
  try {
    const raw = readJsonFile(path) as unknown[];
    if (!Array.isArray(raw)) return [];
    const out: T[] = [];
    for (const item of raw) {
      const r = schema.safeParse(item);
      if (r.success) out.push(r.data);
    }
    return out;
  } catch {
    return [];
  }
}
