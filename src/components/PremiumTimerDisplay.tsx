import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CircularProgress } from './CircularProgress';

interface PremiumTimerDisplayProps {
  milliseconds: number;
  isActive: boolean;
  isPaused?: boolean;
  mode?: 'work' | 'break' | 'stopwatch';
  progress?: number; // 0-100 for Pomodoro
  label?: string;
}

const formatTime = (ms: number) => {
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

export function PremiumTimerDisplay({
  milliseconds,
  isActive,
  isPaused,
  mode = 'stopwatch',
  progress = 0,
  label,
}: PremiumTimerDisplayProps) {
  const { hours, minutes, seconds, hasHours } = formatTime(milliseconds);
  const showProgress = mode !== 'stopwatch' && isActive;

  const getVariant = () => {
    if (!isActive) return 'default';
    if (mode === 'break') return 'success';
    return 'primary';
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Outer glow ring for active state */}
      <AnimatePresence>
        {isActive && !isPaused && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 320,
              height: 320,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.02, 1],
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className={cn(
              "w-full h-full rounded-full",
              mode === 'break' 
                ? "bg-[radial-gradient(circle,hsl(var(--success)/0.15)_0%,transparent_70%)]"
                : "bg-[radial-gradient(circle,hsl(var(--primary)/0.15)_0%,transparent_70%)]"
            )} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main timer ring */}
      <div className="relative">
        {showProgress ? (
          <CircularProgress
            value={progress}
            size="xl"
            variant={getVariant()}
            strokeWidth={6}
            glowEffect={!isPaused}
            animate
          >
            <div className="flex flex-col items-center gap-1">
              {/* Time display */}
              <div className={cn(
                "font-mono font-bold tracking-tight flex items-baseline gap-0.5",
                isPaused && "animate-pulse-slow"
              )}>
                {hasHours && (
                  <>
                    <TimeDigit value={hours} />
                    <span className="text-2xl text-muted-foreground mx-0.5">:</span>
                  </>
                )}
                <TimeDigit value={minutes} />
                <span className="text-2xl text-muted-foreground mx-0.5">:</span>
                <TimeDigit value={seconds} />
              </div>
              
              {/* Mode label */}
              {label && (
                <motion.span 
                  className={cn(
                    "text-sm font-medium",
                    mode === 'break' ? "text-success" : "text-primary"
                  )}
                  key={label}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {label}
                </motion.span>
              )}
            </div>
          </CircularProgress>
        ) : (
          // Simple display for stopwatch or idle
          <div className="relative">
            {/* Decorative ring */}
            <svg width={280} height={280} className="transform -rotate-90">
              <circle
                cx={140}
                cy={140}
                r={134}
                fill="none"
                strokeWidth={4}
                className="stroke-border/50"
                strokeDasharray="8 4"
              />
              {isActive && (
                <motion.circle
                  cx={140}
                  cy={140}
                  r={134}
                  fill="none"
                  strokeWidth={6}
                  strokeLinecap="round"
                  className="stroke-primary"
                  strokeDasharray={2 * Math.PI * 134}
                  initial={{ strokeDashoffset: 2 * Math.PI * 134 }}
                  animate={{ 
                    strokeDashoffset: 0,
                    opacity: isPaused ? 0.5 : 1,
                  }}
                  transition={{ 
                    strokeDashoffset: { duration: 60, ease: "linear", repeat: Infinity },
                    opacity: { duration: 0.3 },
                  }}
                  style={{
                    filter: !isPaused ? 'drop-shadow(0 0 10px hsl(var(--primary) / 0.5))' : undefined,
                  }}
                />
              )}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={cn(
                "font-mono font-bold tracking-tight flex items-baseline gap-0.5",
                isPaused && "animate-pulse-slow"
              )}>
                {hasHours && (
                  <>
                    <TimeDigit value={hours} size="lg" />
                    <span className="text-3xl text-muted-foreground mx-1">:</span>
                  </>
                )}
                <TimeDigit value={minutes} size="lg" />
                <span className="text-3xl text-muted-foreground mx-1">:</span>
                <TimeDigit value={seconds} size="lg" />
              </div>
              
              {label && (
                <span className="text-sm text-muted-foreground mt-2">{label}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status indicator dots */}
      {isActive && (
        <motion.div 
          className="flex items-center gap-1.5 mt-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isPaused ? "bg-muted-foreground" : mode === 'break' ? "bg-success" : "bg-primary"
              )}
              animate={!isPaused ? {
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              } : {}}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Animated digit component
function TimeDigit({ value, size = 'md' }: { value: string; size?: 'md' | 'lg' }) {
  return (
    <span className={cn(
      "inline-block tabular-nums",
      size === 'lg' ? "text-5xl" : "text-4xl"
    )}>
      {value.split('').map((digit, i) => (
        <motion.span
          key={`${i}-${digit}`}
          className="inline-block"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {digit}
        </motion.span>
      ))}
    </span>
  );
}
