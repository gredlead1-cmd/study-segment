import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, PersonStanding, Bell, BellOff, Settings2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  requestNotificationPermission,
  sendNotification,
  isNotificationSupported,
  getNotificationPermission,
} from '@/lib/notifications';
import {
  WellnessSettings,
  loadWellnessSettings,
  saveWellnessSettings,
  DEFAULT_WELLNESS_SETTINGS,
} from '@/lib/wellnessSettings';

interface WellnessRemindersProps {
  isTimerRunning: boolean;
}

const HYDRATION_MESSAGES = [
  "💧 Time to drink some water!",
  "💧 Stay hydrated! Take a sip.",
  "💧 Water break! Your body will thank you.",
  "💧 Hydration check! Grab your water bottle.",
];

const POSTURE_MESSAGES = [
  "🧘 Posture check! Sit up straight.",
  "🧘 Roll your shoulders back and relax.",
  "🧘 Check your posture - spine straight, feet flat.",
  "🧘 Quick stretch! Straighten up and breathe.",
];

export const WellnessReminders = ({ isTimerRunning }: WellnessRemindersProps) => {
  const [settings, setSettings] = useState<WellnessSettings>(DEFAULT_WELLNESS_SETTINGS);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isOpen, setIsOpen] = useState(false);
  
  const hydrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const postureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings on mount
  useEffect(() => {
    setSettings(loadWellnessSettings());
    setNotificationPermission(getNotificationPermission());
  }, []);

  // Request notification permission
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      toast.success('Notifications enabled!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  // Send reminder
  const sendReminder = useCallback((type: 'hydration' | 'posture') => {
    const messages = type === 'hydration' ? HYDRATION_MESSAGES : POSTURE_MESSAGES;
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Show toast notification in-app
    toast(message, {
      duration: 5000,
      icon: type === 'hydration' ? '💧' : '🧘',
    });

    // Send desktop notification if enabled
    if (settings.timerNotificationsEnabled && notificationPermission === 'granted') {
      sendNotification(
        type === 'hydration' ? 'Hydration Reminder' : 'Posture Check',
        { body: message.replace(/^[^\s]+\s/, '') } // Remove emoji from notification body
      );
    }
  }, [settings.timerNotificationsEnabled, notificationPermission]);

  // Hydration reminder interval
  useEffect(() => {
    if (hydrationIntervalRef.current) {
      clearInterval(hydrationIntervalRef.current);
      hydrationIntervalRef.current = null;
    }

    if (isTimerRunning && settings.hydrationEnabled) {
      hydrationIntervalRef.current = setInterval(() => {
        sendReminder('hydration');
      }, settings.hydrationIntervalMinutes * 60 * 1000);
    }

    return () => {
      if (hydrationIntervalRef.current) {
        clearInterval(hydrationIntervalRef.current);
      }
    };
  }, [isTimerRunning, settings.hydrationEnabled, settings.hydrationIntervalMinutes, sendReminder]);

  // Posture reminder interval
  useEffect(() => {
    if (postureIntervalRef.current) {
      clearInterval(postureIntervalRef.current);
      postureIntervalRef.current = null;
    }

    if (isTimerRunning && settings.postureEnabled) {
      postureIntervalRef.current = setInterval(() => {
        sendReminder('posture');
      }, settings.postureIntervalMinutes * 60 * 1000);
    }

    return () => {
      if (postureIntervalRef.current) {
        clearInterval(postureIntervalRef.current);
      }
    };
  }, [isTimerRunning, settings.postureEnabled, settings.postureIntervalMinutes, sendReminder]);

  // Update settings
  const updateSettings = (newSettings: Partial<WellnessSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveWellnessSettings(updated);
  };

  const isAnyReminderActive = settings.hydrationEnabled || settings.postureEnabled;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9"
          title="Wellness Reminders"
        >
          {isAnyReminderActive ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Wellness Reminders
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notification Permission */}
          {isNotificationSupported() && notificationPermission !== 'granted' && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Enable desktop notifications to get reminders even when the tab is in the background.
              </p>
              <Button onClick={handleRequestPermission} size="sm" className="gap-2">
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Button>
            </div>
          )}

          {notificationPermission === 'granted' && (
            <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 rounded-lg p-3">
              <Check className="h-4 w-4" />
              Desktop notifications enabled
            </div>
          )}

          {/* Hydration Reminder */}
          <div className="space-y-4 p-4 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Hydration Reminder</Label>
                  <p className="text-xs text-muted-foreground">Get reminded to drink water</p>
                </div>
              </div>
              <Switch
                checked={settings.hydrationEnabled}
                onCheckedChange={(checked) => updateSettings({ hydrationEnabled: checked })}
              />
            </div>

            {settings.hydrationEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Remind every</span>
                  <span className="font-medium">{settings.hydrationIntervalMinutes} min</span>
                </div>
                <Slider
                  value={[settings.hydrationIntervalMinutes]}
                  onValueChange={(v) => updateSettings({ hydrationIntervalMinutes: v[0] })}
                  min={10}
                  max={60}
                  step={5}
                />
              </motion.div>
            )}
          </div>

          {/* Posture Reminder */}
          <div className="space-y-4 p-4 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <PersonStanding className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Posture Check</Label>
                  <p className="text-xs text-muted-foreground">Reminders to sit up straight</p>
                </div>
              </div>
              <Switch
                checked={settings.postureEnabled}
                onCheckedChange={(checked) => updateSettings({ postureEnabled: checked })}
              />
            </div>

            {settings.postureEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Remind every</span>
                  <span className="font-medium">{settings.postureIntervalMinutes} min</span>
                </div>
                <Slider
                  value={[settings.postureIntervalMinutes]}
                  onValueChange={(v) => updateSettings({ postureIntervalMinutes: v[0] })}
                  min={10}
                  max={60}
                  step={5}
                />
              </motion.div>
            )}
          </div>

          {/* Desktop Notifications Toggle */}
          {notificationPermission === 'granted' && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Desktop Notifications</Label>
                  <p className="text-xs text-muted-foreground">Show system notifications</p>
                </div>
              </div>
              <Switch
                checked={settings.timerNotificationsEnabled}
                onCheckedChange={(checked) => updateSettings({ timerNotificationsEnabled: checked })}
              />
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center">
            Reminders will only appear while the timer is running.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to send timer notifications (for Pomodoro work/break complete)
export const useTimerNotifications = () => {
  const [settings, setSettings] = useState<WellnessSettings>(DEFAULT_WELLNESS_SETTINGS);

  useEffect(() => {
    setSettings(loadWellnessSettings());
  }, []);

  const notifyWorkComplete = useCallback(() => {
    if (settings.timerNotificationsEnabled) {
      toast.success('🎉 Work session complete! Time for a break.');
      if (getNotificationPermission() === 'granted') {
        sendNotification('Work Session Complete', {
          body: 'Great job! Time to take a break.',
        });
      }
    }
  }, [settings.timerNotificationsEnabled]);

  const notifyBreakComplete = useCallback(() => {
    if (settings.timerNotificationsEnabled) {
      toast.info('⏰ Break is over! Ready to focus?');
      if (getNotificationPermission() === 'granted') {
        sendNotification('Break Complete', {
          body: 'Time to get back to work!',
        });
      }
    }
  }, [settings.timerNotificationsEnabled]);

  return { notifyWorkComplete, notifyBreakComplete };
};
