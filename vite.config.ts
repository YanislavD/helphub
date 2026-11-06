import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind v4 runs as a Vite plugin – no tailwind.config.js, no PostCSS setup.
  plugins: [react(), tailwindcss()],
  test: {
    // Plain unit tests for pure logic; component tests (stage 9) switch to jsdom per file.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'supabase/functions/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // `@/lib/supabase` instead of `../../../lib/supabase`
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
