import { defineConfig, devices } from '@playwright/test';

/**
 * TODO(T-19): satu skenario e2e — isi nickname, pilih hewan, Lawan bot,
 * jawab sampai balapan berakhir, podium, Evaluasi dengan AI_MODE=mock (ARCHITECTURE §11).
 * Jalankan: npm run e2e (server harus aktif di localhost:3000).
 */
export default defineConfig({
  testDir: './tests-e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile-360', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 760 } } },
    {
      name: 'laptop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
