import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000', browserName: 'chromium', channel: process.env.PLAYWRIGHT_BROWSER==='chromium'||process.platform!=='win32'?undefined:'msedge', headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  reporter: [['list'],['html',{open:'never'}]],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: true, timeout: 120000 },
});
