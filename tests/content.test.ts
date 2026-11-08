import { describe, it, expect } from 'vitest';
import { parseQuestions } from '../src/server/content';
import type { Question } from '../src/shared/schema';

const base = {
  id: 'aaaaaaaa-0001-4001-8001-000000000001',
  kind: 'klaim',
  stem: 'Sebuah unggahan menyebut rekayasa cuaca sengaja dilakukan untuk membuat hujan.',
  claim: 'Pemerintah sengaja membuat hujan di satu kota saja.',
  options: [
    'Opsi satu yang cukup panjang.',
    'Opsi dua juga panjang.',
    'Opsi tiga panjang sama.',
    'Opsi empat panjangnya sama.',
  ],
  answerIndex: 0,
  explanation: 'Penjelasan draf yang menunggu verifikasi sumber resmi.',
  sources: [],
  misinfoType: 'konten-palsu-konspirasi',
  topic: 'iklim-cuaca',
  status: 'draf',
  writtenBy: 'c-rakyan',
} as const satisfies Omit<Question, 'sources'> & { sources: unknown[] };

function file(id: string, data: unknown) {
  return { name: `${id}.json`, text: typeof data === 'string' ? data : JSON.stringify(data) };
}

describe('content.parseQuestions', () => {
  it('soal klaim & pengetahuan draf yang strukturnya benar diterima', () => {
    const r = parseQuestions([
      file('q1', base),
      file('q2', {
        ...base,
        id: 'aaaaaaaa-0002-4002-8002-000000000002',
        kind: 'pengetahuan',
        claim: undefined,
        misinfoType: undefined,
      }),
    ]);
    expect(r.errors).toEqual([]);
    expect(r.ok).toHaveLength(2);
  });

  it('JSON tidak valid → error menyebut file', () => {
    const r = parseQuestions([file('q1', '{ bukan json')]);
    expect(r.errors.some((e) => e.file === 'q1.json' && e.field === '(json)')).toBe(true);
  });

  it('field wajib hilang → error menyebut field', () => {
    const { stem, ...rest } = base as Record<string, unknown>;
    void stem;
    const r = parseQuestions([file('q1', rest)]);
    expect(r.errors.some((e) => e.field === 'stem')).toBe(true);
  });

  it('id ganda → error', () => {
    const r = parseQuestions([file('a', base), file('b', base)]);
    expect(r.errors.some((e) => e.field === 'id')).toBe(true);
  });

  it('pilihan bukan 4 → error', () => {
    const r = parseQuestions([file('q1', { ...base, options: base.options.slice(0, 3) })]);
    expect(r.errors.some((e) => e.field === 'options')).toBe(true);
  });

  it('answerIndex di luar 0–3 → error', () => {
    const r = parseQuestions([file('q1', { ...base, answerIndex: 5 })]);
    expect(r.errors.some((e) => e.field === 'answerIndex')).toBe(true);
  });

  it('stem > 160 karakter → error', () => {
    const r = parseQuestions([file('q1', { ...base, stem: 'x'.repeat(161) })]);
    expect(r.errors.some((e) => e.field === 'stem')).toBe(true);
  });

  it('klaim tanpa misinfoType → error; pengetahuan dengan misinfoType → error', () => {
    const r1 = parseQuestions([file('q1', { ...base, misinfoType: undefined })]);
    expect(r1.errors.length).toBeGreaterThan(0);
    const r2 = parseQuestions([
      file('q2', {
        ...base,
        id: 'aaaaaaaa-0002-4002-8002-000000000002',
        kind: 'pengetahuan',
        claim: undefined,
        misinfoType: 'konteks-salah',
      }),
    ]);
    expect(r2.errors.length).toBeGreaterThan(0);
  });

  it('terverifikasi tanpa sumber → error (FR-K06)', () => {
    const r = parseQuestions([file('q1', { ...base, status: 'terverifikasi' })]);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('terverifikasi: writtenBy sama reviewedBy → error (FR-K07)', () => {
    const r = parseQuestions([
      file('q1', {
        ...base,
        status: 'terverifikasi',
        reviewedBy: 'c-rakyan',
        reviewedAt: '2026-11-09',
        sources: [
          {
            judul: 'Sumber resmi',
            url: 'https://bmkg.go.id/x',
            lembaga: 'BMKG',
            tanggalCek: '2026-11-09',
          },
        ],
      }),
    ]);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('terverifikasi lengkap diterima', () => {
    const r = parseQuestions([
      file('q1', {
        ...base,
        status: 'terverifikasi',
        reviewedBy: 'd-keinan21',
        reviewedAt: '2026-11-09',
        sources: [
          {
            judul: 'Sumber resmi',
            url: 'https://bmkg.go.id/x',
            lembaga: 'BMKG',
            tanggalCek: '2026-11-09',
          },
        ],
      }),
    ]);
    expect(r.errors).toEqual([]);
    expect(r.ok).toHaveLength(1);
  });
});
