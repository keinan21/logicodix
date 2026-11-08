import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LobbyScreen } from '../src/client/screens/Lobby';
import type { RoomState } from '../src/shared/schema';

const state: RoomState = {
  roomId: 'test',
  phase: 'lobby',
  timeLeftS: 240,
  questionIndex: 0,
  activeQuestion: null,
  finishOrder: [],
  participants: [
    {
      id: 'p1',
      nickname: 'Raka',
      animalId: 'harimau',
      isBot: false,
      slot: 1,
      steps: 0,
      status: 'racing',
    },
    {
      id: 'p2',
      nickname: 'Dina',
      animalId: 'penyu',
      isBot: false,
      slot: 2,
      steps: 0,
      status: 'racing',
    },
    {
      id: 'p3',
      nickname: 'BOT Kilat',
      animalId: 'badak',
      isBot: true,
      slot: 3,
      steps: 0,
      status: 'racing',
    },
    {
      id: 'p4',
      nickname: 'BOT Santai',
      animalId: 'gajah',
      isBot: true,
      slot: 4,
      steps: 0,
      status: 'racing',
    },
  ],
};

describe('Lobby (FR-M09, FR-M11)', () => {
  it.each([3, 2, 1])('displays supplied countdown %i without using the race timer', (countdown) => {
    const html = renderToStaticMarkup(createElement(LobbyScreen, { state, countdown }));
    expect(html).toContain(`aria-label="${countdown} detik"`);
    expect(html).not.toContain('240 detik');
  });
  it('renders all participants, animal names and explicit bot badges', () => {
    const html = renderToStaticMarkup(createElement(LobbyScreen, { state }));
    expect(html.match(/<li /g)).toHaveLength(4);
    expect(html).toContain('alt="Harimau"');
    expect(html).toContain('alt="Penyu"');
    expect(html.match(/>BOT<\/span>/g)).toHaveLength(2);
  });
  it('shows a waiting state instead of a fictitious countdown without room data', () => {
    const html = renderToStaticMarkup(createElement(LobbyScreen, { state: null }));
    expect(html).toContain('Menunggu data peserta…');
    expect(html).not.toContain('role="timer"');
  });
});
