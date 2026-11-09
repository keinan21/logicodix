import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RaceScreen } from '../src/client/screens/Race';
import type { RoomState } from '../src/shared/schema';

const question = {
  stem: 'Suhu bumi naik karena gas rumah kaca.',
  claim: 'Bumi memanas karena lubang ozon.',
  options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
};

function makeState(overrides: Partial<RoomState> = {}): RoomState {
  return {
    roomId: 'room-uji',
    phase: 'racing',
    participants: [
      {
        id: 'saya',
        nickname: 'Raka',
        animalId: 'harimau',
        isBot: false,
        slot: 1,
        steps: 2,
        status: 'racing',
      },
      {
        id: 'bot-kilat',
        nickname: 'BOT Kilat',
        animalId: 'burung',
        isBot: true,
        slot: 2,
        steps: 1,
        status: 'racing',
      },
    ],
    timeLeftS: 185,
    questionIndex: 1,
    activeQuestion: question,
    finishOrder: [],
    ...overrides,
  };
}

const baseProps = {
  feedback: null,
  feedbackAtMs: null,
  myId: 'saya',
  onAnswer: () => {},
  onSkipToResults: () => {},
};

describe('Balapan (FR-B02, FR-B07)', () => {
  it('menampilkan soal, nomor, sisa waktu m:ss, empat pilihan, dan tanpa kunci', () => {
    const html = renderToStaticMarkup(
      createElement(RaceScreen, { state: makeState(), ...baseProps }),
    );

    expect(html).toContain('Soal 2');
    expect(html).toContain('Sisa 3:05');
    expect(html).toContain('Suhu bumi naik karena gas rumah kaca.');
    expect(html.match(/aria-label="Pilihan [A-D]:/g)).toHaveLength(4);
    // FR-K11: penjelasan/kunci baru boleh tampil setelah menjawab.
    expect(html).not.toContain('Penjelasan');
    expect(html).toContain('Tekan A–D atau 1–4 untuk menjawab.');
  });

  it('pemain yang sudah finish menonton tanpa pilihan jawaban', () => {
    const state = makeState({
      participants: [
        {
          id: 'saya',
          nickname: 'Raka',
          animalId: 'harimau',
          isBot: false,
          slot: 1,
          steps: 5,
          status: 'finished',
          finishOrder: 2,
        },
      ],
      activeQuestion: null,
    });

    const html = renderToStaticMarkup(createElement(RaceScreen, { state, ...baseProps }));

    // Popup langsung muncul: tidak perlu menunggu bot menyelesaikan sisa balapan.
    expect(html).toContain('Finish! Posisi ke-2');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Tonton sisa balapan');
    expect(html).toContain('Lihat hasil sekarang');
    expect(html).not.toContain('aria-label="Pilihan A:');
  });

  it('menampilkan status Keluar dan Soal habis untuk peserta yang berhenti', () => {
    const left = makeState({
      participants: [
        {
          id: 'saya',
          nickname: 'Raka',
          animalId: 'harimau',
          isBot: false,
          slot: 1,
          steps: 1,
          status: 'left',
        },
      ],
      activeQuestion: null,
    });
    expect(
      renderToStaticMarkup(createElement(RaceScreen, { state: left, ...baseProps })),
    ).toContain('Kamu keluar');

    const exhausted = makeState({
      participants: [
        {
          id: 'saya',
          nickname: 'Raka',
          animalId: 'harimau',
          isBot: false,
          slot: 1,
          steps: 3,
          status: 'outOfQuestions',
        },
      ],
      activeQuestion: null,
    });
    expect(
      renderToStaticMarkup(createElement(RaceScreen, { state: exhausted, ...baseProps })),
    ).toContain('Soalmu habis');
  });
});
