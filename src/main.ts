import * as Sentry from '@sentry/vue'
import { createApp } from 'vue'
import { registerPlugins } from '@/plugins'

import App from './App.vue'

import 'unfonts.css'

const app = createApp(App)

registerPlugins(app)

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    app,
    dsn: process.env.VUE_APP_SENTRY_DSN,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  })
}

app.mount('#app')
