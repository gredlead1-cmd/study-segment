import { useCallback, useRef, useState, useEffect } from 'react';

type SoundType = 'workComplete' | 'breakComplete' | 'tick' | 'start' | 'stop';

interface UseSoundAlertsReturn {
  playSound: (type: SoundType) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const SOUND_STORAGE_KEY = 'studywatch-sound-settings';

// Generate sounds using Web Audio API (no external files needed)
const createAudioContext = () => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

export function useSoundAlerts(): UseSoundAlertsReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored).enabled ?? true;
      } catch {
        return true;
      }
    }
    return true;
  });
  const [volume, setVolumeState] = useState(() => {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored).volume ?? 0.5;
      } catch {
        return 0.5;
      }
    }
    return 0.5;
  });

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify({ enabled: soundEnabled, volume }));
  }, [soundEnabled, volume]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = createAudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', fadeOut = true) => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Ensure volume is at least 0.01 to avoid exponentialRamp issues
    const safeVolume = Math.max(0.01, volume);
    gainNode.gain.setValueAtTime(safeVolume, ctx.currentTime);
    if (fadeOut) {
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    }
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [getAudioContext, volume]);

  const playChime = useCallback((frequencies: number[], durations: number[], delays: number[]) => {
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, durations[i], 'sine', true);
      }, delays[i] * 1000);
    });
  }, [playTone]);

  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled) return;

    switch (type) {
      case 'workComplete':
        // Triumphant ascending chime (work session done!)
        playChime(
          [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
          [0.3, 0.3, 0.3, 0.5],
          [0, 0.15, 0.3, 0.45]
        );
        break;

      case 'breakComplete':
        // Gentle notification (time to work)
        playChime(
          [440, 554.37, 659.25], // A4, C#5, E5
          [0.2, 0.2, 0.3],
          [0, 0.1, 0.2]
        );
        break;

      case 'start':
        // Quick start beep
        playTone(880, 0.15, 'sine');
        break;

      case 'stop':
        // Descending stop sound
        playChime(
          [659.25, 523.25], // E5, C5
          [0.15, 0.2],
          [0, 0.1]
        );
        break;

      case 'tick':
        // Soft tick (for Pomodoro countdown)
        playTone(1000, 0.05, 'sine');
        break;
    }
  }, [soundEnabled, playChime, playTone]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  return {
    playSound,
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
  };
}
