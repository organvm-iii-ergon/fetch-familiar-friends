import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to handlers
 * @param {boolean} enabled - Whether shortcuts are enabled
 */
export const useKeyboardShortcuts = (shortcuts, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      const isInputField = ['INPUT', 'TEXTAREA'].includes(event.target.tagName);
      if (isInputField) return;

      // Check for modifier keys
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Build shortcut string
      let shortcutKey = '';
      if (ctrl) shortcutKey += 'ctrl+';
      if (shift) shortcutKey += 'shift+';
      if (alt) shortcutKey += 'alt+';
      shortcutKey += key;

      // Also check just the key
      const handler = shortcuts[shortcutKey] || shortcuts[key];

      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

/**
 * Hook for navigation shortcuts
 * @param {Object} handlers - Navigation handler functions
 */
export const useNavigationShortcuts = ({
  onPrevious,
  onNext,
  onToday,
  enabled = true
}) => {
  const shortcuts = {
    'arrowleft': onPrevious,
    'arrowright': onNext,
    't': onToday,
    'h': onPrevious, // Vim-style
    'l': onNext,     // Vim-style
  };

  useKeyboardShortcuts(shortcuts, enabled);
};

/**
 * Hook for modal shortcuts
 * @param {Object} handlers - Modal handler functions
 */
export const useModalShortcuts = ({
  onJournal,
  onAi,
  onFavorites,
  onStats,
  enabled = true
}) => {
  const shortcuts = {
    'j': onJournal,
    'a': onAi,
    'f': onFavorites,
    's': onStats,
  };

  useKeyboardShortcuts(shortcuts, enabled);
};

/**
 * Hook for theme cycling
 * @param {Function} onCycleTheme - Theme cycle handler
 */
export const useThemeCycleShortcut = (onCycleTheme, enabled = true) => {
  const shortcuts = {
    'ctrl+shift+t': onCycleTheme,
  };

  useKeyboardShortcuts(shortcuts, enabled);
};

export default useKeyboardShortcuts;
