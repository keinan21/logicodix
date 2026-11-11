import { expect, test } from '@playwright/test';
import type { RoomState } from '../../src/shared/schema';

// Konfigurasi membangun App terlebih dahulu; seluruh koneksi Socket.IO asli.
for (const leaveDuringCountdown of [false, true]) {
  test(
    leaveDuringCountdown
      ? 'peserta keluar diganti bot tanpa mengulang countdown'
      : 'empat browser masuk soal pertama bersama',
    async ({ browser, baseURL, viewport }, info) => {
      if (!baseURL) throw new Error('Konfigurasi baseURL diperlukan');
      const contexts = await Promise.all(
        Array.from({ length: 4 }, () => browser.newContext({ baseURL, viewport })),
      );
      try {
        const players = await Promise.all(
          contexts.map(async (context, index) => {
            const page = await context.newPage();
            const states: RoomState[] = [];
            let connected!: () => void;
            const websocketReady = new Promise<void>((resolve) => {
              connected = resolve;
            });
            page.on('websocket', (socket) => {
              socket.on('framereceived', ({ payload }) => {
                const packet = payload.toString();
                if (packet === '3probe' || packet.startsWith('40')) connected();
                if (!packet.startsWith('42')) return;
                const [event, state] = JSON.parse(packet.slice(2));
                if (event === 'room:state') states.push(state);
              });
            });
            await page.goto('/');
            await websocketReady;
            await page.getByRole('textbox', { name: 'Nickname' }).fill(`Uji Lobby ${index + 1}`);
            return { page, states };
          }),
        );
        await Promise.all(
          players.map(({ page }) =>
            page.getByRole('button', { name: 'Main', exact: true }).click(),
          ),
        );
        await Promise.all(
          players.map(async ({ page }) => {
            await expect(page.getByRole('heading', { name: 'Siap-siap!' })).toBeVisible();
            await expect(
              page.getByRole('list', { name: 'Peserta balapan' }).getByRole('listitem'),
            ).toHaveCount(4);
            if (!leaveDuringCountdown) {
              for (let playerIndex = 0; playerIndex < 4; playerIndex += 1) {
                await expect(
                  page.getByText(`Uji Lobby ${playerIndex + 1}`, { exact: true }),
                ).toBeVisible();
              }
            }
            await expect(page.getByRole('timer', { name: '3 detik', exact: true })).toBeVisible();
            expect(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            ).toBe(true);
          }),
        );
        const active = leaveDuringCountdown ? players.slice(0, 3) : players;
        if (leaveDuringCountdown) {
          await contexts[3]!.close();
          await Promise.all(
            active.map(async ({ page }) => {
              await expect(page.getByText('BOT Kilat', { exact: true })).toBeVisible();
              await expect(page.getByText('BOT', { exact: true })).toBeVisible();
              await expect(page.getByText('Uji Lobby 4', { exact: true })).toHaveCount(0);
              await expect(
                page.getByRole('list', { name: 'Peserta balapan' }).getByRole('listitem'),
              ).toHaveCount(4);
            }),
          );
        }
        await players[0]!.page.screenshot({ path: info.outputPath('lobby.png') });
        await Promise.all(
          active.map(async ({ page, states }) => {
            await expect(page.locator('.race-screen')).toBeVisible();
            const countdowns = states
              .filter((state) => state.phase === 'lobby')
              .map((state) => state.lobbyCountdownS);
            expect([...new Set(countdowns)]).toEqual([3, 2, 1]);
            expect(
              countdowns.every((value, index) => index === 0 || value! <= countdowns[index - 1]!),
            ).toBe(true);
            if (leaveDuringCountdown) {
              await expect(
                page.locator('.race-track .lane-label-text', { hasText: 'BOT Kilat' }),
              ).toBeVisible();
            }
            expect(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            ).toBe(true);
          }),
        );
        const firstStates = active.map(({ states }) =>
          states.find((state) => state.phase === 'racing')!,
        );
        expect(new Set(firstStates.map((state) => state.roomId)).size).toBe(1);
        for (const state of firstStates) {
          expect(state.activeQuestion).not.toBeNull();
          expect(state.activeQuestion).toEqual(firstStates[0]!.activeQuestion);
          expect(state.participants).toHaveLength(4);
          expect(state.participants.filter((participant) => participant.isBot)).toHaveLength(
            leaveDuringCountdown ? 1 : 0,
          );
        }
      } finally {
        await Promise.all(contexts.map((context) => context.close()));
      }
    },
  );
}
