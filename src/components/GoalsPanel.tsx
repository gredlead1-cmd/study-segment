import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loadDailyGoal, saveDailyGoal, loadWeeklyGoal, saveWeeklyGoal } from '@/lib/goals';
import { getAllSegments } from '@/lib/db';
import { cn } from '@/lib/utils';

interface GoalsPanelProps {
  refreshTrigger?: number;
  currentTodayTime: number;
}

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatGoal = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
};

export const GoalsPanel = ({ refreshTrigger, currentTodayTime }: GoalsPanelProps) => {
  const [dailyGoal, setDailyGoal] = useState(loadDailyGoal());
  const [weeklyGoal, setWeeklyGoal] = useState(loadWeeklyGoal());
  const [weeklyTime, setWeeklyTime] = useState(0);
  const [editingDaily, setEditingDaily] = useState(false);
  const [editingWeekly, setEditingWeekly] = useState(false);
  const [dailyInput, setDailyInput] = useState('');
  const [weeklyInput, setWeeklyInput] = useState('');

  useEffect(() => {
    const loadWeeklyData = async () => {
      const segments = await getAllSegments();
      
      // Get start of current week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const weekStart = startOfWeek.getTime();
      
      const weekTotal = segments
        .filter(seg => seg.startTs >= weekStart && seg.endTs)
        .reduce((total, seg) => total + ((seg.endTs || 0) - seg.startTs), 0);
      
      setWeeklyTime(weekTotal);
    };

    loadWeeklyData();
  }, [refreshTrigger]);

  const dailyProgress = Math.min((currentTodayTime / (dailyGoal * 60000)) * 100, 100);
  const weeklyProgress = Math.min((weeklyTime / (weeklyGoal * 60000)) * 100, 100);

  const handleSaveDaily = () => {
    const minutes = parseInt(dailyInput) || dailyGoal;
    setDailyGoal(minutes);
    saveDailyGoal(minutes);
    setEditingDaily(false);
  };

  const handleSaveWeekly = () => {
    const minutes = parseInt(weeklyInput) || weeklyGoal;
    setWeeklyGoal(minutes);
    saveWeeklyGoal(minutes);
    setEditingWeekly(false);
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">Goals</h2>
      </div>

      <div className="space-y-4">
        {/* Daily Goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Daily Goal</span>
            {editingDaily ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={dailyInput}
                  onChange={(e) => setDailyInput(e.target.value)}
                  placeholder={String(dailyGoal)}
                  className="h-6 w-16 text-xs px-2"
                  autoFocus
                />
                <span className="text-xs text-muted-foreground">min</span>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleSaveDaily}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingDaily(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setDailyInput(String(dailyGoal));
                  setEditingDaily(true);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-mono">{formatGoal(dailyGoal)}</span>
                <Edit2 className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  dailyProgress >= 100 
                    ? 'bg-gradient-to-r from-success to-success/80' 
                    : 'bg-gradient-to-r from-primary to-primary/80'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${dailyProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              'font-mono',
              dailyProgress >= 100 ? 'text-success' : 'text-foreground'
            )}>
              {formatDuration(currentTodayTime)}
            </span>
            <span className="text-muted-foreground">
              {dailyProgress >= 100 ? '✓ Goal reached!' : `${Math.round(dailyProgress)}%`}
            </span>
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Weekly Goal</span>
            {editingWeekly ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={weeklyInput}
                  onChange={(e) => setWeeklyInput(e.target.value)}
                  placeholder={String(weeklyGoal)}
                  className="h-6 w-16 text-xs px-2"
                  autoFocus
                />
                <span className="text-xs text-muted-foreground">min</span>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleSaveWeekly}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingWeekly(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setWeeklyInput(String(weeklyGoal));
                  setEditingWeekly(true);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-mono">{formatGoal(weeklyGoal)}</span>
                <Edit2 className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  weeklyProgress >= 100 
                    ? 'bg-gradient-to-r from-success to-success/80' 
                    : 'bg-gradient-to-r from-chart-2 to-chart-2/80'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${weeklyProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              'font-mono',
              weeklyProgress >= 100 ? 'text-success' : 'text-foreground'
            )}>
              {formatDuration(weeklyTime)}
            </span>
            <span className="text-muted-foreground">
              {weeklyProgress >= 100 ? '✓ Goal reached!' : `${Math.round(weeklyProgress)}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};