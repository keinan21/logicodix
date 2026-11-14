import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from '../src/client/screens/Home';

vi.mock('../src/client/socket', () => ({ useRoom: () => ({ joinQueue: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());

function renderHome(nickname = '', animalId = 'orangutan') {
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => ({ nickname, animalId })[key],
  });
  return renderToStaticMarkup(createElement(HomeScreen, { onJoin: vi.fn() }));
}

describe('Beranda (FR-M01, FR-M03, FR-M14)', () => {
  it('disables both start actions until a valid nickname is supplied', () => {
    const html = renderHome();
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(renderHome('Raka')).not.toContain('disabled=""');
  });

  it('restores the selected runner and exposes one shared fact panel', () => {
    const html = renderHome('Raka', 'penyu');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Penyu" aria-pressed="true"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Penyu — Penyu dapat mempertahankan napas saat air.');
    expect(html).not.toContain('TODO(P-04)');
  });
});
