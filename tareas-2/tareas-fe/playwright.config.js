import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 100000,
  expect: { timeout: 10000 },
  forbidOnly: Boolean(process.env.CI),
  outputDir: fileURLToPath(new URL('./test-results', import.meta.url)),
  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'never',
        outputFolder: fileURLToPath(
          new URL('./playwright-report', import.meta.url),
        ),
      },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:15173',
    browserName: 'chromium',
    headless: true,
    // No almacenar trazas de red que contengan credenciales o tokens.
    trace: 'off',
    screenshot: 'only-on-failure',
  },
})
