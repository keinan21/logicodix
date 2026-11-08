import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PodiumScreen } from '../src/client/screens/Podium';
import type { RaceEnd } from '../src/shared/schema';

const raceEnd: RaceEnd = {
  ranking: [
    {
      rank: 1,
      nickname: 'Dina',
      animalId: 'penyu',
      isBot: false,
      correctCount: 5,
      status: 'finished',
    },
    {
      rank: 2,
      nickname: 'Raka',
      animalId: 'harimau',
      isBot: false,
      correctCount: 5,
      status: 'finished',
    },
    {
      rank: 3,
      nickname: 'BOT Teliti',
      animalId: 'burung',
      isBot: true,
      correctCount: 4,
      status: 'outOfQuestions',
    },
    {
      rank: 4,
      nickname: 'Sari',
      animalId: 'gajah',
      isBot: false,
      correctCount: 3,
      status: 'left',
    },
  ],
};

function render() {
  return renderToStaticMarkup(
    createElement(PodiumScreen, {
      raceEnd,
      myNickname: 'Raka',
      onViewEvaluation: vi.fn(),
      onPlayAgain: vi.fn(),
    }),
  );
}

describe('Podium (FR-H01)', () => {
  it('menampilkan tangga juara 1-2-3 dengan angka posisi dan badge BOT', () => {
    const html = render();

    expect(html).toContain('Hasil balapan');
    expect(html).toContain('aria-label="Posisi 1"');
    expect(html).toContain('aria-label="Posisi 3"');
    expect(html).toContain('BOT Teliti');
    expect(html.match(/>BOT<\/span>/g)).toHaveLength(1);
  });

  it('menyorot baris dan kartu pemain sendiri', () => {
    const html = render();

    expect(html.match(/podium-me/g)).toHaveLength(1);
    expect(html).toContain('podium-me');
  });

  it('menampilkan tabel semua peserta termasuk status Keluar dan tombol lanjutan', () => {
    const html = render();

    expect(html).toContain('Semua peserta');
    expect(html.match(/<tr/g)).toHaveLength(5); // 1 header + 4 peserta
    expect(html).toContain('Keluar');
    expect(html).toContain('Lihat evaluasi AI');
    expect(html).toContain('Main lagi');
  });

  it('tetap stabil tanpa data hasil balapan', () => {
    const html = renderToStaticMarkup(
      createElement(PodiumScreen, {
        raceEnd: null,
        myNickname: 'Raka',
        onViewEvaluation: vi.fn(),
        onPlayAgain: vi.fn(),
      }),
    );

    expect(html).toContain('Belum ada hasil balapan.');
  });
});
