import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config.mts'

export default defineConfig(
  mergeConfig(
    viteConfig,
    {
      test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/__tests__/**/*.spec.ts'],
        setupFiles: ['src/__tests__/setup.ts'],
        // Vuetify ships per-component CSS imports. Inlining lets Vite process
        // them, which is required to mount real `v-` components in specs.
        server: {
          deps: {
            inline: ['vuetify'],
          },
        },
        coverage: {
          provider: 'v8',
          include: ['src/**/*.{ts,vue}'],
          exclude: ['src/**/*.d.ts', 'src/**/__tests__/**', 'src/main.ts'],
        },
      },
    },
  ),
)
