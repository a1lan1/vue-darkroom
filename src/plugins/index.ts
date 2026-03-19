import type { App } from 'vue'
import { ANALYTICS_KEY } from '@/composables/useAnalytics'
import router from '../router'
import pinia from '../stores'
import { analytics } from './firebase'
import vuetify from './vuetify'

export function registerPlugins (app: App) {
  app.provide(ANALYTICS_KEY, analytics)

  app
    .use(vuetify)
    .use(router)
    .use(pinia)
}
