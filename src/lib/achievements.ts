// Achievement system with local storage persistence

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  category: 'time' | 'streak' | 'sessions' | 'special';
  requirement: number;
  unlockedAt?: number;
}

export interface AchievementProgress {
  totalTimeMs: number;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  perfectDays: number; // Days where daily goal was met
}

const ACHIEVEMENTS_KEY = 'studywatch-achievements';
const PROGRESS_KEY = 'studywatch-achievement-progress';

// All available achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Time-based achievements
  { id: 'time-1h', name: 'First Hour', description: 'Study for 1 hour total', icon: '⏱️', category: 'time', requirement: 3600000 },
  { id: 'time-10h', name: 'Getting Started', description: 'Study for 10 hours total', icon: '📚', category: 'time', requirement: 36000000 },
  { id: 'time-50h', name: 'Dedicated Learner', description: 'Study for 50 hours total', icon: '🎯', category: 'time', requirement: 180000000 },
  { id: 'time-100h', name: 'Century Club', description: 'Study for 100 hours total', icon: '💯', category: 'time', requirement: 360000000 },
  { id: 'time-500h', name: 'Master Scholar', description: 'Study for 500 hours total', icon: '🏆', category: 'time', requirement: 1800000000 },
  { id: 'time-1000h', name: 'Legendary', description: 'Study for 1000 hours total', icon: '👑', category: 'time', requirement: 3600000000 },

  // Streak achievements
  { id: 'streak-3', name: 'On a Roll', description: '3-day study streak', icon: '🔥', category: 'streak', requirement: 3 },
  { id: 'streak-7', name: 'Week Warrior', description: '7-day study streak', icon: '⚡', category: 'streak', requirement: 7 },
  { id: 'streak-14', name: 'Fortnight Focus', description: '14-day study streak', icon: '💪', category: 'streak', requirement: 14 },
  { id: 'streak-30', name: 'Monthly Master', description: '30-day study streak', icon: '🌟', category: 'streak', requirement: 30 },
  { id: 'streak-60', name: 'Unstoppable', description: '60-day study streak', icon: '🚀', category: 'streak', requirement: 60 },
  { id: 'streak-100', name: 'Centurion', description: '100-day study streak', icon: '💎', category: 'streak', requirement: 100 },

  // Session achievements
  { id: 'sessions-10', name: 'Getting Going', description: 'Complete 10 study sessions', icon: '✨', category: 'sessions', requirement: 10 },
  { id: 'sessions-50', name: 'Consistent', description: 'Complete 50 study sessions', icon: '📈', category: 'sessions', requirement: 50 },
  { id: 'sessions-100', name: 'Centurion Sessions', description: 'Complete 100 study sessions', icon: '🎖️', category: 'sessions', requirement: 100 },
  { id: 'sessions-500', name: 'Session Master', description: 'Complete 500 study sessions', icon: '🏅', category: 'sessions', requirement: 500 },

  // Special achievements
  { id: 'perfect-week', name: 'Perfect Week', description: 'Meet daily goal 7 days in a row', icon: '🌈', category: 'special', requirement: 7 },
  { id: 'perfect-month', name: 'Perfect Month', description: 'Meet daily goal 30 days in a row', icon: '🎊', category: 'special', requirement: 30 },
];

export const loadUnlockedAchievements = (): Map<string, number> => {
  const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    } catch {
      return new Map();
    }
  }
  return new Map();
};

export const saveUnlockedAchievement = (achievementId: string): void => {
  const unlocked = loadUnlockedAchievements();
  if (!unlocked.has(achievementId)) {
    unlocked.set(achievementId, Date.now());
    const obj = Object.fromEntries(unlocked);
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(obj));
  }
};

export const loadProgress = (): AchievementProgress => {
  const stored = localStorage.getItem(PROGRESS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Return default
    }
  }
  return {
    totalTimeMs: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    perfectDays: 0,
  };
};

export const saveProgress = (progress: AchievementProgress): void => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const checkAndUnlockAchievements = (progress: AchievementProgress): Achievement[] => {
  const unlocked = loadUnlockedAchievements();
  const newlyUnlocked: Achievement[] = [];

  ACHIEVEMENTS.forEach((achievement) => {
    if (unlocked.has(achievement.id)) return;

    let meetsRequirement = false;

    switch (achievement.category) {
      case 'time':
        meetsRequirement = progress.totalTimeMs >= achievement.requirement;
        break;
      case 'streak':
        meetsRequirement = progress.longestStreak >= achievement.requirement;
        break;
      case 'sessions':
        meetsRequirement = progress.totalSessions >= achievement.requirement;
        break;
      case 'special':
        meetsRequirement = progress.perfectDays >= achievement.requirement;
        break;
    }

    if (meetsRequirement) {
      saveUnlockedAchievement(achievement.id);
      newlyUnlocked.push(achievement);
    }
  });

  return newlyUnlocked;
};

export const getAchievementProgress = (achievement: Achievement, progress: AchievementProgress): number => {
  switch (achievement.category) {
    case 'time':
      return Math.min((progress.totalTimeMs / achievement.requirement) * 100, 100);
    case 'streak':
      return Math.min((progress.longestStreak / achievement.requirement) * 100, 100);
    case 'sessions':
      return Math.min((progress.totalSessions / achievement.requirement) * 100, 100);
    case 'special':
      return Math.min((progress.perfectDays / achievement.requirement) * 100, 100);
    default:
      return 0;
  }
};
