import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ACHIEVEMENTS, 
  Achievement, 
  loadUnlockedAchievements, 
  loadProgress, 
  getAchievementProgress,
  AchievementProgress 
} from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface AchievementsPanelProps {
  refreshTrigger?: number;
}

export const AchievementsPanel = ({ refreshTrigger }: AchievementsPanelProps) => {
  const [unlocked, setUnlocked] = useState<Map<string, number>>(new Map());
  const [progress, setProgress] = useState<AchievementProgress>({
    totalTimeMs: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    perfectDays: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setUnlocked(loadUnlockedAchievements());
    setProgress(loadProgress());
  }, [refreshTrigger]);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'time', name: 'Time' },
    { id: 'streak', name: 'Streaks' },
    { id: 'sessions', name: 'Sessions' },
    { id: 'special', name: 'Special' },
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const unlockedCount = unlocked.size;
  const totalCount = ACHIEVEMENTS.length;

  const formatValue = (achievement: Achievement, prog: AchievementProgress): string => {
    switch (achievement.category) {
      case 'time':
        const hours = Math.floor(prog.totalTimeMs / 3600000);
        const reqHours = Math.floor(achievement.requirement / 3600000);
        return `${hours}/${reqHours}h`;
      case 'streak':
        return `${prog.longestStreak}/${achievement.requirement} days`;
      case 'sessions':
        return `${prog.totalSessions}/${achievement.requirement}`;
      case 'special':
        return `${prog.perfectDays}/${achievement.requirement} days`;
      default:
        return '';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="hidden sm:inline">Achievements</span>
          <Badge variant="secondary" className="ml-1">
            {unlockedCount}/{totalCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
            <Badge variant="outline" className="ml-2">
              {unlockedCount} of {totalCount} unlocked
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5 pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="text-xs h-7"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Achievements List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {filteredAchievements.map((achievement) => {
              const isUnlocked = unlocked.has(achievement.id);
              const progressValue = getAchievementProgress(achievement, progress);
              const unlockedAt = unlocked.get(achievement.id);

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    isUnlocked 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "text-2xl flex-shrink-0",
                      !isUnlocked && "opacity-30 grayscale"
                    )}>
                      {achievement.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={cn(
                          "font-medium text-sm",
                          isUnlocked ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {achievement.name}
                        </h4>
                        {isUnlocked && (
                          <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {achievement.description}
                      </p>

                      {/* Progress */}
                      {!isUnlocked && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-foreground">
                              {formatValue(achievement, progress)}
                            </span>
                          </div>
                          <Progress value={progressValue} className="h-1.5" />
                        </div>
                      )}

                      {/* Unlocked date */}
                      {isUnlocked && unlockedAt && (
                        <p className="text-xs text-primary mt-1">
                          Unlocked {new Date(unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Lock icon for locked */}
                    {!isUnlocked && (
                      <Lock className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Toast notification for newly unlocked achievements
export const AchievementToast = ({ achievement }: { achievement: Achievement }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.9 }}
    className="flex items-center gap-3 bg-background border border-primary/30 rounded-lg p-4 shadow-lg"
  >
    <div className="text-3xl">{achievement.icon}</div>
    <div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">{achievement.name}</span>
        <Sparkles className="h-4 w-4 text-yellow-500" />
      </div>
      <p className="text-sm text-muted-foreground">{achievement.description}</p>
    </div>
  </motion.div>
);
