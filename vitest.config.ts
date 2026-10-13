// Тесты ядра: чистые функции и действия модулей (без Electron и окон). Запуск — npm test.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
