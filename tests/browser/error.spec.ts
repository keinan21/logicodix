import { expect, test } from '@playwright/test';

// Transport stub: exercise the real App and screens with controlled server events.
test.beforeEach(async ({ page }) => {
  await page.route('**/src/client/socket.ts', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `import React from '/node_modules/.vite/deps/react.js';
      const { useSyncExternalStore } = React;
      let session = { state: null, myId: null, connected: false, everConnected: false, error: null, found: 1 };
      const listeners = new Set();
      window.setSession = patch => { session = {...session, ...patch}; listeners.forEach(fn => fn()); };
      window.joins = [];
      export function useRoom() {
        const current = useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn); }, () => session);
        return { session: current, joinQueue: payload => window.joins.push(payload), leaveQueue() {}, answer() {},
          reset: () => window.setSession({state: null, error: null}) };
      }`,
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Nickname' })).toBeVisible();
});

test('koneksi pertama gagal menampilkan pemulihan', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Nickname' }).fill('Pemain Uji');
  await page.getByRole('button', { name: 'Main', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Koneksi terputus' })).toBeVisible();
  await expect(page.getByText('Mencoba menyambung lagi…')).toBeVisible();
  await page.evaluate(() =>
    (window as any).setSession({ connected: true, everConnected: true, myId: 'baru' }),
  );
  await expect(page.getByRole('heading', { name: /Mencari pemain/ })).toBeVisible();
});

for (const code of ['resume-expired', 'session-not-found']) {
  test(`${code}: main lagi mengirim satu quick match`, async ({ page }, testInfo) => {
    await page.evaluate((code) => {
      sessionStorage.setItem('nickname', 'Pemain Uji');
      sessionStorage.setItem('animalId', 'penyu');
      (window as any).setSession({
        connected: true,
        everConnected: true,
        error: { code, pesan: 'Pesan teknis' },
      });
    }, code);
    await expect(page.getByRole('heading', { name: 'Kamu keluar dari room' })).toBeVisible();
    await expect(page.getByText('Pesan teknis')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath('error-keluar.png') });
    await page.getByRole('button', { name: 'Main lagi' }).click();
    await expect(page.getByRole('heading', { name: /Mencari pemain/ })).toBeVisible();
    expect(await page.evaluate(() => (window as any).joins)).toEqual([
      { nickname: 'Pemain Uji', animalId: 'penyu', mode: 'quick' },
    ]);
  });
}

test('menunggu konfirmasi resume sebelum kembali ke lobby', async ({ page }) => {
  const state = {
    roomId: 'uji',
    phase: 'lobby',
    lobbyCountdownS: 2,
    participants: [{ id: 'lama', nickname: 'Uji', animalId: 'penyu', isBot: false }],
    timeLeftS: 0,
  };
  await page.evaluate(
    (state) => (window as any).setSession({ state, connected: false, everConnected: true }),
    state,
  );
  await expect(page.getByRole('heading', { name: 'Koneksi terputus' })).toBeVisible();
  await page.evaluate(() => (window as any).setSession({ connected: true, myId: 'baru' }));
  await expect(page.getByRole('heading', { name: 'Koneksi terputus' })).toBeVisible();
  state.participants[0]!.id = 'baru';
  await page.evaluate((state) => (window as any).setSession({ state }), state);
  await expect(page.getByRole('heading', { name: 'Siap-siap!' })).toBeVisible();
});
