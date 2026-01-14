import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimerDisplay } from '@/components/TimerDisplay';
import { TimerControls } from '@/components/TimerControls';
import { TimerState } from '@/hooks/useStudyTimer';
import { getRandomQuote } from '@/lib/quotes';
import { cn } from '@/lib/utils';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  timerState: TimerState;
  todayTime: number;
  topicName?: string;
  subtopicName?: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export const FocusMode = ({
  isOpen,
  onClose,
  timerState,
  todayTime,
  topicName,
  subtopicName,
  onStart,
  onPause,
  onResume,
  onEnd,
}: FocusModeProps) => {
  const [quote, setQuote] = useState(getRandomQuote());
  const [showQuote, setShowQuote] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setQuote(getRandomQuote());
      setShowQuote(true);
      
      // Rotate quotes every 30 seconds
      const interval = setInterval(() => {
        setShowQuote(false);
        setTimeout(() => {
          setQuote(getRandomQuote());
          setShowQuote(true);
        }, 500);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 focus-overlay flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Close button */}
        <motion.div 
          className="absolute top-6 right-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Topic/Subtopic label */}
        {(topicName || subtopicName) && (
          <motion.div
            className="absolute top-6 left-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
              <span className="text-sm text-muted-foreground">
                {topicName || 'No Topic'}
                {subtopicName && (
                  <span className="text-primary"> / {subtopicName}</span>
                )}
              </span>
            </div>
          </motion.div>
        )}

        {/* Main content */}
        <div className="flex flex-col items-center gap-8 max-w-2xl px-8">
          {/* Breathing ring animation (when running) */}
          {timerState === 'running' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-[500px] h-[500px] rounded-full border border-primary/10 animate-breathe" />
              <div className="absolute w-[400px] h-[400px] rounded-full border border-primary/5 animate-breathe" style={{ animationDelay: '1s' }} />
            </motion.div>
          )}

          {/* Timer */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative z-10"
          >
            <TimerDisplay
              milliseconds={todayTime}
              size="xl"
              variant={timerState === 'running' ? 'focus' : 'default'}
            />
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10"
          >
            <TimerControls
              state={timerState}
              onStart={onStart}
              onPause={onPause}
              onResume={onResume}
              onEnd={onEnd}
              size="large"
            />
          </motion.div>

          {/* Motivational quote */}
          <motion.div
            className="absolute bottom-12 left-0 right-0 px-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showQuote ? 1 : 0, y: showQuote ? 0 : 10 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-xl mx-auto text-center">
              <Quote className="h-6 w-6 text-primary/40 mx-auto mb-3" />
              <p className="text-lg text-foreground/80 italic mb-2">
                "{quote.text}"
              </p>
              <p className="text-sm text-muted-foreground">
                — {quote.author}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Hint */}
        <motion.p
          className="absolute bottom-6 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px] font-mono">ESC</kbd> to exit
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};

// Button to enter focus mode
interface FocusModeButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const FocusModeButton = ({ onClick, disabled }: FocusModeButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="gap-2"
    >
      <Maximize2 className="h-4 w-4" />
      <span className="hidden sm:inline">Focus Mode</span>
    </Button>
  );
};