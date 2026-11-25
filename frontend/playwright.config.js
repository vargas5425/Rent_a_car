import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const chromiumDelSistema = ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find((ruta) => existsSync(ruta));

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    locale: 'es-BO',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: chromiumDelSistema
      ? { executablePath: chromiumDelSistema, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
      : {}
  }
});
