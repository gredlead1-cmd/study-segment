import { motion } from 'framer-motion';
import { Zap, BookOpen, Rocket, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Preset {
  id: string;
  name: string;
  duration: number; // in minutes
  icon: React.ElementType;
  description: string;
  color: string;
}

const presets: Preset[] = [
  {
    id: 'deep-work',
    name: 'Deep Work',
    duration: 90,
    icon: Rocket,
    description: '90 min focused session for complex tasks',
    color: 'text-orange-500',
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    duration: 25,
    icon: Clock,
    description: '25 min classic Pomodoro session',
    color: 'text-red-500',
  },
  {
    id: 'light-review',
    name: 'Light Review',
    duration: 15,
    icon: BookOpen,
    description: '15 min for quick review or reading',
    color: 'text-blue-500',
  },
  {
    id: 'sprint',
    name: 'Sprint',
    duration: 10,
    icon: Zap,
    description: '10 min quick burst of productivity',
    color: 'text-yellow-500',
  },
];

interface TimerPresetsProps {
  onSelectPreset: (durationMinutes: number) => void;
  disabled?: boolean;
}

export const TimerPresets = ({ onSelectPreset, disabled }: TimerPresetsProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap justify-center gap-2">
        {presets.map((preset, index) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectPreset(preset.duration)}
                  disabled={disabled}
                  className="gap-1.5 text-xs h-8 px-3 bg-background/50 hover:bg-background/80 border-border/50"
                >
                  <preset.icon className={`h-3.5 w-3.5 ${preset.color}`} />
                  <span>{preset.name}</span>
                  <span className="text-muted-foreground">({preset.duration}m)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{preset.description}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>
  );
};
