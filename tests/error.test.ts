import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { ErrorScreen } from '../src/client/screens/Error';

it('menawarkan main lagi setelah sesi berakhir', () => {
  const html = renderToStaticMarkup(
    createElement(ErrorScreen, {
      code: 'resume-expired',
      pesan: 'Sesi berakhir',
      retrying: false,
      onPlayAgain: vi.fn(),
    }),
  );
  expect(html).toContain('Kamu keluar dari room');
  expect(html).toContain('Main lagi');
});
