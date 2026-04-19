import { useEffect } from 'react';

type ShortcutHandler = (event: KeyboardEvent) => void;
type ShortcutMap = Record<string, ShortcutHandler>;

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  if (!key) return false;

  const needsMod = parts.includes('mod');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt');

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
  const hasMod = isMac ? event.metaKey : event.ctrlKey;

  if (needsMod !== hasMod) return false;
  if (needsShift !== event.shiftKey) return false;
  if (needsAlt !== event.altKey) return false;

  return event.key.toLowerCase() === key;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        // Still allow mod+z even when focused in an input
        if (!event.metaKey && !event.ctrlKey) return;
      }

      for (const [shortcut, fn] of Object.entries(shortcuts)) {
        if (matchesShortcut(event, shortcut)) {
          fn(event);
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
