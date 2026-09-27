import { config } from '@vue/test-utils'

// Vuetify components are not exercised in unit tests, but the plugin is needed
// for any component that renders a `v-` prefixed element.
config.global.stubs = {
  'transition': false,
  'transition-group': false,
}

// jsdom exposes `getContext` but throws "not implemented" from it. Specs that
// need a real context install their own recording stub; everything else must
// see a clean `null` so the production fallbacks are exercised.
HTMLCanvasElement.prototype.getContext = (() => null) as never

// Vuetify's layout system observes its own element on construction, and jsdom
// ships no ResizeObserver. A no-op keeps `v-app` mountable in component specs.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe (): void {}
    unobserve (): void {}
    disconnect (): void {}
  }
}

// `crypto.randomUUID` is unavailable in insecure contexts and missing in jsdom.
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => 'test-uuid',
    configurable: true,
  })
}

// jsdom implements neither object URL creation nor revocation, and both are part
// of the import/remove lifecycle the store specs exercise.
if (!URL.createObjectURL) {
  Object.defineProperty(URL, 'createObjectURL', {
    value: () => 'blob:mock',
    configurable: true,
    writable: true,
  })
}

if (!URL.revokeObjectURL) {
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: () => undefined,
    configurable: true,
    writable: true,
  })
}
