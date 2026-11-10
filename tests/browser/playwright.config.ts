import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  use: { baseURL: 'http://127.0.0.1:5174', browserName: 'chromium', channel: 'chrome' },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    cwd: '../..',
  },
  projects: [
    { name: 'hp', use: { viewport: { width: 360, height: 760 } } },
    { name: 'laptop', use: { viewport: { width: 1280, height: 800 } } },
  ],
});
