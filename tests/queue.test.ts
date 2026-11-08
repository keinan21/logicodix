import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QueueScreen } from '../src/client/screens/Queue';
import { GAME } from '../src/shared/constants';

describe('Antre (FR-M05, FR-M07)', () => {
  it('announces the supplied player count and exposes elapsed time without live announcements', () => {
    const html = renderToStaticMarkup(
      createElement(QueueScreen, { waitingS: 7, found: 2, onCancel: vi.fn() }),
    );
    expect(html).toContain(`Mencari pemain… (2/${GAME.MAX_PLAYERS})`);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('role="timer"');
    expect(html).toContain('Menunggu 7 detik');
    expect(html).toContain('>Batal</button>');
  });

  it('renders updated server values instead of an independent countdown', () => {
    const html = renderToStaticMarkup(
      createElement(QueueScreen, { waitingS: 12, found: 3, onCancel: vi.fn() }),
    );
    expect(html).toContain(`Mencari pemain… (3/${GAME.MAX_PLAYERS})`);
    expect(html).toContain('Menunggu 12 detik');
  });
});
