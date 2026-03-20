# 📸 Vue DarkRoom

![Vue 3](https://img.shields.io/badge/Vue-3.3+-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4.0+-646CFF?style=flat&logo=vite&logoColor=white)
![Vuetify](https://img.shields.io/badge/Vuetify-3.3+-1867C0?style=flat&logo=vuetify&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-2.1+-FFE46B?style=flat&logo=pinia&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

> Photo editor inspired by Adobe Lightroom.

![](./public/images/demo.gif)

## ✨ Features

### 🛠 Powerful Editing Tools
- **Non-Destructive Editing**: All changes (crop, colors) are applied virtually and only rendered upon export.
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

---

## 🎹 Keyboard Shortcuts

Boost your productivity with these built-in hotkeys:

| Key Combination | Action |
|----------------|--------|
| `Alt` + `←` / `→` | Navigate between photos |
| `Backspace` | Remove current photo |
| `[` / `]` | Rotate 90° Left / Right |
| `'` / `\` | Fine Rotate 1° Left / Right |
| `C` | Activate cropper |
| `Enter` | Apply cropper |
| `Esc` | Cancel cropper |

---

## 🚀 Tech Stack

This project is built using the latest Vue ecosystem tools:

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **UI Component Library**: [Vuetify 3](https://vuetifyjs.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Image Processing**:
  - [Cropper.js](https://github.com/fengyuanchen/cropperjs) for cropping logic
  - [Compressor.js](https://github.com/fengyuanchen/compressorjs) for client-side compression
  - [JSZip](https://stuk.github.io/jszip/) for bundling files
  - [FileSaver.js](https://github.com/eligrey/FileSaver.js) for downloading

---

## 🛠 Project Structure

```bash
src/
├── components/        # UI Components (Editor, Toolbar, SidePanel, etc.)
├── composables/       # Shared logic (Drag&Drop, Hotkeys, Editor logic)
├── layouts/           # App layouts (Default layout with global providers)
├── pages/             # Route views (Main index page)
├── stores/            # Pinia stores (PhotoStore, AppStore)
├── types/             # TypeScript interfaces and types
└── App.vue            # Root component
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v16+)
- Yarn

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

5. **Run linters**
   ```bash
   yarn lint
   yarn type-check
   ```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
