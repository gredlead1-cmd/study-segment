// Wellness reminder settings with localStorage persistence

export interface WellnessSettings {
  hydrationEnabled: boolean;
  hydrationIntervalMinutes: number;
  postureEnabled: boolean;
  postureIntervalMinutes: number;
  timerNotificationsEnabled: boolean;
}

const WELLNESS_KEY = 'studywatch-wellness-settings';

export const DEFAULT_WELLNESS_SETTINGS: WellnessSettings = {
  hydrationEnabled: true,
  hydrationIntervalMinutes: 30,
  postureEnabled: true,
  postureIntervalMinutes: 20,
  timerNotificationsEnabled: true,
};

export const loadWellnessSettings = (): WellnessSettings => {
  const stored = localStorage.getItem(WELLNESS_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_WELLNESS_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_WELLNESS_SETTINGS;
    }
  }
  return DEFAULT_WELLNESS_SETTINGS;
};

export const saveWellnessSettings = (settings: WellnessSettings): void => {
  localStorage.setItem(WELLNESS_KEY, JSON.stringify(settings));
};
