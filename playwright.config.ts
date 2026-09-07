import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:45173',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: '/etc/profiles/per-user/warby/bin/chromium',
      args: ['--autoplay-policy=no-user-gesture-required'],
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:45173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
