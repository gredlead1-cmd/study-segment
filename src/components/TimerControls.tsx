import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimerState } from '@/hooks/useStudyTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimerControlsProps {
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onSkip?: () => void;
  isPomodoroBreak?: boolean;
  size?: 'default' | 'large';
}

export const TimerControls = ({
  state,
  onStart,
  onPause,
  onResume,
  onEnd,
  onSkip,
  isPomodoroBreak = false,
  size = 'default',
}: TimerControlsProps) => {
  const buttonConfig = size === 'large' 
    ? { main: 'h-20 w-20', secondary: 'h-14 w-14', icon: 'h-8 w-8', secondaryIcon: 'h-6 w-6' }
    : { main: 'h-14 w-14', secondary: 'h-12 w-12', icon: 'h-6 w-6', secondaryIcon: 'h-5 w-5' };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const buttonVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div 
      className="flex items-center justify-center gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            whileTap="tap"
          >
            <Button
              size="lg"
              onClick={onStart}
              className={cn(
                buttonConfig.main,
                'rounded-full bg-gradient-to-br from-primary to-primary/80',
                'hover:from-primary/90 hover:to-primary/70',
                'text-primary-foreground shadow-timer',
                'transition-all duration-300 hover:shadow-timer-sm hover:scale-105'
              )}
            >
              <Play className={cn(buttonConfig.icon, 'ml-1')} />
            </Button>
          </motion.div>
        )}
        
        {state === 'running' && (
          <motion.div
            key="running"
            className="flex items-center gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={buttonVariants} whileTap="tap">
              <Button
                size="lg"
                variant="outline"
                onClick={onEnd}
                className={cn(
                  buttonConfig.secondary,
                  'rounded-full border-destructive/30 text-destructive',
                  'hover:bg-destructive hover:text-destructive-foreground hover:border-destructive',
                  'transition-all duration-300'
                )}
              >
                <Square className={buttonConfig.secondaryIcon} />
              </Button>
            </motion.div>
            
            <motion.div variants={buttonVariants} whileTap="tap">
              <Button
                size="lg"
                onClick={onPause}
                className={cn(
                  buttonConfig.main,
                  'rounded-full bg-gradient-to-br from-primary to-primary/80',
                  'hover:from-primary/90 hover:to-primary/70',
                  'text-primary-foreground shadow-timer',
                  'transition-all duration-300'
                )}
              >
                <Pause className={buttonConfig.icon} />
              </Button>
            </motion.div>

            {onSkip && isPomodoroBreak && (
              <motion.div variants={buttonVariants} whileTap="tap">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onSkip}
                  className={cn(
                    buttonConfig.secondary,
                    'rounded-full border-border/50 text-muted-foreground',
                    'hover:bg-accent hover:text-foreground',
                    'transition-all duration-300'
                  )}
                >
                  <SkipForward className={buttonConfig.secondaryIcon} />
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {state === 'paused' && (
          <motion.div
            key="paused"
            className="flex items-center gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={buttonVariants} whileTap="tap">
              <Button
                size="lg"
                variant="outline"
                onClick={onEnd}
                className={cn(
                  buttonConfig.secondary,
                  'rounded-full border-destructive/30 text-destructive',
                  'hover:bg-destructive hover:text-destructive-foreground hover:border-destructive',
                  'transition-all duration-300'
                )}
              >
                <Square className={buttonConfig.secondaryIcon} />
              </Button>
            </motion.div>
            
            <motion.div variants={buttonVariants} whileTap="tap">
              <Button
                size="lg"
                onClick={onResume}
                className={cn(
                  buttonConfig.main,
                  'rounded-full bg-gradient-to-br from-primary to-primary/80',
                  'hover:from-primary/90 hover:to-primary/70',
                  'text-primary-foreground shadow-timer animate-pulse-slow',
                  'transition-all duration-300'
                )}
              >
                <Play className={cn(buttonConfig.icon, 'ml-1')} />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};