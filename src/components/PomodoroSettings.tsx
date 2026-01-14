import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Clock, Coffee, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PomodoroSettings, POMODORO_PRESETS } from '@/lib/pomodoro';
import { cn } from '@/lib/utils';

interface PomodoroSettingsDialogProps {
  settings: PomodoroSettings;
  onSettingsChange: (settings: PomodoroSettings) => void;
}

export const PomodoroSettingsDialog = ({
  settings,
  onSettingsChange,
}: PomodoroSettingsDialogProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };

  const applyPreset = (preset: typeof POMODORO_PRESETS[0]) => {
    setLocalSettings({
      ...localSettings,
      workDuration: preset.work,
      shortBreakDuration: preset.shortBreak,
      longBreakDuration: preset.longBreak,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Pomodoro Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Presets */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POMODORO_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'justify-start',
                    localSettings.workDuration === preset.work &&
                    localSettings.shortBreakDuration === preset.shortBreak &&
                      'border-primary bg-primary/10'
                  )}
                >
                  {preset.name === 'Classic' && <Clock className="h-3.5 w-3.5 mr-2" />}
                  {preset.name === 'Short Focus' && <Zap className="h-3.5 w-3.5 mr-2" />}
                  {preset.name === 'Deep Work' && <Brain className="h-3.5 w-3.5 mr-2" />}
                  {preset.name === 'Sprint' && <Coffee className="h-3.5 w-3.5 mr-2" />}
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Work Duration */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">
                Work Duration
              </label>
              <span className="text-sm font-mono text-primary">
                {localSettings.workDuration} min
              </span>
            </div>
            <Slider
              value={[localSettings.workDuration]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, workDuration: value })
              }
              min={5}
              max={90}
              step={5}
              className="py-2"
            />
          </div>

          {/* Short Break */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">
                Short Break
              </label>
              <span className="text-sm font-mono text-primary">
                {localSettings.shortBreakDuration} min
              </span>
            </div>
            <Slider
              value={[localSettings.shortBreakDuration]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, shortBreakDuration: value })
              }
              min={1}
              max={30}
              step={1}
              className="py-2"
            />
          </div>

          {/* Long Break */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">
                Long Break
              </label>
              <span className="text-sm font-mono text-primary">
                {localSettings.longBreakDuration} min
              </span>
            </div>
            <Slider
              value={[localSettings.longBreakDuration]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, longBreakDuration: value })
              }
              min={5}
              max={60}
              step={5}
              className="py-2"
            />
          </div>

          {/* Sessions before long break */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">
                Sessions Before Long Break
              </label>
              <span className="text-sm font-mono text-primary">
                {localSettings.sessionsBeforeLongBreak}
              </span>
            </div>
            <Slider
              value={[localSettings.sessionsBeforeLongBreak]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, sessionsBeforeLongBreak: value })
              }
              min={2}
              max={8}
              step={1}
              className="py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface PomodoroIndicatorProps {
  currentSession: number;
  sessionsBeforeLongBreak: number;
  mode: 'work' | 'break';
  isBreakLong: boolean;
}

export const PomodoroIndicator = ({
  currentSession,
  sessionsBeforeLongBreak,
  mode,
  isBreakLong,
}: PomodoroIndicatorProps) => {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: sessionsBeforeLongBreak }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            index < currentSession
              ? 'bg-primary'
              : index === currentSession - 1 && mode === 'work'
              ? 'bg-primary animate-pulse'
              : 'bg-muted-foreground/30'
          )}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground font-medium">
        {mode === 'work' 
          ? `Session ${currentSession}` 
          : isBreakLong 
          ? 'Long Break' 
          : 'Short Break'}
      </span>
    </div>
  );
};