# 📸 Vue DarkRoom

![Vue 3](https://img.shields.io/badge/Vue-3.5+-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3+-646CFF?style=flat&logo=vite&logoColor=white)
![Vuetify](https://img.shields.io/badge/Vuetify-3.9+-1867C0?style=flat&logo=vuetify&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3.0+-FFE46B?style=flat&logo=pinia&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

> Photo editor inspired by Adobe Lightroom.

![](./public/images/demo.gif)

## ✨ Features

### 🛠 Powerful Editing Tools
- **Non-Destructive Editing**: The original file is never re-encoded. Crops and colour corrections are re-rendered from the untouched source on preview and on export, so photos can be re-cropped any number of times without quality loss.
- **Crop & Rotate**: 
  - Preset aspect ratios (1:1, 4:3, 16:9, etc.)
  - Free crop
  - Fine rotation (horizon straightening)
- **Color Correction**:
  - Brightness, Contrast, Saturation
  - Sepia, Grayscale, Invert
  - Blur effects

### 📦 Batch Processing & Export
- **Batch Export**: Process and download all edited photos at once as a ZIP archive.
- **Compression Control**: Adjust quality (0-100%) to balance file size and visual fidelity.
- **Format Selection**: Export as JPEG, PNG, or WebP.
- **Resize**: Option to resize images during export (Original, 1920px, 1280px, etc.).

### 🖥 Interface
- **Dark-room theme**: Graphite surfaces with an amber safelight accent, tuned to
  sit next to photographs without competing with them.
- **Responsive layout**: Permanent editing panel from `md` up; below that it
  becomes an overlay drawer driven from the header, with touch-sized targets.
- **Non-destructive preview**: Crops, rotation and colour filters are rendered
  to canvas on every change, so what is on screen is what gets exported.

---

## 🎹 Keyboard Shortcuts

Boost your productivity with these built-in hotkeys:

| Key Combination | Action |
|----------------|--------|
| `Alt` + `←` / `→` | Navigate between photos |
| `Backspace` | Remove current photo |
| `[` / `]` | Rotate 90° clockwise / counter-clockwise |
| `'` / `\` | Rotate 1° clockwise / counter-clockwise |
| `C` | Activate cropper |
| `Enter` | Apply cropper |
| `Esc` | Cancel cropper |

The bindings live in `src/constants/shortcuts.ts` and are the same list the
in-app help dialog renders, so the two cannot drift apart.

---

## 🚀 Tech Stack

This project is built using the latest Vue ecosystem tools:

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **UI Component Library**: [Vuetify 3](https://vuetifyjs.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Image Processing**:
  - [Cropper.js](https://github.com/fengyuanchen/cropperjs) for the interactive crop UI
  - Canvas 2D for full-resolution rendering of the crop and colour filters
  - [JSZip](https://stuk.github.io/jszip/) for bundling files
  - [FileSaver.js](https://github.com/eligrey/FileSaver.js) for downloading
  - [Sentry](https://sentry.io/) (optional) for production error reporting

---

## 🎨 Design System

A dark-room palette: graphite surfaces with a single amber accent, the colour of
a safelight. All tokens live in `src/styles/main.scss` as `--dr-*` custom
properties, and the Vuetify theme in `src/plugins/vuetify.ts` reads from them.

| Token group | Purpose |
|-------------|---------|
| `--dr-brand-*` | Amber accent, rim and blade strokes for the aperture mark |
| `--dr-hairline*` | Border strengths; `--dr-hairline-strong` for interactive edges |
| `--dr-radius-*` | Corner scale, derived from Vuetify's `$border-radius-root` |
| `--dr-dur-*` / `--dr-ease` | Motion tokens, all disabled under `prefers-reduced-motion` |

Type is Inter Variable (`@fontsource-variable/inter`), loaded in `src/main.ts`.

### Vuetify overrides that need care

Five Vuetify behaviours break naive custom CSS, and each one already cost a
debugging round here:

- **`elevation-N` and `rounded-*` utility classes carry `!important`.** Setting
  `elevation: 0` in the component defaults applies `box-shadow !important` to
  every button and card, which silently defeats any later `box-shadow`. Use
  `flat: true` instead; it produces an ordinary variant class that stays
  overridable.
- **Component stylesheets load on first use**, so they are injected *after*
  `main.scss`. A bare `.v-btn` rule ties on specificity and then loses on
  order — global rules are prefixed with `.v-application` to win regardless.
- **`VNavigationDrawer` coerces its `width` prop with `Number()`.** A CSS value
  like `min(100%, 360px)` becomes `NaN`, which collapses the drawer and stops it
  from sliding away when closed. Keep the prop numeric.
- **`.v-btn--icon` sizes itself from `--v-btn-height` *plus* a per-density
  offset**, so the token alone does not give you the box you asked for. At the
  default density a 20px token still renders 32px (`+12px`). The thumbnail remove
  buttons set `width`/`height` literally instead, since 20px is a deliberate
  departure from the stock sizing rather than a value to derive.
- **Overlay positioning is resolved against a containing block, not the
  viewport.** A menu teleported to the body while its activator sits inside a
  fixed drawer measured its offset against neither and landed ~300px past the
  field, which is how the export size list ended up below the fold. Overlays
  that must sit in a predictable spot pass a `locationStrategy` of their own —
  see `sizeListLocation` in `src/components/SidePanel.vue`. Note that Vuetify
  never invokes a custom strategy on open, so it has to schedule its first pass
  itself, and it must set `position: 'fixed'` explicitly or the content falls
  back to its static position.

---

## 🛠 Project Structure

```bash
src/
├── components/        # UI components (editor view, toolbar, side panel, filmstrip)
├── composables/       # Shared logic: photo editor controller, drag & drop, hotkeys
├── constants/         # Static data: the keyboard shortcut map
├── layouts/           # App layouts; owns the single photo editor controller
├── pages/             # Route views
├── plugins/           # Plugin registration (Vuetify, router, analytics)
├── services/          # Framework-free logic: import, crop rendering, export
├── stores/            # Pinia stores (photoStore, appStore)
├── styles/            # Design tokens and global styles
├── types/             # Shared TypeScript types
├── utils/             # Pure helpers (filter building, formatting, clamping)
└── App.vue            # Root component
```

The editor controller is provided by the layout because the crop controls and
the editor view live in sibling subtrees. It is created exactly once per
layout, so the cropper and the preview stay in sync.

---

## 🏁 Getting Started

### Prerequisites
- Node.js 22+
- Yarn 1.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/a1lan1/vue-darkroom.git
   cd vue-darkroom
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start development server**
   ```bash
   yarn dev
   ```

4. **Build for production**
   ```bash
   yarn build
   ```

5. **Run all checks** (lint, types, tests)
   ```bash
   yarn run check
   ```
   Use `yarn run check`, not `yarn check` — Yarn 1 resolves a bare `check` to its
   own dependency-integrity command and never reaches the script.

### Environment

Copy `.env.example` to `.env`. Every variable is optional: the app runs fully
without any of them.

| Variable | Purpose |
|----------|---------|
| `VITE_SENTRY_DSN` | Enables Sentry in production builds only |
| `VITE_FIREBASE_*` | Enables Firebase Analytics; loaded lazily and only in production |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
