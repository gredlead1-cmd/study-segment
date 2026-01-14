import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TimerDisplayProps {
  milliseconds: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'active' | 'muted' | 'focus';
  showProgress?: boolean;
  progressValue?: number;
  progressMax?: number;
}

const formatTime = (ms: number): { hours: string; minutes: string; seconds: string; hasHours: boolean } => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    hasHours: hours > 0,
  };
};

export const TimerDisplay = ({ 
  milliseconds, 
  label, 
  size = 'md',
  variant = 'default',
  showProgress = false,
  progressValue = 0,
  progressMax = 100,
}: TimerDisplayProps) => {
  const time = formatTime(milliseconds);
  const progressPercent = progressMax > 0 ? (progressValue / progressMax) * 100 : 0;

  const sizeClasses = {
    sm: {
      container: 'gap-0.5',
      digit: 'text-xl',
      colon: 'text-lg',
      label: 'text-[10px]',
    },
    md: {
      container: 'gap-1',
      digit: 'text-4xl md:text-5xl',
      colon: 'text-3xl md:text-4xl',
      label: 'text-xs',
    },
    lg: {
      container: 'gap-1.5',
      digit: 'text-6xl md:text-7xl',
      colon: 'text-5xl md:text-6xl',
      label: 'text-xs',
    },
    xl: {
      container: 'gap-2',
      digit: 'text-7xl md:text-8xl lg:text-9xl',
      colon: 'text-6xl md:text-7xl lg:text-8xl',
      label: 'text-sm',
    },
  };

  const variantClasses = {
    default: {
      digit: 'text-foreground',
      colon: 'text-muted-foreground',
      label: 'text-muted-foreground',
    },
    active: {
      digit: 'text-gradient',
      colon: 'text-primary/60',
      label: 'text-primary/80',
    },
    muted: {
      digit: 'text-muted-foreground',
      colon: 'text-muted-foreground/60',
      label: 'text-muted-foreground/80',
    },
    focus: {
      digit: 'text-foreground',
      colon: 'text-primary/40',
      label: 'text-muted-foreground',
    },
  };

  const config = sizeClasses[size];
  const colors = variantClasses[variant];

  const digitVariants = {
    initial: { y: 10, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -10, opacity: 0 },
  };

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className={cn(
          'uppercase tracking-[0.2em] font-medium mb-2',
          config.label,
          colors.label
        )}>
          {label}
        </span>
      )}
      
      <div className={cn('flex items-center font-mono font-bold', config.container)}>
        {time.hasHours && (
          <>
            <motion.span
              key={`hours-${time.hours}`}
              variants={digitVariants}
              initial="initial"
              animate="animate"
              className={cn(config.digit, colors.digit, 'tabular-nums tracking-tight')}
            >
              {time.hours}
            </motion.span>
            <span className={cn(config.colon, colors.colon, 'mx-0.5')}>:</span>
          </>
        )}
        <motion.span
          key={`minutes-${time.minutes}`}
          variants={digitVariants}
          initial="initial"
          animate="animate"
          className={cn(config.digit, colors.digit, 'tabular-nums tracking-tight')}
        >
          {time.minutes}
        </motion.span>
        <span className={cn(config.colon, colors.colon, 'mx-0.5')}>:</span>
        <motion.span
          key={`seconds-${time.seconds}`}
          variants={digitVariants}
          initial="initial"
          animate="animate"
          className={cn(config.digit, colors.digit, 'tabular-nums tracking-tight')}
        >
          {time.seconds}
        </motion.span>
      </div>

      {showProgress && (
        <div className="w-full max-w-[200px] mt-4">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};