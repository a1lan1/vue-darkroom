/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'

/**
 * DarkRoom is a colour-critical surface: the chrome has to stay out of the way
 * of the photograph being judged, so the whole ladder is a desaturated, very
 * slightly cool graphite and the only saturated hue in the product is the
 * amber safelight accent.
 *
 * On-surface colours are intentionally absent — Vuetify derives them by picking
 * the higher-contrast of black and white, which is what keeps amber buttons
 * with dark glyphs and graphite panels with light text.
 */
const darkRoomTheme = {
  dark: true,
  colors: {
    'background': '#0C0D0F',
    'surface': '#141619',
    'surface-bright': '#1B1E23',
    'surface-light': '#23272E',
    'surface-variant': '#2A2F37',
    'on-surface-variant': '#C9CDD4',

    'primary': '#F5A524',
    'secondary': '#7C8595',

    'success': '#3ECF8E',
    'info': '#56A8F5',
    'warning': '#FFC44D',
    'error': '#FF5F56',
  },
  variables: {
    // Vuetify paints borders with `border-color` + `border-opacity`; pointing
    // them at white keeps hairlines visible on every step of the graphite
    // ladder without a per-component override.
    'border-color': '#FFFFFF',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 0.92,
    'medium-emphasis-opacity': 0.66,
    'disabled-opacity': 0.38,
  },
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  icons: {
    // `v-slide-group` arrows and every built-in affordance resolve through
    // this set; leaving it implicit made them depend on import order.
    defaultSet: 'mdi',
  },

  theme: {
    defaultTheme: 'darkRoom',
    themes: {
      darkRoom: darkRoomTheme,
    },
  },

  /*
   * Component defaults are the reason the chrome reads as one system instead
   * of eighty hand-tuned props. Anything a component genuinely needs to
   * override still says so in its template.
   *
   * Note what is deliberately absent: `elevation: 0`. Vuetify turns that prop
   * into an `elevation-N` utility class, and those rules carry `!important` on
   * `box-shadow`, so no component-level `box-shadow` could ever take effect
   * again. `flat` produces an ordinary variant class and stays overridable.
   */
  defaults: {
    VAppBar: {
      flat: true,
    },
    VBtn: {
      rounded: 'lg',
    },
    VCard: {
      flat: true,
      rounded: 'lg',
    },
    VChip: {
      rounded: 'lg',
    },
    VDialog: {
      scrollable: true,
    },
    VField: {
      variant: 'outlined',
      color: 'primary',
    },
    VList: {
      padding: 0,
    },
    VNavigationDrawer: {
      width: 320,
      border: 0,
    },
    VProgressLinear: {
      rounded: true,
      height: 6,
    },
    VSelect: {
      density: 'comfortable',
      variant: 'outlined',
    },
    VSlider: {
      color: 'primary',
      // 16px keeps the thumb grabbable with a finger; Vuetify's 20px default
      // collides with the 10px thumb the sidebar used to ship.
      thumbSize: 16,
      trackSize: 4,
      hideDetails: true,
    },
    VTooltip: {
      location: 'top',
    },
  },
})
