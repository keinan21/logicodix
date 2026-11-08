import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Lane } from '../src/client/components/Lane';
import type { ParticipantPublic } from '../src/shared/schema';

function participant(overrides: Partial<ParticipantPublic> = {}): ParticipantPublic {
  return {
    id: 'p1',
    nickname: 'Raka',
    animalId: 'harimau',
    isBot: false,
    slot: 2,
    steps: 3,
    status: 'racing',
    ...overrides,
  };
}

describe('Lane (DESIGN §5, FR-B06, FR-B07)', () => {
  it('memakai SVG hewan lokal, bukan emoji', () => {
    const html = renderToStaticMarkup(
      createElement(Lane, { participant: participant(), steps: 3 }),
    );

    expect(html).toContain('<img class="lane-animal"');
    expect(html).not.toContain('🐅');
  });

  it('menampilkan label BOT dan warna label bot', () => {
    const html = renderToStaticMarkup(
      createElement(Lane, {
        participant: participant({ isBot: true, nickname: 'BOT Kilat' }),
        steps: 0,
      }),
    );

    expect(html).toContain('BOT Kilat · BOT');
    expect(html).toContain('color:var(--color-bot)');
  });

  it('menampilkan posisi finish dan status berhenti', () => {
    const finished = renderToStaticMarkup(
      createElement(Lane, {
        participant: participant({ status: 'finished', finishOrder: 2, steps: 5 }),
        steps: 5,
      }),
    );
    expect(finished).toContain('Posisi 2');

    const left = renderToStaticMarkup(
      createElement(Lane, {
        participant: participant({ status: 'left', steps: 1 }),
        steps: 1,
      }),
    );
    expect(left).toContain('Keluar');
  });
});
