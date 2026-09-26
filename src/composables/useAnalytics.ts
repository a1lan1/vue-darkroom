import { inject, type InjectionKey, type Ref } from 'vue'

/**
 * Firebase Analytics is a large dependency and is only useful in production.
 * The plugin therefore injects a lazily initialised handle: consumers get a
 * stable object to call, and never pay for the SDK until it resolves.
 *
 * The surface is declared locally instead of imported from the SDK so that a
 * Firebase upgrade cannot change the shape this app depends on.
 */
export interface AnalyticsHandle {
  logEvent: (name: string, params?: Record<string, unknown>) => void
}

export type AnalyticsEventName =
  | 'photo_imported'
  | 'photo_removed'
  | 'photo_edited'
  | 'export_completed'

export type AnalyticsEventParams = Record<string, unknown>

export const ANALYTICS_KEY: InjectionKey<Ref<AnalyticsHandle | null>> = Symbol('analytics')

export function useAnalytics (): Ref<AnalyticsHandle | null> {
  const analytics = inject(ANALYTICS_KEY, null)

  if (!analytics) {
    throw new Error('[analytics] useAnalytics() called without a provider')
  }

  return analytics
}

/**
 * Returns a `log` function that is safe to call at any time: it no-ops until
 * the SDK has finished loading and falls back to the console in development.
 */
export function useLogEvent () {
  const analytics = useAnalytics()

  function log (event: AnalyticsEventName, params?: AnalyticsEventParams): void {
    const instance = analytics.value

    if (!instance) {
      if (import.meta.env.DEV) {
        console.log(`%c[analytics] ${event}`, 'color: #4CAF50; font-weight: bold;', params)
      }

      return
    }

    instance.logEvent(event, params)
  }

  return { log }
}
