import { defineConfig } from '@playwright/test';

// Server terisolasi, bank dummy; tidak memakai server dev atau mengubah content/.
export default defineConfig({
  testDir: '.',
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3027',
    browserName: 'chromium',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'node node_modules/vite/bin/vite.js build && node node_modules/tsx/dist/cli.mjs scripts/dev-dummy.ts',
    env: { PORT: '3027', AI_MODE: 'mock', SEED: '42' },
    url: 'http://127.0.0.1:3027/health',
    reuseExistingServer: false,
    cwd: '../..',
  },
  projects: [
    { name: 'hp', use: { viewport: { width: 360, height: 760 } } },
    { name: 'laptop', use: { viewport: { width: 1280, height: 800 } } },
  ],
});
