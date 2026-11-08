import { defineConfig } from '@playwright/test';

// Los tests E2E manejan un navegador real contra el sistema COMPLETO funcionando:
//   1. docker-compose up --build        (MySQL + backend + frontend)
//   2. aplicar migraciones y datos demo (ver README, sección Testing)
//   3. cd frontend && yarn test:e2e
//
// Se llaman *.e2e.js (y no *.test.js) para que Vitest no intente ejecutarlos.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.js',
  timeout: 30_000,
  workers: 1, // los tests comparten la misma base de datos
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure'
  }
});
