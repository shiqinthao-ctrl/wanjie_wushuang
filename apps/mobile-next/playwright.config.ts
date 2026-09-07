import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4178/mobile-next/', channel: 'chrome', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 720 } } },
    { name: 'phone', use: { ...devices['iPhone 12'], viewport: { width: 390, height: 844 }, defaultBrowserType: 'chromium', channel: 'chrome' } },
    { name: 'narrow', use: { viewport: { width: 320, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run preview', url: 'http://127.0.0.1:4178/mobile-next/', reuseExistingServer: false },
});
