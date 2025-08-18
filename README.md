# Vue 3 + Vuetify 3 «Lightroom-like» App — (ts, Pinia, Cropper, Compressor, Zip, Drag&Drop)

## Features

- Dark theme, UI style similar to Adobe Lightroom
- Drag & Drop photo import
- Thumbnail preview with file size chip
- Keyboard shortcuts (via useHotkey)
- Editing: crop, rotate, fine rotate, sepia, color tuning
- Compression quality slider
- Export all photos as ZIP (via compressorjs + jszip + file-saver)

```bash
yarn dev
```

## **Key Features:**

### **1. Modern Lightroom-like Interface**
- Dark theme
- Responsive grid with panels
- Drag & Drop for photo import
- Hotkeys for navigation

### **2. Advanced Photo Editing**
- **Crop**: with preset aspect ratios (1:1, 4:3, 16:9, etc.)
- **Rotate**: 90° increments and fine horizon adjustment
- **Color Correction**: brightness, contrast, saturation, clarity

### **3. Enhanced Gallery**
- File size display
- Edited photo indicators
- Hover effects and animations
- Photo counter

### **4. Export**
- Compression quality settings
- Format selection (JPEG, PNG, WebP)
- Export size options
- Batch processing to ZIP
- Progress bar and indicators

## 🛠 **Technical Features:**

- **Vue 3 Composition API** with TypeScript
- **Pinia** for state management
- **Vuetify 3** for UI components
- **CropperJS** for editing
- **CompressorJS** for compression
- **JSZip** for archive creation
- **File-Saver** for downloads
