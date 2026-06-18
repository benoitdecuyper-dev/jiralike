import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  // Tests unitaires Vitest : helpers purs (pas de DOM nécessaire).
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}']
  }
});
