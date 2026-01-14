// Pomodoro settings and state management
export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export interface PomodoroState {
  isActive: boolean;
  mode: 'work' | 'break';
  currentSession: number;
  timeRemaining: number; // in milliseconds
  isBreakLong: boolean;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export const POMODORO_PRESETS = [
  { name: 'Classic', work: 25, shortBreak: 5, longBreak: 15 },
  { name: 'Short Focus', work: 15, shortBreak: 3, longBreak: 10 },
  { name: 'Deep Work', work: 50, shortBreak: 10, longBreak: 30 },
  { name: 'Sprint', work: 10, shortBreak: 2, longBreak: 5 },
];

// Local storage key for pomodoro settings
const POMODORO_STORAGE_KEY = 'studywatch-pomodoro-settings';

export const savePomodoroSettings = (settings: PomodoroSettings): void => {
  localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(settings));
};

export const loadPomodoroSettings = (): PomodoroSettings => {
  const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_POMODORO_SETTINGS;
    }
  }
  return DEFAULT_POMODORO_SETTINGS;
};