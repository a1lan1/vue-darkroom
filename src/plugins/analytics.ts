import type { Analytics } from 'firebase/analytics'
import type { AnalyticsHandle } from '@/composables/useAnalytics'
import { shallowRef } from 'vue'

/**
 * Holds the analytics handle once Firebase has finished loading.
 *
 * The SDK is imported dynamically so that development builds and builds
 * without analytics configured never pay for it.
 */
export const analytics = shallowRef<AnalyticsHandle | null>(null)

function isConfigured (): boolean {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_APP_ID)
}

export async function initAnalytics (): Promise<void> {
  if (!import.meta.env.PROD || !isConfigured()) {
    return
  }

  try {
    const [{ getAnalytics, isSupported, logEvent }, { initializeApp }] = await Promise.all([
      import('firebase/analytics'),
      import('firebase/app'),
    ])

    if (!await isSupported()) {
      return
    }

    const instance: Analytics = getAnalytics(initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    }))

    // Only `logEvent` is consumed by the app. Since Firebase v12 it is a
    // standalone function whose parameter types are narrowed to the documented
    // event names, hence the casts.
    analytics.value = {
      logEvent: (name, params) => {
        void logEvent(instance, name as never, params as never)
      },
    }
  } catch (error) {
    // Analytics must never break the app.
    console.warn('[analytics] initialisation failed', error)
  }
}
