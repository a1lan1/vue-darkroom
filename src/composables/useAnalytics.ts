import { type Analytics, logEvent } from 'firebase/analytics'
import { inject, type InjectionKey, provide, type Ref } from 'vue'

export const ANALYTICS_KEY: InjectionKey<Ref<Analytics | null>> = Symbol('firebaseAnalytics')

export const useAnalytics = (): Ref<Analytics | null> | null => {
  return inject(ANALYTICS_KEY, null)
}

export const provideAnalytics = (analytics: Ref<Analytics | null>) => {
  provide(ANALYTICS_KEY, analytics)
}

export const useLogEvent = () => {
  const analytics = useAnalytics()

  const log = (event: string, params?: Record<string, any>) => {
    if (analytics && analytics.value) {
      logEvent(analytics.value, event, params)
    } else if (import.meta.env.DEV) {
      console.log(`%c[Analytics] ${event}`, 'color: #4CAF50; font-weight: bold;', params)
    }
  }

  return { log }
}
