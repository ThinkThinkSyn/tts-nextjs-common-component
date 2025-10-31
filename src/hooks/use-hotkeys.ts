'use client'

import { useEffect } from 'react'

export function useHotkeys(shortcuts: Record<string, () => void>, ignoreInputs = true) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (
        (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as HTMLElement)?.isContentEditable) &&
        ignoreInputs
      ) {
        return
      }

      // Build shortcut key string
      let shortcutKey = ''
      if (event.ctrlKey) shortcutKey += 'ctrl+'
      if (event.metaKey) shortcutKey += 'win+'
      if (event.shiftKey) shortcutKey += 'shift+'
      if (event.altKey) shortcutKey += 'alt+'

      shortcutKey += event.key

      // Check if shortcut exists and execute
      if (shortcuts[shortcutKey]) {
        event.preventDefault()
        shortcuts[shortcutKey]()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, ignoreInputs])
}
