import { afterEach, describe, expect, it } from 'vitest'
import { guardHotkey, guardTextEntry, isInteractiveTarget, isTextEntryTarget } from '@/composables/useSafeHotkey'

function focus (selector: string): HTMLElement {
  const element = document.createElement(selector)

  document.body.append(element)
  element.focus()

  return element
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.focus()
})

describe('hotkey guards', () => {
  describe('isTextEntryTarget', () => {
    it('treats a text field as text entry', () => {
      const input = focus('input')

      input.type = 'text'
      expect(isTextEntryTarget(document.activeElement)).toBe(true)
    })

    it('does not treat a button as text entry', () => {
      focus('button')

      expect(isTextEntryTarget(document.activeElement)).toBe(false)
    })

    it('does not treat a non-text input as text entry', () => {
      const input = focus('input')

      input.type = 'file'
      expect(isTextEntryTarget(document.activeElement)).toBe(false)
    })
  })

  /**
   * Navigation shortcuts must survive whatever holds the focus.
   *
   * Importing leaves the focus on the "Import Photos" trigger, and the strict
   * guard silently swallowed Alt+Arrow until the user clicked a thumbnail.
   */
  describe('guardTextEntry', () => {
    it('fires while a button holds the focus', () => {
      let fired = 0
      const handler = guardTextEntry(() => {
        fired += 1
      })

      focus('button')
      handler()

      expect(fired).toBe(1)
    })

    it('fires while the body holds the focus', () => {
      let fired = 0
      const handler = guardTextEntry(() => {
        fired += 1
      })

      document.body.focus()
      handler()

      expect(fired).toBe(1)
    })

    it('stays silent while the user is typing in a text field', () => {
      let fired = 0
      const handler = guardTextEntry(() => {
        fired += 1
      })

      const input = focus('input')
      input.type = 'text'
      handler()

      expect(fired).toBe(0)
    })
  })

  /**
   * Destructive and control-owning shortcuts keep the strict behaviour.
   */
  describe('guardHotkey', () => {
    it('stays silent while a button holds the focus', () => {
      let fired = 0
      const handler = guardHotkey(() => {
        fired += 1
      })

      focus('button')
      handler()

      expect(fired).toBe(0)
    })

    it('fires when nothing interactive is focused', () => {
      let fired = 0
      const handler = guardHotkey(() => {
        fired += 1
      })

      document.body.focus()
      handler()

      expect(fired).toBe(1)
    })
  })

  describe('isInteractiveTarget', () => {
    it('detects a widget that owns its own keys', () => {
      const element = document.createElement('div')

      element.setAttribute('role', 'slider')
      element.tabIndex = 0
      document.body.append(element)
      element.focus()

      expect(isInteractiveTarget(document.activeElement)).toBe(true)
    })

    it('returns false for a non-element target', () => {
      expect(isInteractiveTarget(null)).toBe(false)
      expect(isInteractiveTarget(document)).toBe(false)
    })
  })
})
