import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onSkip?: () => void;
  timerState: 'idle' | 'running' | 'paused';
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onStart,
  onPause,
  onResume,
  onEnd,
  onSkip,
  timerState,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        if (timerState === 'idle') {
          onStart();
        } else if (timerState === 'running') {
          onPause();
        } else if (timerState === 'paused') {
          onResume();
        }
        break;

      case 'Escape':
        event.preventDefault();
        if (timerState !== 'idle') {
          onEnd();
        }
        break;

      case 'KeyS':
        // Skip only in break mode if onSkip is provided
        if (onSkip && timerState === 'running') {
          event.preventDefault();
          onSkip();
        }
        break;
    }
  }, [timerState, onStart, onPause, onResume, onEnd, onSkip]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Keyboard shortcuts info for display
export const KEYBOARD_SHORTCUTS = [
  { key: 'Space', description: 'Start / Pause / Resume' },
  { key: 'Escape', description: 'End session' },
  { key: 'S', description: 'Skip break (Pomodoro)' },
] as const;
