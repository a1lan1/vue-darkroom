/**
 * src/constants/shortcuts.ts
 *
 * Single source of truth for the keyboard map.
 *
 * The bindings themselves are still registered where they are implemented
 * (`useEditorHotkeys` for library navigation, `EditControls` for rotate and
 * crop); this list exists so the help dialog and the README describe the same
 * set of keys instead of restating them in prose and drifting.
 *
 * Directions are stated as they actually behave: `rotate(90)` ends in a
 * `CanvasRenderingContext2D.rotate()` call, which turns clockwise, so `[` is
 * the clockwise quarter turn even though the bracket is on the left.
 */
export interface Shortcut {
  keys: ReadonlyArray<string>
  description: string
}

export interface ShortcutGroup {
  title: string
  shortcuts: ReadonlyArray<Shortcut>
}

export const SHORTCUT_GROUPS: ReadonlyArray<ShortcutGroup> = [
  {
    title: 'Library',
    shortcuts: [
      { keys: ['Alt', '←', '→'], description: 'Switch between photos' },
      { keys: ['Backspace'], description: 'Remove the current photo' },
    ],
  },
  {
    title: 'Rotate',
    shortcuts: [
      { keys: ['[', ']'], description: 'Rotate 90° clockwise / counter-clockwise' },
      { keys: ['\'', '\\'], description: 'Rotate 1° clockwise / counter-clockwise' },
    ],
  },
  {
    title: 'Crop',
    shortcuts: [
      { keys: ['C'], description: 'Start cropping' },
      { keys: ['Enter'], description: 'Apply the crop' },
      { keys: ['Esc'], description: 'Cancel the crop' },
    ],
  },
]

/** First-run guidance, kept next to the shortcuts it introduces. */
export const GETTING_STARTED_STEPS: ReadonlyArray<string> = [
  'Import photos, or drag them anywhere onto the window.',
  'Frame the shot with Crop, straighten it with Rotate, then grade it in Adjustments.',
  'Pick a format and size, then use Export All to download the result.',
]
