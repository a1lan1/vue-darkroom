/**
 * Elements that own their own keyboard interaction.
 *
 * Vuetify's `useHotkey` only skips native `<input>`, `<textarea>` and
 * contentEditable nodes, so widget-based controls stay "unfocused" from its
 * point of view. Without this guard a photo-navigation shortcut also fires
 * while a slider thumb has focus, and `Backspace` deletes the active photo
 * while a button is focused.
 */
const INTERACTIVE_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[role="slider"]',
  '[role="button"]',
  'button',
  'a[href]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="menu"]',
].join(',')

export function isInteractiveTarget (target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  return target.closest(INTERACTIVE_SELECTOR) !== null
}

/**
 * Wraps a hotkey handler so it never fires while the user is interacting with
 * a form control or a button.
 */
export function guardHotkey<T extends (...args: never[]) => void> (handler: T): T {
  return ((...args: Parameters<T>) => {
    if (isInteractiveTarget(document.activeElement)) {
      return
    }

    handler(...args)
  }) as T
}
