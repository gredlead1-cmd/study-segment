import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, PersonStanding, Eye, X, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface Activity {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  duration: number; // in seconds
  steps: string[];
  color: string;
}

const activities: Activity[] = [
  {
    id: 'breathing',
    name: 'Box Breathing',
    icon: Wind,
    description: 'Calm your mind with 4-4-4-4 breathing',
    duration: 60,
    steps: [
      'Breathe in slowly... (4 seconds)',
      'Hold your breath... (4 seconds)',
      'Breathe out slowly... (4 seconds)',
      'Hold empty... (4 seconds)',
    ],
    color: 'text-blue-400',
  },
  {
    id: 'stretch-neck',
    name: 'Neck Stretch',
    icon: PersonStanding,
    description: 'Release tension in your neck and shoulders',
    duration: 45,
    steps: [
      'Slowly tilt your head to the right, hold for 10 seconds',
      'Return to center, then tilt to the left, hold for 10 seconds',
      'Drop your chin to your chest, hold for 10 seconds',
      'Gently roll your head in a circle, 3 times each direction',
    ],
    color: 'text-green-400',
  },
  {
    id: 'eye-rest',
    name: '20-20-20 Rule',
    icon: Eye,
    description: 'Rest your eyes from screen strain',
    duration: 20,
    steps: [
      'Look away from your screen',
      'Focus on something 20 feet away',
      'Keep your gaze there for 20 seconds',
      'Blink slowly a few times',
    ],
    color: 'text-purple-400',
  },
];

interface BreakActivitiesProps {
  isBreak?: boolean;
  onActivityComplete?: () => void;
}

export const BreakActivities = ({ isBreak, onActivityComplete }: BreakActivitiesProps) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const progress = selectedActivity 
    ? ((selectedActivity.duration - timeLeft) / selectedActivity.duration) * 100 
    : 0;

  const startActivity = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
    setTimeLeft(activity.duration);
    setCurrentStep(0);
    setIsRunning(true);
  }, []);

  const pauseActivity = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resumeActivity = useCallback(() => {
    setIsRunning(true);
  }, []);

  const resetActivity = useCallback(() => {
    if (selectedActivity) {
      setTimeLeft(selectedActivity.duration);
      setCurrentStep(0);
      setIsRunning(false);
    }
  }, [selectedActivity]);

  const closeActivity = useCallback(() => {
    setSelectedActivity(null);
    setIsRunning(false);
    setTimeLeft(0);
    setCurrentStep(0);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isRunning || !selectedActivity) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onActivityComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, selectedActivity, onActivityComplete]);

  // Update current step based on time
  useEffect(() => {
    if (!selectedActivity) return;
    
    const stepDuration = selectedActivity.duration / selectedActivity.steps.length;
    const elapsed = selectedActivity.duration - timeLeft;
    const newStep = Math.min(
      Math.floor(elapsed / stepDuration),
      selectedActivity.steps.length - 1
    );
    setCurrentStep(newStep);
  }, [timeLeft, selectedActivity]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Activity Buttons - inline in timer container */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
          <PersonStanding className="h-3.5 w-3.5" />
          Quick Break Activities
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {activities.map((activity) => (
            <Button
              key={activity.id}
              variant="outline"
              size="sm"
              onClick={() => startActivity(activity)}
              className="gap-1.5 text-xs h-8 bg-background/50 hover:bg-background/80 border-border/50"
            >
              <activity.icon className={`h-3.5 w-3.5 ${activity.color}`} />
              {activity.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && closeActivity()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedActivity && (
                <>
                  <selectedActivity.icon className={`h-5 w-5 ${selectedActivity.color}`} />
                  {selectedActivity.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-6 py-4">
              {/* Timer Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="relative w-32 h-32 flex items-center justify-center"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/30"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="text-primary"
                      strokeDasharray={283}
                      strokeDashoffset={283 - (283 * progress) / 100}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <span className="text-3xl font-bold font-mono text-foreground">
                    {formatTime(timeLeft)}
                  </span>
                </motion.div>
              </div>

              {/* Current Step */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center px-4"
                >
                  <p className="text-sm text-muted-foreground mb-1">
                    Step {currentStep + 1} of {selectedActivity.steps.length}
                  </p>
                  <p className="text-foreground font-medium">
                    {selectedActivity.steps[currentStep]}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress Bar */}
              <Progress value={progress} className="h-2" />

              {/* Controls */}
              <div className="flex justify-center gap-2">
                {isRunning ? (
                  <Button onClick={pauseActivity} variant="outline" size="lg" className="gap-2">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                ) : timeLeft > 0 ? (
                  <Button onClick={resumeActivity} size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    {timeLeft === selectedActivity.duration ? 'Start' : 'Resume'}
                  </Button>
                ) : (
                  <Button onClick={resetActivity} variant="outline" size="lg" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Restart
                  </Button>
                )}
                <Button onClick={closeActivity} variant="ghost" size="lg">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
