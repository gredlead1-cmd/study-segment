import { cn } from '@/lib/utils';
import { TimerState } from '@/hooks/useStudyTimer';
import { motion } from 'framer-motion';

interface StatusIndicatorProps {
  state: TimerState;
  pomodoroMode?: 'work' | 'break' | null;
}

export const StatusIndicator = ({ state, pomodoroMode }: StatusIndicatorProps) => {
  const statusConfig = {
    idle: {
      label: 'Ready',
      dotClass: 'bg-muted-foreground',
      animate: false,
    },
    running: {
      label: pomodoroMode === 'break' ? 'Break Time' : 'Studying',
      dotClass: pomodoroMode === 'break' ? 'bg-success' : 'bg-primary',
      animate: true,
    },
    paused: {
      label: 'Paused',
      dotClass: 'bg-warning',
      animate: true,
    },
  };

  const config = statusConfig[state];

  return (
    <motion.div 
      className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/50"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="relative flex h-2.5 w-2.5">
        {config.animate && (
          <span 
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              config.dotClass,
              config.animate && 'animate-ping'
            )} 
          />
        )}
        <span 
          className={cn(
            'relative inline-flex h-2.5 w-2.5 rounded-full',
            config.dotClass
          )} 
        />
      </span>
      <span className="text-sm font-medium text-foreground">
        {config.label}
      </span>
    </motion.div>
  );
};