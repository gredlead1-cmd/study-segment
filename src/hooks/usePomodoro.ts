import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PomodoroSettings, 
  PomodoroState, 
  loadPomodoroSettings,
  savePomodoroSettings,
} from '@/lib/pomodoro';

interface UsePomodoroReturn {
  settings: PomodoroSettings;
  state: PomodoroState;
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  currentMode: 'work' | 'break';
  currentSession: number;
  progress: number;
  totalDuration: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skip: () => void;
  updateSettings: (settings: PomodoroSettings) => void;
}

// Persistence key for pomodoro state
const POMODORO_STATE_KEY = 'studywatch-pomodoro-state';

const savePomodoroState = (state: PomodoroState, isPaused: boolean, lastTick: number) => {
  localStorage.setItem(POMODORO_STATE_KEY, JSON.stringify({
    state,
    isPaused,
    lastTick,
    savedAt: Date.now(),
  }));
};

const loadPomodoroState = (): { state: PomodoroState; isPaused: boolean; lastTick: number } | null => {
  const stored = localStorage.getItem(POMODORO_STATE_KEY);
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored);
    // Only restore if saved within last 24 hours
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(POMODORO_STATE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const clearPomodoroState = () => {
  localStorage.removeItem(POMODORO_STATE_KEY);
};

export function usePomodoro(
  onWorkSessionComplete?: () => void,
  onBreakComplete?: () => void
): UsePomodoroReturn {
  const [settings, setSettings] = useState<PomodoroSettings>(loadPomodoroSettings);
  const [state, setState] = useState<PomodoroState>(() => {
    const saved = loadPomodoroState();
    if (saved && saved.state.isActive) {
      // Calculate elapsed time since last save
      const elapsed = Date.now() - saved.lastTick;
      const newTimeRemaining = Math.max(0, saved.state.timeRemaining - (saved.isPaused ? 0 : elapsed));
      return {
        ...saved.state,
        timeRemaining: newTimeRemaining,
      };
    }
    return {
      isActive: false,
      mode: 'work',
      currentSession: 1,
      timeRemaining: loadPomodoroSettings().workDuration * 60 * 1000,
      isBreakLong: false,
    };
  });
  const [isPaused, setIsPaused] = useState(() => {
    const saved = loadPomodoroState();
    return saved?.isPaused ?? false;
  });
  
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const isRunningRef = useRef(state.isActive && !isPaused);
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);

  // Keep refs in sync
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Calculate durations
  const getTotalDuration = useCallback((mode: 'work' | 'break', isLongBreak: boolean) => {
    const s = settingsRef.current;
    if (mode === 'work') {
      return s.workDuration * 60 * 1000;
    }
    return isLongBreak ? s.longBreakDuration * 60 * 1000 : s.shortBreakDuration * 60 * 1000;
  }, []);

  // Handle phase transition
  const startNextPhase = useCallback(() => {
    const s = settingsRef.current;
    const currentState = stateRef.current;
    
    if (currentState.mode === 'work') {
      const isLongBreak = currentState.currentSession >= s.sessionsBeforeLongBreak;
      const breakDuration = isLongBreak ? s.longBreakDuration : s.shortBreakDuration;
      
      onWorkSessionComplete?.();
      
      setState({
        isActive: true,
        mode: 'break',
        currentSession: currentState.currentSession,
        isBreakLong: isLongBreak,
        timeRemaining: breakDuration * 60 * 1000,
      });
    } else {
      const nextSession = currentState.isBreakLong ? 1 : currentState.currentSession + 1;
      
      onBreakComplete?.();
      
      setState({
        isActive: true,
        mode: 'work',
        currentSession: nextSession,
        isBreakLong: false,
        timeRemaining: s.workDuration * 60 * 1000,
      });
    }
  }, [onWorkSessionComplete, onBreakComplete]);

  // High-precision timer using requestAnimationFrame
  const tick = useCallback(() => {
    if (!isRunningRef.current) return;
    
    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;
    
    setState(prev => {
      const newTimeRemaining = prev.timeRemaining - delta;
      
      if (newTimeRemaining <= 0) {
        // Schedule phase transition outside of setState
        setTimeout(startNextPhase, 0);
        return prev;
      }
      
      return {
        ...prev,
        timeRemaining: newTimeRemaining,
      };
    });
    
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [startNextPhase]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save state when tab becomes hidden
        if (state.isActive) {
          savePomodoroState(state, isPaused, lastTickRef.current);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        // Restore and recalculate when tab becomes visible
        if (isRunningRef.current) {
          const saved = loadPomodoroState();
          if (saved && saved.state.isActive && !saved.isPaused) {
            const elapsed = Date.now() - saved.lastTick;
            const newTimeRemaining = Math.max(0, saved.state.timeRemaining - elapsed);
            
            if (newTimeRemaining <= 0) {
              startNextPhase();
            } else {
              setState(prev => ({ ...prev, timeRemaining: newTimeRemaining }));
            }
          }
          
          lastTickRef.current = Date.now();
          animationFrameRef.current = requestAnimationFrame(tick);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state, isPaused, tick, startNextPhase]);

  // Start animation loop when active and not paused
  useEffect(() => {
    isRunningRef.current = state.isActive && !isPaused;
    
    if (isRunningRef.current && !animationFrameRef.current) {
      lastTickRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(tick);
    } else if (!isRunningRef.current && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Save state periodically
    if (state.isActive) {
      savePomodoroState(state, isPaused, lastTickRef.current);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state.isActive, isPaused, tick, state]);

  const start = useCallback(() => {
    const s = settingsRef.current;
    const newState: PomodoroState = {
      isActive: true,
      mode: 'work',
      currentSession: 1,
      timeRemaining: s.workDuration * 60 * 1000,
      isBreakLong: false,
    };
    setState(newState);
    setIsPaused(false);
    lastTickRef.current = Date.now();
    savePomodoroState(newState, false, lastTickRef.current);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    savePomodoroState(stateRef.current, true, lastTickRef.current);
  }, []);

  const resume = useCallback(() => {
    lastTickRef.current = Date.now();
    setIsPaused(false);
    savePomodoroState(stateRef.current, false, lastTickRef.current);
  }, []);

  const stop = useCallback(() => {
    const s = settingsRef.current;
    setState({
      isActive: false,
      mode: 'work',
      currentSession: 1,
      timeRemaining: s.workDuration * 60 * 1000,
      isBreakLong: false,
    });
    setIsPaused(false);
    clearPomodoroState();
  }, []);

  const skip = useCallback(() => {
    startNextPhase();
  }, [startNextPhase]);

  const updateSettings = useCallback((newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    settingsRef.current = newSettings;
    savePomodoroSettings(newSettings);
    
    if (!stateRef.current.isActive) {
      setState(prev => ({
        ...prev,
        timeRemaining: newSettings.workDuration * 60 * 1000,
      }));
    }
  }, []);

  const totalDuration = getTotalDuration(state.mode, state.isBreakLong);
  const progress = ((totalDuration - state.timeRemaining) / totalDuration) * 100;

  return {
    settings,
    state,
    isActive: state.isActive,
    isPaused,
    timeRemaining: state.timeRemaining,
    currentMode: state.mode,
    currentSession: state.currentSession,
    progress,
    totalDuration,
    start,
    pause,
    resume,
    stop,
    skip,
    updateSettings,
  };
}
