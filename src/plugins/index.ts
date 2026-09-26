import type { App } from 'vue'
import { ANALYTICS_KEY } from '@/composables/useAnalytics'
import router from '../router'
import pinia from '../stores'
import { analytics, initAnalytics } from './analytics'
import vuetify from './vuetify'

export function registerPlugins (app: App): void {
  app.provide(ANALYTICS_KEY, analytics)

  // Pinia must be installed before the router: route components call
  // `useStore()` during their first render.
  app.use(pinia)
  app.use(vuetify)
  app.use(router)

  void initAnalytics()
}
