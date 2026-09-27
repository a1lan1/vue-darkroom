import { createApp } from 'vue'
import { registerPlugins } from '@/plugins'

import App from './App.vue'

import '@fontsource-variable/inter'
import '@/styles/main.scss'

/**
 * Initialises Sentry only for production builds that were given a DSN.
 *
 * Failures are swallowed on purpose: error reporting is optional and must
 * never prevent the editor from starting.
 */
async function enableErrorReporting (app: ReturnType<typeof createApp>): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!import.meta.env.PROD || !dsn) {
    return
  }

  try {
    const { init, browserTracingIntegration } = await import('@sentry/vue')

    init({
      app,
      dsn,
      // A photo editor must not leak user content or network identifiers.
      sendDefaultPii: false,
      environment: import.meta.env.MODE,
      integrations: [browserTracingIntegration()],
      tracesSampleRate: 0.1,
    })
  } catch (error) {
    console.warn('[sentry] initialisation failed', error)
  }
}

/**
 * Sentry must be attached before the first render, otherwise errors thrown
 * while mounting escape it. A regular async function is used instead of a
 * top-level `await`, which the configured build target does not support.
 */
async function bootstrap (): Promise<void> {
  const app = createApp(App)

  registerPlugins(app)

  await enableErrorReporting(app)

  app.mount('#app')
}

void bootstrap()
