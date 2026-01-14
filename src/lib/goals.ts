// Goals and targets management
export interface DailyGoal {
  id: string;
  targetMinutes: number;
  createdAt: number;
}

export interface WeeklyGoal {
  id: string;
  targetMinutes: number;
  createdAt: number;
}

// Local storage keys
const DAILY_GOAL_KEY = 'studywatch-daily-goal';
const WEEKLY_GOAL_KEY = 'studywatch-weekly-goal';

export const DEFAULT_DAILY_GOAL = 120; // 2 hours
export const DEFAULT_WEEKLY_GOAL = 600; // 10 hours

export const saveDailyGoal = (minutes: number): void => {
  const goal: DailyGoal = {
    id: crypto.randomUUID(),
    targetMinutes: minutes,
    createdAt: Date.now(),
  };
  localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(goal));
};

export const loadDailyGoal = (): number => {
  const stored = localStorage.getItem(DAILY_GOAL_KEY);
  if (stored) {
    try {
      const goal: DailyGoal = JSON.parse(stored);
      return goal.targetMinutes;
    } catch {
      return DEFAULT_DAILY_GOAL;
    }
  }
  return DEFAULT_DAILY_GOAL;
};

export const saveWeeklyGoal = (minutes: number): void => {
  const goal: WeeklyGoal = {
    id: crypto.randomUUID(),
    targetMinutes: minutes,
    createdAt: Date.now(),
  };
  localStorage.setItem(WEEKLY_GOAL_KEY, JSON.stringify(goal));
};

export const loadWeeklyGoal = (): number => {
  const stored = localStorage.getItem(WEEKLY_GOAL_KEY);
  if (stored) {
    try {
      const goal: WeeklyGoal = JSON.parse(stored);
      return goal.targetMinutes;
    } catch {
      return DEFAULT_WEEKLY_GOAL;
    }
  }
  return DEFAULT_WEEKLY_GOAL;
};

// Streak calculation
export const calculateStreak = (dayDataMap: Map<string, number>): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  // Check if there's activity today or yesterday to start counting
  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  const todayTime = dayDataMap.get(getDateKey(today)) || 0;
  if (todayTime === 0) {
    // Check yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTime = dayDataMap.get(getDateKey(yesterday)) || 0;
    if (yesterdayTime === 0) {
      return 0; // No streak
    }
    currentDate = new Date(yesterday);
  }
  
  // Count consecutive days
  while (true) {
    const dateKey = getDateKey(currentDate);
    const time = dayDataMap.get(dateKey) || 0;
    
    if (time > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};