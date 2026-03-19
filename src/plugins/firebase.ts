import { type Analytics, getAnalytics, isSupported } from 'firebase/analytics'
import { type FirebaseApp, initializeApp } from 'firebase/app'
import { shallowRef } from 'vue'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig)

export const analytics = shallowRef<Analytics | null>(null)

isSupported().then(supported => {
  if (supported && import.meta.env.PROD) {
    analytics.value = getAnalytics(firebaseApp)
  }
})
