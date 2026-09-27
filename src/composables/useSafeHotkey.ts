/**
 * Text entry surfaces.
 *
 * These are the only places where a keystroke has a documented meaning of its
 * own: `Alt+ArrowLeft`/`Alt+ArrowRight` move the word cursor in a text field,
 * and `Backspace` deletes characters. Every other shortcut in this app is
 * application-level, so it must not depend on where the focus happens to be.
 */
const TEXT_ENTRY_SELECTOR = [
  'input:not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"])',
  'textarea',
  'select',
  '[contenteditable="true"]',
].join(',')

/**
 * Elements that own their own keyboard interaction.
 *
 * Vuetify's `useHotkey` only skips native `<input>`, `<textarea>` and
 * contentEditable nodes, so widget-based controls stay "unfocused" from its
 * point of view. Relevant for shortcuts that would otherwise collide with the
 * control itself, such as `Backspace` deleting the active photo while a button
 * is focused.
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

function matches (target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null
}

export function isTextEntryTarget (target: EventTarget | null): boolean {
  return matches(target, TEXT_ENTRY_SELECTOR)
}

export function isInteractiveTarget (target: EventTarget | null): boolean {
  return matches(target, INTERACTIVE_SELECTOR)
}

/**
 * Wraps a hotkey handler so it only fires when the user is not typing.
 *
 * Focus on a button, a slider or a thumbnail is irrelevant: a shortcut that is
 * advertised must keep working after the user clicked anything, including the
 * button that started the import.
 */
export function guardTextEntry<T extends (...args: never[]) => void> (handler: T): T {
  return ((...args: Parameters<T>) => {
    if (isTextEntryTarget(document.activeElement)) {
      return
    }

    handler(...args)
  }) as T
}

/**
 * Wraps a hotkey handler so it never fires while the user is interacting with
 * a form control or a button.
 *
 * Reserved for shortcuts that would otherwise trigger the focused control or
 * perform a destructive action.
 */
export function guardHotkey<T extends (...args: never[]) => void> (handler: T): T {
  return ((...args: Parameters<T>) => {
    if (isInteractiveTarget(document.activeElement)) {
      return
    }

    handler(...args)
  }) as T
}
