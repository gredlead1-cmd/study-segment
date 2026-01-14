import { motion } from 'framer-motion';
import { TrendingUp, Clock, Target, Flame } from 'lucide-react';
import { MiniProgressRing } from './CircularProgress';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  progress?: number;
  trend?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const variantStyles = {
  default: {
    iconBg: 'bg-muted',
    iconColor: 'text-foreground',
  },
  primary: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  success: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  progress,
  trend,
  variant = 'default',
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      className="glass-card rounded-2xl p-4 flex items-center gap-4"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icon with optional progress ring */}
      <div className="relative">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          styles.iconBg
        )}>
          <div className={styles.iconColor}>{icon}</div>
        </div>
        {progress !== undefined && (
          <div className="absolute -top-1 -right-1">
            <MiniProgressRing value={progress} size={20} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono truncate">{value}</span>
          {trend !== undefined && (
            <span className={cn(
              "flex items-center text-xs font-medium",
              trend >= 0 ? "text-success" : "text-destructive"
            )}>
              <TrendingUp className={cn("h-3 w-3 mr-0.5", trend < 0 && "rotate-180")} />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

// Quick stats row component
interface QuickStatsProps {
  todayTime: number;
  weeklyGoalProgress: number;
  streak: number;
  sessionsToday: number;
}

const formatDuration = (ms: number): string => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export function QuickStats({ todayTime, weeklyGoalProgress, streak, sessionsToday }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard
        title="Today"
        value={formatDuration(todayTime)}
        icon={<Clock className="h-5 w-5" />}
        variant="primary"
        subtitle="study time"
      />
      <StatsCard
        title="Weekly Goal"
        value={`${Math.round(weeklyGoalProgress)}%`}
        icon={<Target className="h-5 w-5" />}
        variant={weeklyGoalProgress >= 100 ? 'success' : 'default'}
        progress={Math.min(weeklyGoalProgress, 100)}
      />
      <StatsCard
        title="Streak"
        value={`${streak}`}
        icon={<Flame className="h-5 w-5" />}
        variant={streak >= 7 ? 'warning' : 'default'}
        subtitle="days"
      />
      <StatsCard
        title="Sessions"
        value={`${sessionsToday}`}
        icon={<Clock className="h-5 w-5" />}
        subtitle="today"
      />
    </div>
  );
}
