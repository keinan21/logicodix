import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EvaluationScreen } from '../../src/client/screens/Evaluation';
import type { EvalReady } from '../../src/shared/schema';
import '../../src/client/styles.css';
const mode = new URLSearchParams(location.search).get('mode');
const badge =
  mode === 'loading'
    ? null
    : mode === 'contoh'
      ? 'contoh-ai-dibuat-sebelumnya'
      : mode === 'fallback'
        ? 'ringkasan-otomatis-bukan-ai'
        : 'dibuat-oleh-ai';
const evaluation: EvalReady = {
  questions:
    mode === 'empty'
      ? []
      : [
          {
            questionId: 'uji',
            kind: 'klaim',
            stem: 'Soal contoh untuk pengujian',
            claim: 'Klaim contoh, bukan materi pembelajaran.',
            options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
            chosenIndex: mode === 'benar' ? 0 : 1,
            answerIndex: 0,
            explanation: 'Penjelasan contoh.',
            sources: [
              {
                judul: 'Sumber pengujian',
                url: 'https://example.org',
                lembaga: 'Contoh',
                tanggalCek: '2026-11-11',
              },
            ],
            topic: 'sampah',
            misinfoType: 'konteks-salah',
          },
        ],
  aiSection: badge
    ? {
        pattern: mode === 'benar' ? null : 'Pola contoh untuk pengujian.',
        tip: mode === 'benar' ? null : 'Tips contoh.',
        motivation: mode === 'benar' ? 'Motivasi contoh.' : null,
        badge,
      }
    : null,
  badge,
};
function Fixture() {
  const [action, setAction] = useState('');
  return (
    <>
      <EvaluationScreen
        evaluation={evaluation}
        onPlayAgain={() => setAction('Main')}
        onBackToResults={() => setAction('Hasil')}
      />
      <output aria-label="Navigasi">{action}</output>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
